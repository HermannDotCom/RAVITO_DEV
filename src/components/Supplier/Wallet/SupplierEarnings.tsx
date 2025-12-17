/**
 * Supplier Earnings Component
 * Displays supplier earnings history from orders
 */

import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, Calendar, Package, DollarSign, Filter } from 'lucide-react';
import { Transaction } from '../../../types/wallet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SupplierEarningsProps {
  transactions: Transaction[];
}

export const SupplierEarnings: React.FC<SupplierEarningsProps> = ({ transactions }) => {
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

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

  // Filter earnings transactions
  const earningTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => tx.type === 'earning' && tx.status === 'completed');

    // Apply date filter
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

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      filtered.sort((a, b) => b.amount - a.amount);
    }

    return filtered;
  }, [transactions, dateFilter, sortBy]);

  // Calculate statistics
  const totalEarnings = earningTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalCommission = earningTransactions.reduce((sum, tx) => sum + (tx.commission || 0), 0);
  const averageEarning = earningTransactions.length > 0 ? totalEarnings / earningTransactions.length : 0;

  // Prepare chart data (group by week)
  const chartData = useMemo(() => {
    const weeklyData: { [key: string]: number } = {};
    
    earningTransactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + tx.amount;
    });

    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        week: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        amount
      }))
      .slice(-8); // Last 8 weeks
  }, [earningTransactions]);

  const exportToCSV = () => {
    const headers = ['Date', 'Commande', 'Montant Brut', 'Commission', 'Montant Net', 'Référence'];
    const rows = earningTransactions.map(tx => [
      formatDate(tx.createdAt),
      tx.relatedOrderId || 'N/A',
      tx.amount + (tx.commission || 0),
      tx.commission || 0,
      tx.amount,
      tx.transactionReference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenus_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (transactions.filter(tx => tx.type === 'earning').length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun revenu pour le moment</h3>
        <p className="text-gray-600">
          Vos revenus des commandes livrées apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Revenus Totaux</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(totalEarnings)}</p>
          <p className="text-sm text-green-600 mt-1">{earningTransactions.length} commande(s)</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">Commissions Plateforme</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{formatCurrency(totalCommission)}</p>
          <p className="text-sm text-orange-600 mt-1">Déduit automatiquement</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Revenu Moyen</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{formatCurrency(averageEarning)}</p>
          <p className="text-sm text-blue-600 mt-1">Par commande</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tendance des revenus (par semaine)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
            <option value="all">Tous</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="date">Trier par date</option>
            <option value="amount">Trier par montant</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Earnings List */}
      <div className="space-y-2">
        {earningTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun revenu pour cette période</p>
          </div>
        ) : (
          earningTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className="bg-green-50 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">
                      Revenu de commande
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                    {transaction.relatedOrderId && (
                      <p className="text-xs text-gray-500 mb-1">
                        Commande: {transaction.relatedOrderId.substring(0, 8)}...
                      </p>
                    )}
                    {transaction.transactionReference && (
                      <p className="text-xs text-gray-500">
                        Réf: {transaction.transactionReference}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-green-600">
                    +{formatCurrency(transaction.amount)}
                  </p>
                  {transaction.commission && transaction.commission > 0 && (
                    <p className="text-xs text-gray-500">
                      Commission: -{formatCurrency(transaction.commission)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
