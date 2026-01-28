import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'storefront-images';
const MAX_FILE_SIZE = 0.5; // 500KB in MB
const MAX_DIMENSION = 1200; // Max width or height in pixels
const COMPRESSION_QUALITY = 0.8; // 80% quality

export interface StorefrontUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compresse une image au format WebP
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_FILE_SIZE,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: COMPRESSION_QUALITY
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log('Original file size:', file.size / 1024, 'KB');
    console.log('Compressed file size:', compressedFile.size / 1024, 'KB');
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Erreur lors de la compression de l\'image');
  }
}

/**
 * Upload une photo de devanture vers Supabase Storage
 * @param file - Fichier image à uploader
 * @param userId - ID de l'utilisateur
 * @returns Résultat de l'upload avec l'URL publique
 */
export async function uploadStorefrontImage(
  file: File,
  userId: string
): Promise<StorefrontUploadResult> {
  try {
    // Validation du type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: 'Format non supporté. Utilisez JPG, PNG ou WebP.'
      };
    }

    // Validate userId
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        error: 'ID utilisateur invalide'
      };
    }

    // Get existing storefront image URL to delete it later
    const { data: profile } = await supabase
      .from('profiles')
      .select('storefront_image_url')
      .eq('id', userId)
      .single();

    const oldImageUrl = profile?.storefront_image_url;

    // Compression de l'image
    let compressedFile: File;
    try {
      compressedFile = await compressImage(file);
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la compression de l\'image'
      };
    }

    // Générer le chemin : userId/storefront_timestamp.webp
    const timestamp = Date.now();
    const fileName = `storefront_${timestamp}.webp`;
    const filePath = `${userId}/${fileName}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite - each upload creates a new file
        contentType: 'image/webp'
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Erreur lors de l'upload: ${error.message}`
      };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Mettre à jour le profil avec l'URL de l'image
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ storefront_image_url: urlData.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Ne pas échouer complètement, l'image est uploadée
    }

    // Delete old image if it exists
    if (oldImageUrl && oldImageUrl !== urlData.publicUrl) {
      try {
        await deleteOldStorefrontImage(oldImageUrl);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Don't fail the upload if old image deletion fails
      }
    }

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Exception uploading storefront image:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload'
    };
  }
}

/**
 * Helper function to delete an old storefront image
 */
async function deleteOldStorefrontImage(imageUrl: string): Promise<void> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.error('Invalid image URL format for deletion');
      return;
    }
    const filePath = urlParts[1];

    // Supprimer du storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting old image:', error);
    } else {
      console.log('Old storefront image deleted successfully');
    }
  } catch (error) {
    console.error('Exception deleting old image:', error);
  }
}

/**
 * Supprime une photo de devanture
 */
export async function deleteStorefrontImage(
  userId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.error('Invalid image URL format');
      return false;
    }
    const filePath = urlParts[1];

    // Supprimer du storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ storefront_image_url: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Ne pas échouer complètement, l'image est supprimée du storage
    }

    return true;
  } catch (error) {
    console.error('Exception deleting storefront image:', error);
    return false;
  }
}

/**
 * Obtient l'URL publique d'une image de devanture
 */
export function getStorefrontImageUrl(userId: string, fileName: string): string {
  const filePath = `${userId}/${fileName}`;
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
  return data.publicUrl;
}
