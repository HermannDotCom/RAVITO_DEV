import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface TransactionFiltersProps {
  periodFilter: string;
  onPeriodChange: (period: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  transactionTypes: { value: string; label: string }[];
  showSearch?: boolean;
}

const periodOptions = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'all', label: 'Tout' }
];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  periodFilter,
  onPeriodChange,
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  transactionTypes,
  showSearch = true
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Period Filter */}
        <div className="flex flex-wrap gap-2">
          {periodOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                periodFilter === option.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white cursor-pointer min-w-[160px]"
            >
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
