import React from 'react';
import { Download, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import type { Transaction, TransactionType } from '../../types/treasury';

interface TransactionListProps {
  /** List of transactions to display */
  transactions: Transaction[];
  /** Whether this is for supplier view */
  isSupplier?: boolean;
  /** Callback for CSV export */
  onExport?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Max items to show (for preview mode) */
  maxItems?: number;
}

/**
 * TransactionList Component
 * 
 * Displays a list of transactions with appropriate styling based on type.
 * Supports credit (green), debit (red), and pending states.
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isSupplier = false,
  onExport,
  emptyMessage = 'Aucune transaction trouvée',
  maxItems
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'debit':
      case 'commission':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAmountStyle = (type: TransactionType) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
      case 'commission':
        return 'text-red-600';
      case 'withdrawal':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountPrefix = (type: TransactionType) => {
    switch (type) {
      case 'credit':
        return '+';
      case 'debit':
      case 'commission':
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700'
    };
    
    const labels: Record<string, string> = {
      completed: 'Complété',
      pending: 'En attente',
      failed: 'Échoué'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const displayedTransactions = maxItems 
    ? transactions.slice(0, maxItems) 
    : transactions;

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {onExport && transactions.length > 0 && (
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

      <div className="space-y-3">
        {displayedTransactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                transaction.type === 'credit' ? 'bg-green-100' :
                transaction.type === 'withdrawal' ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                {getTransactionIcon(transaction.type)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <p className={`font-semibold ${getAmountStyle(transaction.type)}`}>
                {getAmountPrefix(transaction.type)}{formatPrice(transaction.amount)}
              </p>
              {getStatusBadge(transaction.status)}
            </div>
          </div>
        ))}
      </div>

      {maxItems && transactions.length > maxItems && (
        <div className="text-center mt-4">
          <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
            Voir toutes les transactions ({transactions.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
