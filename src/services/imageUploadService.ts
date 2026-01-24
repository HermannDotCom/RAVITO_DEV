import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Upload une image de produit vers Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  category?: string
): Promise<UploadResult> {
  // Validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'Fichier trop volumineux. Maximum 2 Mo.' };
  }

  // Générer le chemin : category/productId-timestamp.ext
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const folder = category || 'autres';
  const fileName = `${productId}-${Date.now()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Exception uploading image:', error);
    return { success: false, error: 'Erreur lors de l\'upload' };
  }
}

/**
 * Supprime une image de produit
 */
export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception deleting image:', error);
    return false;
  }
}

/**
 * Obtient l'URL publique d'une image
 */
export function getProductImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  return data.publicUrl;
}
