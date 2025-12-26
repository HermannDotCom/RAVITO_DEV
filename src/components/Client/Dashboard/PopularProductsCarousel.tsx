import React, { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
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
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Produits populaires</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex-shrink-0 w-36 h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-bold text-slate-900">Produits populaires</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map(product => (
          <div
            key={product.id}
            className="group flex-shrink-0 w-36 bg-white border border-slate-200 rounded-2xl p-4 hover:border-orange-200 hover:shadow-lg transition-all"
          >
            <div className="text-center mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-3xl">{getProductEmoji(product.category)}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 truncate mb-1">
                {product.name}
              </h4>
              <div className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded-full">
                <span className="text-xs font-medium text-slate-600">{product.crateType}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(product.cratePrice)}
                </span>
              </div>
              <button
                onClick={() => onAddToCart(product)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-2 px-3 text-xs font-semibold hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-md flex items-center justify-center gap-1.5 group-hover:scale-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
