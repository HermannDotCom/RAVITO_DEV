import React from 'react';

export interface PriceTagProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'promo' | 'muted';
  originalAmount?: number;
  discount?: number;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  currency = 'FCFA',
  size = 'md',
  variant = 'default',
  originalAmount,
  discount
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const variantClasses = {
    default: 'text-orange-600 font-bold',
    promo: 'text-orange-600 font-bold',
    muted: 'text-gray-500'
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {/* Prix actuel */}
      <span className={`font-mono tabular-nums ${sizeClasses[size]} ${variantClasses[variant]}`}>
        {formatPrice(amount)} {currency}
      </span>

      {/* Prix original barré (pour promo) */}
      {variant === 'promo' && originalAmount && (
        <span className="font-mono tabular-nums text-gray-400 line-through text-sm">
          {formatPrice(originalAmount)} {currency}
        </span>
      )}

      {/* Badge réduction */}
      {variant === 'promo' && discount && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          -{discount}%
        </span>
      )}
    </div>
  );
};
