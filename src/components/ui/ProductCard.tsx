import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package2 } from 'lucide-react';
import { Product } from '../../types';

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

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
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Image avec ratio 4:3 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        {/* Badge marque en overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-900 shadow-md">
            {product.brand}
          </span>
        </div>
        {isInCart && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-md">
              <ShoppingCart size={12} />
              {cartQuantity}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Nom et volume */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {getCrateTypeDescription(product.crateType)} • {product.volume}
        </p>

        {/* Prix */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-orange-600 tabular-nums">
              {formatPrice(product.cratePrice)}
            </span>
            <span className="text-sm text-gray-500">/ casier</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-mono tabular-nums">{formatPrice(product.unitPrice)}</span>
            <span className="text-gray-500"> / unité</span>
          </div>
        </div>

        {/* Sélecteur de quantité */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => updateQuantity(-1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Diminuer la quantité"
          >
            <Minus size={16} />
          </button>
          <span className="flex-1 text-center font-semibold text-gray-900 tabular-nums">
            {quantity} casier{quantity > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => updateQuantity(1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Augmenter la quantité"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Option consigne */}
        {product.consignPrice > 0 && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withConsigne}
              onChange={(e) => setWithConsigne(e.target.checked)}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Package2 size={14} />
              Avec consigne (+{formatPrice(product.consignPrice)})
            </span>
          </label>
        )}

        {/* Bouton ajouter au panier */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ShoppingCart size={18} />
          <span>{isInCart ? 'Mettre à jour' : 'Ajouter au panier'}</span>
        </button>
      </div>
    </div>
  );
};
