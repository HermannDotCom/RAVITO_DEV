import React from 'react';
import { ShoppingBag, ArrowRight, Clock } from 'lucide-react';

interface QuickOrderCardProps {
  onOrderClick: () => void;
  estimatedDeliveryTime?: string;
}

export const QuickOrderCard: React.FC<QuickOrderCardProps> = ({
  onOrderClick,
  estimatedDeliveryTime = '~45min'
}) => {
  return (
    <button
      onClick={onOrderClick}
      className="group relative w-full overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 text-white transition-all hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold mb-1">
              Commander maintenant
            </h3>
            <div className="flex items-center gap-2 text-orange-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Livraison {estimatedDeliveryTime}
              </span>
            </div>
          </div>
        </div>
        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
