import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader, ImageIcon } from 'lucide-react';
import { uploadStorefrontImage, deleteStorefrontImage } from '../../services/storefrontImageService';

interface StorefrontImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onDeleteSuccess?: () => void;
}

export const StorefrontImageUpload: React.FC<StorefrontImageUploadProps> = ({
  userId,
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Créer un preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    
    try {
      const result = await uploadStorefrontImage(file, userId);
      
      if (result.success && result.url) {
        setImageUrl(result.url);
        setPreviewUrl(null);
        onUploadSuccess?.(result.url);
        
        // Success message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        message.textContent = '✅ Photo uploadée avec succès !';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      onUploadError?.(errorMessage);
      
      // Error message
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
      message.textContent = `❌ ${errorMessage}`;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);
      
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?');
    if (!confirmed) return;
    
    setIsUploading(true);
    
    try {
      const success = await deleteStorefrontImage(userId, imageUrl);
      
      if (success) {
        setImageUrl(null);
        onDeleteSuccess?.();
        
        // Success message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        message.textContent = '✅ Photo supprimée avec succès !';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      
      // Error message
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
      message.textContent = '❌ Erreur lors de la suppression';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  const openCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const displayUrl = previewUrl || imageUrl;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Camera className="h-5 w-5 mr-2 text-orange-600" />
            Photo de la devanture
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Aide les livreurs à identifier votre établissement
          </p>
        </div>
        {imageUrl && !isUploading && (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Supprimer la photo"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Image Preview */}
      <div className="mb-4">
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {isUploading ? (
            <div className="text-center">
              <Loader className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Upload en cours...</p>
              <p className="text-xs text-gray-500 mt-1">Compression et envoi de l'image</p>
            </div>
          ) : displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Devanture"
                className="w-full h-full object-cover"
              />
              {previewUrl && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader className="h-12 w-12 text-white animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">Aucune photo</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isUploading && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={openCameraInput}
            className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            <Camera className="h-5 w-5" />
            <span>Prendre une photo</span>
          </button>
          <button
            onClick={openFileInput}
            className="flex items-center justify-center space-x-2 border-2 border-orange-600 text-orange-600 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>Choisir un fichier</span>
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help Text */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 flex items-start">
          <span className="text-lg mr-2">💡</span>
          <span>
            <strong>Conseil :</strong> Prenez une photo de jour montrant clairement l'enseigne ou l'entrée de votre établissement.
          </span>
        </p>
      </div>
    </div>
  );
};
