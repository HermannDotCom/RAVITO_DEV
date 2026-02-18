import React from 'react';
import { Package, Edit2, Trash2, ToggleLeft, ToggleRight, Beer } from 'lucide-react';
import { Product } from '../../../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n);

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-800';
  const catLabel = CATEGORY_LABELS[product.category] || product.category;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
      product.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-70'
    }`}>
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-t-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Beer className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {!product.isActive && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-slate-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Inactif
            </span>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
          {catLabel}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-slate-400 font-mono mb-0.5">{product.reference}</p>
        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-0.5 truncate">{product.name}</h3>
        <p className="text-xs text-slate-500 mb-2">{product.brand} · {product.volume} · {product.crateType}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400">Casier</p>
            <p className="text-sm font-bold text-slate-900">{formatPrice(product.cratePrice)} F</p>
          </div>
          {product.unitPrice > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Unité</p>
              <p className="text-sm font-semibold text-slate-700">{formatPrice(product.unitPrice)} F</p>
            </div>
          )}
          {product.consignPrice > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Consigne</p>
              <p className="text-sm font-semibold text-orange-600">{formatPrice(product.consignPrice)} F</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleStatus(product)}
            title={product.isActive ? 'Désactiver' : 'Activer'}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0 ${
              product.isActive
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {product.isActive ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={() => onDelete(product)}
            className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
