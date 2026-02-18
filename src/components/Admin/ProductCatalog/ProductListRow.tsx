import React from 'react';
import { Edit2, Trash2, ToggleLeft, ToggleRight, Beer } from 'lucide-react';
import { Product } from '../../../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types';

interface ProductListRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export const ProductListRow: React.FC<ProductListRowProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-800';
  const catLabel = CATEGORY_LABELS[product.category] || product.category;

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!product.isActive ? 'opacity-60' : ''}`}>
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <Beer className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate max-w-[160px]">{product.name}</p>
            <p className="text-xs text-slate-400 font-mono">{product.reference}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-2 text-sm text-slate-600 hidden sm:table-cell">{product.brand}</td>
      <td className="py-3 px-2 hidden md:table-cell">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
      </td>
      <td className="py-3 px-2 text-xs text-slate-500 hidden lg:table-cell">{product.crateType} · {product.volume}</td>
      <td className="py-3 px-2 text-right">
        <p className="text-sm font-bold text-slate-900">{formatPrice(product.cratePrice)} F</p>
        {product.unitPrice > 0 && (
          <p className="text-xs text-slate-400">{formatPrice(product.unitPrice)} F/u</p>
        )}
      </td>
      <td className="py-3 px-2 hidden md:table-cell text-right text-sm text-orange-600">
        {product.consignPrice > 0 ? `${formatPrice(product.consignPrice)} F` : '—'}
      </td>
      <td className="py-3 px-2 hidden sm:table-cell text-center">
        <button
          onClick={() => onToggleStatus(product)}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            product.isActive
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {product.isActive ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center justify-center w-8 h-8 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="flex items-center justify-center w-8 h-8 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
