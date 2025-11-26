import React from 'react';
import { Filter, Calendar, X } from 'lucide-react';
import type { TransactionType, TransactionStatus, TransactionFilterOptions } from '../../types/treasury';

interface TransactionFiltersProps {
  /** Current filter values */
  filters: TransactionFilterOptions;
  /** Callback when filters change */
  onFilterChange: (filters: TransactionFilterOptions) => void;
  /** Whether to show transaction type filter */
  showTypeFilter?: boolean;
  /** Whether to show status filter */
  showStatusFilter?: boolean;
}

const periodOptions = [
  { value: '7d' as const, label: '7 derniers jours' },
  { value: '30d' as const, label: '30 derniers jours' },
  { value: '90d' as const, label: '3 derniers mois' },
  { value: '1y' as const, label: 'Cette année' },
  { value: 'all' as const, label: 'Tout' }
];

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'credit', label: 'Crédits' },
  { value: 'debit', label: 'Débits' },
  { value: 'withdrawal', label: 'Retraits' },
  { value: 'commission', label: 'Commissions' }
];

const statusOptions: { value: TransactionStatus; label: string }[] = [
  { value: 'completed', label: 'Complétés' },
  { value: 'pending', label: 'En attente' },
  { value: 'failed', label: 'Échoués' }
];

/**
 * TransactionFilters Component
 * 
 * Provides filter controls for transaction lists including:
 * - Period selection (7d, 30d, 90d, 1y, all)
 * - Transaction type filter
 * - Status filter
 */
export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange,
  showTypeFilter = true,
  showStatusFilter = true
}) => {
  const handlePeriodChange = (period: TransactionFilterOptions['period']) => {
    onFilterChange({ ...filters, period });
  };

  const handleTypeChange = (type: TransactionType | undefined) => {
    onFilterChange({ ...filters, type });
  };

  const handleStatusChange = (status: TransactionStatus | undefined) => {
    onFilterChange({ ...filters, status });
  };

  const clearFilters = () => {
    onFilterChange({
      period: '30d',
      type: undefined,
      status: undefined
    });
  };

  const hasActiveFilters = filters.type || filters.status;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Filtres</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Period Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Période
          </label>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.period === option.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        {showTypeFilter && (
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleTypeChange(e.target.value as TransactionType || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Tous les types</option>
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value as TransactionStatus || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;
