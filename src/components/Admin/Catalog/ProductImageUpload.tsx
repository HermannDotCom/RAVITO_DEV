import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadProductImage, deleteProductImage } from '../../../services/imageUploadService';

interface ProductImageUploadProps {
  currentImagePath?: string;
  currentImageUrl?: string;
  productId?: string;
  category?: string;
  onImageUploaded: (path: string, url: string) => void;
  onImageRemoved: () => void;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  currentImagePath,
  currentImageUrl,
  productId,
  category,
  onImageUploaded,
  onImageRemoved,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Preview local immédiat
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload vers Supabase
    const tempId = productId || `temp-${Date.now()}`;
    const result = await uploadProductImage(file, tempId, category);

    setIsUploading(false);

    if (result.success && result.path && result.url) {
      // Upload succeeded - cleanup local preview and use remote URL
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(result.url);
      onImageUploaded(result.path, result.url);
    } else {
      // Upload failed - keep local preview temporarily, show error
      setError(result.error || 'Erreur lors de l\'upload');
      // Revert to current image if available, otherwise keep showing the failed upload preview briefly
      setTimeout(() => {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(currentImageUrl || null);
      }, 2000);
    }
  };

  const handleRemove = async () => {
    if (currentImagePath) {
      await deleteProductImage(currentImagePath);
    }
    setPreviewUrl(null);
    onImageRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Image du produit
      </label>
      
      <div className="relative">
        {previewUrl ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs">Ajouter image</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Formats: JPG, PNG, WebP • Max: 2 Mo
      </p>
    </div>
  );
};
