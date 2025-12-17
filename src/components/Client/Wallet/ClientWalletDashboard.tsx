/**
 * Client Wallet Dashboard
 * Main wallet interface for clients
 */

import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, CreditCard, TrendingUp, History, Clock } from 'lucide-react';
import { useWallet } from '../../../context/WalletContext';
import { DepositModal } from './DepositModal';
import { WithdrawalModal } from './WithdrawalModal';
import { TransactionHistory } from './TransactionHistory';
import { WithdrawalRequests } from './WithdrawalRequests';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ClientWalletDashboard: React.FC = () => {
  const { balance, stats, isLoading, transactions, withdrawalRequests } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const chartData = stats?.last7DaysActivity.map(day => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    balance: day.balance || balance,
    deposits: day.deposits,
    payments: day.payments
  })) || [];

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
          Mon Portefeuille RAVITO
        </h1>
        <p className="mt-2 text-gray-600">
          Gérez vos fonds et vos transactions en toute simplicité
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-2">Solde Disponible</p>
            <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Wallet className="h-10 w-10" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl p-4 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowDownCircle className="h-5 w-5" />
            <span className="font-medium">Déposer</span>
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl p-4 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowUpCircle className="h-5 w-5" />
            <span className="font-medium">Retirer</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Total Dépôts</p>
            <ArrowDownCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalDeposits || 0)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Total Paiements</p>
            <CreditCard className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalPayments || 0)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Total Retraits</p>
            <ArrowUpCircle className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalWithdrawals || 0)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Transactions</p>
            <History className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.transactionCount || 0}</p>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Évolution des 7 derniers jours</h3>
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
              <Line type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} name="Dépôts" />
              <Line type="monotone" dataKey="payments" stroke="#f59e0b" strokeWidth={2} name="Paiements" />
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
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Aperçu
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique ({transactions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'withdrawals'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Demandes de Retrait ({withdrawalRequests.filter(r => r.status === 'pending').length})
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Votre portefeuille RAVITO</h3>
              <p className="text-gray-600 mb-6">
                Déposez des fonds pour payer vos commandes en un clic
              </p>
              <button
                onClick={() => setShowDepositModal(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
              >
                <ArrowDownCircle className="h-5 w-5" />
                Ajouter des fonds
              </button>
            </div>
          )}

          {activeTab === 'transactions' && <TransactionHistory transactions={transactions} />}

          {activeTab === 'withdrawals' && <WithdrawalRequests requests={withdrawalRequests} />}
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}

      {showWithdrawalModal && (
        <WithdrawalModal onClose={() => setShowWithdrawalModal(false)} />
      )}
    </div>
  );
};
