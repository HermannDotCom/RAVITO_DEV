import React from 'react';
import { Calendar, Filter } from 'lucide-react';

export type TransactionType = 'all' | 'recharge' | 'order' | 'refund' | 'earning' | 'withdrawal' | 'commission';
export type PeriodType = '7d' | '30d' | '90d' | '1y' | 'all';

interface TransactionFiltersProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  selectedType?: TransactionType;
  onTypeChange?: (type: TransactionType) => void;
  showTypeFilter?: boolean;
  isSupplier?: boolean;
}

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' }
];

const clientTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'recharge', label: 'Recharge' },
  { value: 'order', label: 'Commande' },
  { value: 'refund', label: 'Remboursement' }
];

const supplierTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'earning', label: 'Gains' },
  { value: 'withdrawal', label: 'Retraits' },
  { value: 'commission', label: 'Commissions' }
];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedType = 'all',
  onTypeChange,
  showTypeFilter = false,
  isSupplier = false
}) => {
  const typeOptions = isSupplier ? supplierTypeOptions : clientTypeOptions;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Period Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {periodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onPeriodChange(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedPeriod === option.value
                    ? isSupplier
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        {showTypeFilter && onTypeChange && (
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onTypeChange(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === option.value
                      ? isSupplier
                        ? 'bg-green-600 text-white'
                        : 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
