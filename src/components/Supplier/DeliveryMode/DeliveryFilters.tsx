import React from 'react';
import { DeliveryFilter } from '../../../types/delivery';

interface DeliveryFiltersProps {
  activeFilter: DeliveryFilter;
  onFilterChange: (filter: DeliveryFilter) => void;
  counts: {
    all: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

/**
 * Filter tabs for delivery list
 * Shows counts for each filter option
 */
export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters: Array<{ key: DeliveryFilter; label: string; count: number }> = [
    { key: 'all', label: 'Toutes', count: counts.all },
    { key: 'pending', label: 'À faire', count: counts.pending },
    { key: 'in_progress', label: 'En cours', count: counts.inProgress },
    { key: 'completed', label: 'Terminées', count: counts.completed },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all
            ${
              activeFilter === filter.key
                ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300'
            }
          `}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};
