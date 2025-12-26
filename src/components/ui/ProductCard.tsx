import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package2 } from 'lucide-react';
import { Product } from '../../types';
import { PriceTag } from './PriceTag';

export interface ProductCardProps {
  product: Product;
  onAddToCart: (quantity: number, withConsigne: boolean) => void;
  isInCart?: boolean;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isInCart = false,
  cartQuantity = 0,
}) => {
  const [quantity, setQuantity] = useState(cartQuantity || 1);
  const [withConsigne, setWithConsigne] = useState(false);

  const getCrateTypeDescription = (crateType: string) => {
    const descriptions: { [key: string]: string } = {
      C24: '24 x 33cl',
      C12: '12 x 66cl',
      C12V: '12 x 75cl',
      C6: '6 x 1.5L',
    };
    return descriptions[crateType] || crateType;
  };

  const handleAddToCart = () => {
    onAddToCart(quantity, withConsigne);
  };

  const updateQuantity = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl sm:hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Image avec ratio 4:3 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        {/* Badge marque en overlay */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className="inline-flex items-center px-2 py-1 sm:px-3 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-900 shadow-md">
            {product.brand}
          </span>
        </div>
        {isInCart && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-md">
              <ShoppingCart size={12} />
              {cartQuantity}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3 sm:p-4">
        {/* Nom et volume */}
        <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 overflow-hidden line-clamp-2" style={{
          minHeight: '2.5rem'
        }}>
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          {getCrateTypeDescription(product.crateType)} • {product.volume}
        </p>

        {/* Prix */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-baseline gap-2">
            <PriceTag amount={product.cratePrice} size="lg" />
            <span className="text-xs sm:text-sm text-gray-500">/ casier</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            <PriceTag amount={product.unitPrice} size="sm" variant="muted" />
            <span className="text-gray-500"> / unité</span>
          </div>
        </div>

        {/* Sélecteur de quantité */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => updateQuantity(-1)}
            className="p-3 min-h-[48px] min-w-[48px] rounded-lg border-2 border-gray-300 active:bg-gray-50 transition-colors flex items-center justify-center"
            aria-label="Diminuer la quantité"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <span className="flex-1 text-center text-sm sm:text-base font-semibold text-gray-900 tabular-nums">
            {quantity} casier{quantity > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => updateQuantity(1)}
            className="p-3 min-h-[48px] min-w-[48px] rounded-lg border-2 border-orange-300 bg-orange-50 active:bg-orange-100 transition-colors flex items-center justify-center"
            aria-label="Augmenter la quantité"
          >
            <Plus size={18} strokeWidth={2.5} className="text-orange-600" />
          </button>
        </div>

        {/* Option consigne */}
        {product.consignPrice > 0 && (
          <label className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer select-none min-h-[44px]">
            <input
              type="checkbox"
              checked={withConsigne}
              onChange={(e) => setWithConsigne(e.target.checked)}
              className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="text-xs sm:text-sm text-gray-700 flex items-center gap-1">
              <Package2 size={14} />
              Avec consigne (+<PriceTag amount={product.consignPrice} size="sm" variant="muted" />)
            </span>
          </label>
        )}

        {/* Bouton ajouter au panier */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 min-h-[48px] rounded-xl shadow-lg shadow-orange-500/25 sm:hover:shadow-xl sm:hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <ShoppingCart size={18} />
          <span>{isInCart ? 'Mettre à jour' : 'Ajouter au panier'}</span>
        </button>
      </div>
    </div>
  );
};
