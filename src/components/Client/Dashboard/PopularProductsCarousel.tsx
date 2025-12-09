import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../../../types';
import { getProducts } from '../../../services/productService';

interface PopularProductsCarouselProps {
  onAddToCart: (product: Product) => void;
}

export const PopularProductsCarousel: React.FC<PopularProductsCarouselProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularProducts = async () => {
      try {
        const allProducts = await getProducts({ isActive: true });
        // Take first 6 products as "popular" (in production, this would be based on actual popularity data)
        setProducts(allProducts.slice(0, 6));
      } catch (error) {
        console.error('Error loading popular products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPopularProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + 'F';
  };

  const getProductEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'biere': '🍺',
      'soda': '🥤',
      'eau': '💧',
      'vin': '🍷',
      'spiritueux': '🥃',
    };
    return emojis[category] || '🍺';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">🔥 Populaires dans votre zone</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-32 h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">🔥 Populaires dans votre zone</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map(product => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-32 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition-shadow"
          >
            <div className="text-center mb-2">
              <div className="text-3xl mb-1">{getProductEmoji(product.category)}</div>
              <h4 className="text-sm font-medium text-slate-900 truncate">{product.name}</h4>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-orange-600 mb-2">
                {formatPrice(product.cratePrice)}
              </p>
              <button
                onClick={() => onAddToCart(product)}
                className="w-full bg-orange-100 text-orange-600 rounded-lg py-1.5 px-2 text-xs font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
