import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image, AlertCircle } from 'lucide-react';
import { Product } from '../../../types';
import { CreateProductInput } from '../../../services/admin/productAdminService';
import { CATEGORIES, CATEGORY_LABELS, CRATE_TYPES } from './types';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSubmit: (input: CreateProductInput, imageFile?: File) => Promise<void>;
}

const EMPTY_FORM: CreateProductInput = {
  reference: '',
  name: '',
  category: 'biere',
  brand: '',
  crateType: 'B33',
  volume: '',
  unitPrice: 0,
  cratePrice: 0,
  consignPrice: 0,
  description: '',
  alcoholContent: undefined,
  isActive: true,
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateProductInput>(
    product
      ? {
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
          alcoholContent: product.alcoholContent,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
          imagePath: product.imagePath,
        }
      : { ...EMPTY_FORM }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.reference.trim()) newErrors.reference = 'Référence obligatoire';
    if (!form.name.trim()) newErrors.name = 'Nom obligatoire';
    if (!form.brand.trim()) newErrors.brand = 'Marque obligatoire';
    if (!form.volume.trim()) newErrors.volume = 'Volume obligatoire';
    if (form.cratePrice <= 0) newErrors.cratePrice = 'Prix casier requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form, imageFile || undefined);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, key: keyof CreateProductInput, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form[key] as string | number) ?? ''}
        onChange={(e) => {
          const val = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
          setForm((prev) => ({ ...prev, [key]: val }));
          if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
        }}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-300'
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Photo du produit</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choisir une image
                  </button>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 2 Mo</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('Référence', 'reference', 'text', true)}
              {field('Nom du produit', 'name', 'text', true)}
              {field('Marque', 'brand', 'text', true)}
              {field('Volume (ex: 33cl)', 'volume', 'text', true)}
            </div>

            {/* Category & crate type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Catégorie<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Type de casier<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  value={form.crateType}
                  onChange={(e) => setForm((prev) => ({ ...prev, crateType: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CRATE_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Prix unité (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.unitPrice || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Prix casier (FCFA)<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.cratePrice || ''}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, cratePrice: parseFloat(e.target.value) || 0 }));
                    if (errors.cratePrice) setErrors((prev) => ({ ...prev, cratePrice: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.cratePrice ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {errors.cratePrice && <p className="text-xs text-red-500 mt-0.5">{errors.cratePrice}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Consigne (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.consignPrice || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, consignPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Optional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Degré d'alcool (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.alcoholContent ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, alcoholContent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="0 si sans alcool"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                <select
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Description optionnelle..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                product ? 'Enregistrer' : 'Créer le produit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
