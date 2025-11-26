import React from 'react';
import { ArrowUp, ArrowDown, Repeat, ShoppingCart, Gift, DollarSign, Minus } from 'lucide-react';
import type { Transaction } from './index';

interface TransactionListProps {
  transactions: Transaction[];
  isSupplier?: boolean;
  formatPrice?: (price: number) => string;
  searchQuery?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isSupplier = false,
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA',
  searchQuery = ''
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'recharge':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'refund':
        return <Repeat className="h-4 w-4 text-purple-500" />;
      case 'sale':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'commission':
        return <DollarSign className="h-4 w-4 text-orange-500" />;
      case 'withdrawal':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      recharge: 'Recharge',
      purchase: 'Achat',
      refund: 'Remboursement',
      sale: 'Vente',
      commission: 'Commission',
      withdrawal: 'Retrait',
      bonus: 'Bonus'
    };
    return labels[type] || type;
  };

  const getTypeBgColor = (type: Transaction['type']) => {
    const colors: Record<Transaction['type'], string> = {
      recharge: 'bg-green-100',
      purchase: 'bg-blue-100',
      refund: 'bg-purple-100',
      sale: 'bg-green-100',
      commission: 'bg-orange-100',
      withdrawal: 'bg-red-100',
      bonus: 'bg-yellow-100'
    };
    return colors[type] || 'bg-gray-100';
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Transaction['status']) => {
    const labels: Record<Transaction['status'], string> = {
      completed: 'Complété',
      pending: 'En attente',
      failed: 'Échoué'
    };
    return labels[status] || status;
  };

  const getAmountColor = (type: Transaction['type']) => {
    if (['recharge', 'refund', 'sale', 'bonus'].includes(type)) {
      return 'text-green-600';
    }
    if (['purchase', 'commission', 'withdrawal'].includes(type)) {
      return 'text-red-600';
    }
    return 'text-gray-900';
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    if (['recharge', 'refund', 'sale', 'bonus'].includes(type)) {
      return '+';
    }
    if (['purchase', 'commission', 'withdrawal'].includes(type)) {
      return '-';
    }
    return '';
  };

  // Filter transactions by search query
  const filteredTransactions = searchQuery
    ? transactions.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {searchQuery ? 'Aucune transaction correspondant à votre recherche' : 'Aucune transaction'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            {isSupplier && (
              <>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net
                </th>
              </>
            )}
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransactions.map((transaction, index) => (
            <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDate(transaction.date)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  {transaction.order_id && (
                    <p className="text-gray-500 text-xs font-mono">#{transaction.order_id}</p>
                  )}
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${getAmountColor(transaction.type)}`}>
                {getAmountPrefix(transaction.type)}{formatPrice(transaction.amount)}
              </td>
              {isSupplier && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                    {transaction.commission ? formatPrice(transaction.commission) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                    {transaction.net_amount ? formatPrice(transaction.net_amount) : '-'}
                  </td>
                </>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getTypeBgColor(transaction.type)}`}>
                  {getTypeIcon(transaction.type)}
                  <span>{getTypeLabel(transaction.type)}</span>
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusLabel(transaction.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
