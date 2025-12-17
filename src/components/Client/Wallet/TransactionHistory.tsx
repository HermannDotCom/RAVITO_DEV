/**
 * Transaction History Component
 * Displays wallet transaction history with filters
 */

import React, { useState, useMemo } from 'react';
import { Download, Filter, ArrowUpCircle, ArrowDownCircle, CreditCard, TrendingUp, Search, Calendar } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS
} from '../../../types/wallet';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      }[dateFilter];

      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= cutoffDate);
    }

    return filtered;
  }, [transactions, filterType, searchQuery, dateFilter]);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-blue-600" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-orange-600" />;
      case 'earning':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-blue-600';
      case 'payment':
        return 'text-red-600';
      case 'earning':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: TransactionType) => {
    return type === 'deposit' || type === 'earning' ? '+' : '-';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Montant', 'Référence', 'Statut'];
    const rows = filteredTransactions.map(tx => [
      formatDate(tx.createdAt),
      TRANSACTION_TYPE_LABELS[tx.type],
      tx.description,
      `${getTransactionSign(tx.type)}${tx.amount}`,
      tx.transactionReference || '',
      TRANSACTION_STATUS_LABELS[tx.status]
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune transaction</h3>
        <p className="text-gray-600">
          Vos transactions apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une transaction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="deposit">Dépôts</option>
            <option value="withdrawal">Retraits</option>
            <option value="payment">Paiements</option>
            <option value="earning">Revenus</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Toutes les dates</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{filteredTransactions.length} transaction(s) trouvée(s)</span>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {TRANSACTION_TYPE_LABELS[transaction.type]}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : transaction.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {TRANSACTION_STATUS_LABELS[transaction.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                  {transaction.transactionReference && (
                    <p className="text-xs text-gray-500">
                      Réf: {transaction.transactionReference}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right ml-4">
                <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                  {getTransactionSign(transaction.type)}{formatCurrency(transaction.amount)}
                </p>
                {transaction.commission && transaction.commission > 0 && (
                  <p className="text-xs text-gray-500">
                    Commission: {formatCurrency(transaction.commission)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8">
          <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucune transaction ne correspond à vos critères</p>
        </div>
      )}
    </div>
  );
};
