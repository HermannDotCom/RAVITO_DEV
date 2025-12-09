import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface QuickOrderCardProps {
  onOrderClick: () => void;
  estimatedDeliveryTime?: string;
}

export const QuickOrderCard: React.FC<QuickOrderCardProps> = ({ 
  onOrderClick, 
  estimatedDeliveryTime = '~45min' 
}) => {
  return (
    <div 
      onClick={onOrderClick}
      className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
            <ShoppingCart className="h-6 w-6" />
            Commander maintenant
          </h3>
          <p className="text-orange-100">
            Livraison estimée {estimatedDeliveryTime} dans votre zone
          </p>
        </div>
        <ArrowRight className="h-8 w-8" />
      </div>
    </div>
  );
};
