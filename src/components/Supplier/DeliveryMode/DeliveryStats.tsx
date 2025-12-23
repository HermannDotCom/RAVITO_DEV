import React from 'react';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { DeliveryStats as DeliveryStatsType } from '../../../types/delivery';

interface DeliveryStatsProps {
  stats: DeliveryStatsType;
  onFilterSelect: (filter: 'pending' | 'in_progress' | 'completed') => void;
}

/**
 * Display delivery statistics with filter buttons
 * Mobile-optimized for easy tapping
 */
export const DeliveryStats: React.FC<DeliveryStatsProps> = ({ stats, onFilterSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {/* Pending Deliveries */}
      <button
        onClick={() => onFilterSelect('pending')}
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <div className="flex flex-col items-center justify-center">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-bold">{stats.pending}</div>
          <div className="text-xs sm:text-sm opacity-90 mt-1">À faire</div>
        </div>
      </button>

      {/* In Progress */}
      <button
        onClick={() => onFilterSelect('in_progress')}
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <div className="flex flex-col items-center justify-center">
          <Truck className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-bold">{stats.inProgress}</div>
          <div className="text-xs sm:text-sm opacity-90 mt-1">En cours</div>
        </div>
      </button>

      {/* Completed Today */}
      <button
        onClick={() => onFilterSelect('completed')}
        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <div className="flex flex-col items-center justify-center">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-bold">{stats.completed}</div>
          <div className="text-xs sm:text-sm opacity-90 mt-1">Terminées</div>
        </div>
      </button>
    </div>
  );
};
