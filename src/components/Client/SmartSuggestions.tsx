import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Star, Plus } from 'lucide-react';
import { getSmartOrderSuggestions, OrderSuggestion, generateMysteryBonus } from '../../services/orderMomentumService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface SmartSuggestionsProps {
  zoneId?: string;
  onProductSelect?: (product: Product) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ zoneId, onProductSelect }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mysteryBonus, setMysteryBonus] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadSuggestions();
      checkMysteryBonus();
    }
  }, [user, zoneId]);

  const loadSuggestions = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getSmartOrderSuggestions(user.id, zoneId);
    setSuggestions(data);
    setIsLoading(false);
  };

  const checkMysteryBonus = async () => {
    const bonus = await generateMysteryBonus();
    setMysteryBonus(bonus);
  };

  const handleAddToCart = (product: Product, discount?: number) => {
    const adjustedProduct = discount 
      ? {
          ...product,
          cratePrice: product.cratePrice * (1 - discount / 100)
        }
      : product;

    addToCart(adjustedProduct, 1, false);
    
    if (onProductSelect) {
      onProductSelect(adjustedProduct);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Suggestions Intelligentes
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Basées sur vos habitudes et les tendances actuelles
          </p>
        </div>
        {mysteryBonus && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring' }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Mystery Bonus Actif!</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => {
          const isDiscounted = mysteryBonus && index === 0;
          const finalDiscount = isDiscounted ? mysteryBonus : suggestion.discount;

          return (
            <motion.div
              key={suggestion.product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden ${
                isDiscounted ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {/* Mystery bonus badge */}
              {isDiscounted && (
                <motion.div
                  initial={{ x: -100 }}
                  animate={{ x: 0 }}
                  className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 text-xs font-bold transform rotate-12 translate-x-2 -translate-y-1"
                >
                  Mystery -{finalDiscount}%
                </motion.div>
              )}

              {/* Confidence indicator */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < suggestion.confidence * 5 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Product image */}
              {suggestion.product.imageUrl && (
                <div className="h-32 w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={suggestion.product.imageUrl} 
                    alt={suggestion.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Product info */}
              <h3 className="font-bold text-gray-900 mb-1">{suggestion.product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{suggestion.product.brand}</p>

              {/* Reason badge */}
              <div className="bg-purple-100 rounded-lg p-2 mb-3">
                <p className="text-xs text-purple-900 flex items-center gap-1">
                  {suggestion.reason.includes('Tendance') && <TrendingUp className="h-3 w-3" />}
                  {suggestion.reason.includes('Parfait') && <Clock className="h-3 w-3" />}
                  {suggestion.reason.includes('fois') && <Star className="h-3 w-3" />}
                  <span>{suggestion.reason}</span>
                </p>
              </div>

              {/* Price and action */}
              <div className="flex items-center justify-between">
                <div>
                  {finalDiscount ? (
                    <div>
                      <span className="text-sm text-gray-500 line-through">
                        {suggestion.product.cratePrice.toLocaleString()} FCFA
                      </span>
                      <p className="text-lg font-bold text-orange-600">
                        {(suggestion.product.cratePrice * (1 - finalDiscount / 100)).toLocaleString()} FCFA
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-orange-600">
                      {suggestion.product.cratePrice.toLocaleString()} FCFA
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(suggestion.product, finalDiscount || undefined)}
                  className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full flex items-center justify-center text-white transition-colors shadow-md"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={loadSuggestions}
        className="mt-6 w-full bg-white hover:bg-gray-50 border-2 border-purple-200 text-purple-900 py-3 rounded-xl font-semibold transition-colors"
      >
        ↻ Actualiser les suggestions
      </motion.button>
    </div>
  );
};
