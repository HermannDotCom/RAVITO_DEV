import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product, ProductCategory, CrateType } from '../../../types';
import { ProductImageUpload } from './ProductImageUpload';

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export interface ProductFormData {
  reference: string;
  name: string;
  category: ProductCategory;
  brand: string;
  crateType: CrateType;
  volume: string;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  description?: string;
  alcoholContent?: number;
  imagePath?: string;
  imageUrl?: string;
  isActive: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    reference: '',
    name: '',
    category: 'biere' as ProductCategory,
    brand: '',
    crateType: 'B33' as CrateType,
    volume: '',
    unitPrice: 0,
    cratePrice: 0,
    consignPrice: 3000,
    description: '',
    alcoholContent: 0,
    imagePath: '',
    imageUrl: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        reference: product.reference,
        name: product.name,
        category: product.category,
        brand: product.brand,
        crateType: product.crateType,
        volume: product.volume,
        unitPrice: product.unitPrice,
        cratePrice: product.cratePrice,
        consignPrice: product.consignPrice,
        description: product.description || '',
        alcoholContent: product.alcoholContent || 0,
        imagePath: product.imagePath || '',
        imageUrl: product.imageUrl || '',
        isActive: product.isActive,
      });
    }
  }, [product]);

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'biere', label: 'Bières' },
    { value: 'soda', label: 'Sodas' },
    { value: 'vin', label: 'Vins' },
    { value: 'eau', label: 'Eaux' },
    { value: 'spiritueux', label: 'Spiritueux' },
  ];

  const crateTypes: { value: CrateType; label: string; description: string }[] = [
    { value: 'B33', label: 'B33', description: 'Casier 33cl/30cl (24 bouteilles)' },
    { value: 'B65', label: 'B65', description: 'Casier 65cl/50cl (12 bouteilles)' },
    { value: 'B100', label: 'B100', description: 'Casier Bock 100cl' },
    { value: 'B50V', label: 'B50V', description: 'Casier Vin Valpière 50cl' },
    { value: 'B100V', label: 'B100V', description: 'Casier Vin Valpière 100cl' },
    { value: 'C6', label: 'C6', description: '6 bouteilles (1.5L)' },
    { value: 'C20', label: 'C20', description: 'Casier 20 bouteilles' },
    { value: 'CARTON24', label: 'CARTON24', description: 'Carton 24 (jetable)' },
    { value: 'PACK6', label: 'PACK6', description: 'Pack 6 (jetable)' },
    { value: 'PACK12', label: 'PACK12', description: 'Pack 12 (jetable)' },
  ];

  // Default consign prices by crate type
  const DEFAULT_CONSIGN_PRICES: Record<CrateType, number> = {
    B33: 3000,
    B65: 3000,
    B100: 3000,
    B50V: 3000,
    B100V: 3000,
    C6: 2000,
    C20: 3000,
    CARTON24: 0, // Disposable, no consigne
    PACK6: 0,    // Disposable, no consigne
    PACK12: 0,   // Disposable, no consigne
  };

  const getDefaultConsignPrice = (crateType: CrateType): number => {
    return DEFAULT_CONSIGN_PRICES[crateType] || 3000;
  };

  const handleCrateTypeChange = (newCrateType: CrateType) => {
    setFormData({
      ...formData,
      crateType: newCrateType,
      consignPrice: getDefaultConsignPrice(newCrateType),
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reference.trim()) newErrors.reference = 'Référence requise';
    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.brand.trim()) newErrors.brand = 'Marque requise';
    if (!formData.volume.trim()) newErrors.volume = 'Volume requis';
    if (formData.cratePrice <= 0) newErrors.cratePrice = 'Prix casier requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave(formData);
  };

  const handleImageUploaded = (path: string, url: string) => {
    setFormData({ ...formData, imagePath: path, imageUrl: url });
  };

  const handleImageRemoved = () => {
    setFormData({ ...formData, imagePath: '', imageUrl: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="md:col-span-2">
              <ProductImageUpload
                currentImagePath={formData.imagePath}
                currentImageUrl={formData.imageUrl}
                productId={product?.id}
                category={formData.category}
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Référence <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
              {errors.reference && <p className="text-sm text-red-600 mt-1">{errors.reference}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
              {errors.brand && <p className="text-sm text-red-600 mt-1">{errors.brand}</p>}
            </div>

            {/* Crate Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de casier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.crateType}
                onChange={(e) => handleCrateTypeChange(e.target.value as CrateType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              >
                {crateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Volume <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                placeholder="Ex: 33cl, 65cl, 1L"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
              {errors.volume && <p className="text-sm text-red-600 mt-1">{errors.volume}</p>}
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix unitaire (FCFA)
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            {/* Crate Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix casier (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.cratePrice}
                onChange={(e) => setFormData({ ...formData, cratePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
              {errors.cratePrice && <p className="text-sm text-red-600 mt-1">{errors.cratePrice}</p>}
            </div>

            {/* Consign Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix consigne (FCFA)
              </label>
              <input
                type="number"
                value={formData.consignPrice}
                onChange={(e) => setFormData({ ...formData, consignPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            {/* Alcohol Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux d'alcool (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.alcoholContent}
                onChange={(e) => setFormData({ ...formData, alcoholContent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            {/* Is Active */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  disabled={isSaving}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Produit actif
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : product ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
