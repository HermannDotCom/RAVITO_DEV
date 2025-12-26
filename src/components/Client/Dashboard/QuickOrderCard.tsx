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
      className="group relative w-full overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white transition-all hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">
              Commander maintenant
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-orange-100">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Livraison {estimatedDeliveryTime}
              </span>
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
