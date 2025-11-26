import React from 'react';
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';

// Financial Card Component
interface FinancialCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  gradient?: 'orange' | 'blue' | 'green' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'orange',
  trend
}) => {
  const gradientStyles = {
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${gradientStyles[gradient]} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Period Filter Component
interface PeriodFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  periods?: { value: string; label: string }[];
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  periods = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' },
    { value: 'all', label: 'Tout' }
  ]
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map(period => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedPeriod === period.value
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

// View Mode Tabs Component
interface ViewModeTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

export const ViewModeTabs: React.FC<ViewModeTabsProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Stats Table Component
interface StatsTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface StatsTableProps {
  columns: StatsTableColumn[];
  data: Record<string, any>[];
  emptyMessage?: string;
}

export const StatsTable: React.FC<StatsTableProps> = ({
  columns,
  data,
  emptyMessage = 'Aucune donnée disponible'
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.key === 'monthName' || column.key === 'quarter' ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                >
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Transaction List Component
interface Transaction {
  id: string;
  date: Date;
  orderNumber: string;
  counterpartyName: string;
  amountHT: number;
  commission: number;
  totalAmount: number;
  status: string;
  transferredAt?: Date;
}

interface TransactionListProps {
  transactions: Transaction[];
  isSupplier?: boolean;
  onExport?: () => void;
  emptyMessage?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isSupplier = false,
  onExport,
  emptyMessage = 'Aucune transaction trouvée'
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {onExport && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Commande
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isSupplier ? 'Client' : 'Fournisseur'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isSupplier ? 'Montant Brut' : 'Montant HT'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isSupplier ? 'Net Reçu' : 'Total Payé'}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {transaction.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {transaction.counterpartyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                  {formatPrice(transaction.amountHT)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                  {formatPrice(transaction.commission)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                  {formatPrice(transaction.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    transaction.status.includes('Viré') || transaction.status === 'Livrée'
                      ? 'bg-green-100 text-green-700'
                      : transaction.status === 'En attente'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Simple Bar Chart Component (No external library)
interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  formatValue?: (value: number) => string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title,
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(value)
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {title && <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>}
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{formatValue(item.value)}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color || 'bg-gradient-to-r from-orange-500 to-orange-600'}`}
                style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Donut Chart Component (No external library)
interface SimpleDonutChartProps {
  data: { label: string; value: number; color: string }[];
  title?: string;
  formatValue?: (value: number) => string;
}

export const SimpleDonutChart: React.FC<SimpleDonutChartProps> = ({
  data,
  title,
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate stroke dasharray for each segment
  const circumference = 2 * Math.PI * 40; // radius = 40
  let cumulativeOffset = 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {title && <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>}
      
      <div className="flex items-center justify-center">
        <svg width="160" height="160" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const dashLength = (percentage / 100) * circumference;
            const currentOffset = cumulativeOffset;
            cumulativeOffset += dashLength;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="#111827" fontSize="8" fontWeight="bold">
            {formatValue(total)}
          </text>
        </svg>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-12">
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-6">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
