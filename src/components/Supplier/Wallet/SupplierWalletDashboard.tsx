/**
 * Supplier Wallet Dashboard
 * Main wallet interface for suppliers
 */

import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react';
import { useWallet } from '../../../context/WalletContext';
import { SupplierWithdrawalRequest } from './SupplierWithdrawalRequest';
import { SupplierEarnings } from './SupplierEarnings';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SupplierWalletDashboard: React.FC = () => {
  const { balance, stats, isLoading, transactions, withdrawalRequests } = useWallet();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate earnings for different periods
  const calculatePeriodEarnings = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return transactions
      .filter(tx => 
        tx.type === 'earning' && 
        tx.status === 'completed' &&
        new Date(tx.createdAt) >= cutoffDate
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const todayEarnings = calculatePeriodEarnings(1);
  const weekEarnings = calculatePeriodEarnings(7);
  const monthEarnings = calculatePeriodEarnings(30);

  // Prepare chart data
  const chartData = stats?.last7DaysActivity.map(day => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    earnings: day.earnings
  })) || [];

  // Pending withdrawals
  const pendingWithdrawals = withdrawalRequests.filter(r => 
    ['pending', 'approved', 'processing'].includes(r.status)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-orange-500" />
          Portefeuille Fournisseur
        </h1>
        <p className="mt-2 text-gray-600">
          Gérez vos revenus et vos retraits
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-green-100 text-sm font-medium mb-2">Solde Disponible</p>
            <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Wallet className="h-10 w-10" />
          </div>
        </div>

        {/* Quick Actions */}
        <button
          onClick={() => setShowWithdrawalModal(true)}
          className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl p-4 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ArrowUpCircle className="h-5 w-5" />
          <span className="font-medium">Demander un Retrait</span>
        </button>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Revenus Aujourd'hui</p>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayEarnings)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Revenus 7 Jours</p>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(weekEarnings)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Revenus 30 Jours</p>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthEarnings)}</p>
        </div>
      </div>

      {/* Pending Withdrawals Alert */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                Demandes de retrait en cours
              </h3>
              <p className="text-sm text-blue-800">
                Vous avez {pendingWithdrawals.length} demande(s) de retrait en cours de traitement
              </p>
              <div className="mt-2 space-y-1">
                {pendingWithdrawals.map(withdrawal => (
                  <div key={withdrawal.id} className="text-sm text-blue-700">
                    • {formatCurrency(withdrawal.netAmount)} - {withdrawal.status === 'pending' ? 'En attente' : 
                       withdrawal.status === 'approved' ? 'Approuvé' : 'En traitement'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Revenus des 7 derniers jours</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                strokeWidth={2} 
                name="Revenus"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Aperçu
              </div>
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'earnings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historique Revenus
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-4">Revenus Totaux</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {formatCurrency(stats?.totalEarnings || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transactions.filter(t => t.type === 'earning').length} commande(s) complétée(s)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-4">Retraits Totaux</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {formatCurrency(stats?.totalWithdrawals || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {withdrawalRequests.filter(r => r.status === 'completed').length} retrait(s) complété(s)
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Vos revenus s'accumulent automatiquement</h3>
                <p className="text-gray-600 mb-6">
                  Chaque commande livrée et confirmée ajoute des fonds à votre portefeuille
                </p>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                  Demander un Retrait
                </button>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <SupplierEarnings transactions={transactions} />
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <SupplierWithdrawalRequest onClose={() => setShowWithdrawalModal(false)} />
      )}
    </div>
  );
};
