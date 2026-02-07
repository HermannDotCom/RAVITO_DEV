import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import {
  getSubscriptionStats,
  getSubscriptionsByPlan,
  getSubscriptionEvolution,
  getRecentValidatedPayments,
  calculateMRR
} from '../../../services/admin/subscriptionStatsService';
import type {
  SubscriptionStats as SubscriptionStatsType,
  PlanDistribution,
  MonthlySubscriptionData,
  ValidatedPayment
} from '../../../types/subscription';
import { getPaymentMethodName } from '../../../types/subscription';

interface SubscriptionStatsProps {
  selectedYear: number;
}

export const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({ selectedYear }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriptionStatsType | null>(null);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySubscriptionData[]>([]);
  const [recentPayments, setRecentPayments] = useState<ValidatedPayment[]>([]);
  const [evolutionView, setEvolutionView] = useState<'subscribers' | 'revenue' | 'churn'>('subscribers');

  useEffect(() => {
    loadSubscriptionData();
  }, [selectedYear]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [statsData, plansData, evolutionData, paymentsData] = await Promise.all([
        getSubscriptionStats(selectedYear),
        getSubscriptionsByPlan(),
        getSubscriptionEvolution(selectedYear),
        getRecentValidatedPayments(10)
      ]);

      setStats(statsData);
      setPlanDistribution(plansData);
      setMonthlyData(evolutionData);
      setRecentPayments(paymentsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const formatCompactPrice = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M FCFA';
    }
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K FCFA';
    }
    return formatPrice(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune donnée d'abonnement disponible</p>
      </div>
    );
  }

  return (
    <>
      {/* Primary KPIs - Abonnements */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* MRR */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">💰 MRR</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">
                {formatCompactPrice(stats.mrr)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Revenus mensuels</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">👥 Abonnés actifs</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.activeSubscriptions}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Actifs</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Trial Subscribers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">⏳ En période d'essai</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.trialSubscriptions}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Essais en cours</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">📈 Taux conversion</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Trial → Active</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* ARR */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">📊 ARR</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600 break-words">
                {formatCompactPrice(stats.arr)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Revenus annuels</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Average Revenue per User */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">🎯 Revenu moy/abonné</p>
              <p className="text-lg sm:text-2xl font-bold text-teal-600 break-words">
                {formatCompactPrice(stats.averageRevenuePerUser)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Par abonné</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">⏱️ Paiements en attente</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600 break-words">
                {formatCompactPrice(stats.pendingPaymentsAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stats.pendingPaymentsCount} paiement(s)</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">📉 Taux de churn</p>
              <p className={`text-lg sm:text-2xl font-bold ${stats.churnRate > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                {stats.churnRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Ce mois</p>
            </div>
            <div className={`h-10 w-10 sm:h-12 sm:w-12 ${stats.churnRate > 5 ? 'bg-red-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <TrendingDown className={`h-5 w-5 sm:h-6 sm:w-6 ${stats.churnRate > 5 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Distribution & Evolution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Plan Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Répartition par plan</h3>
          {planDistribution.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun abonnement actif</p>
          ) : (
            <div className="space-y-3">
              {planDistribution.map((plan, index) => (
                <div key={plan.planId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-blue-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      'bg-purple-500 text-white'
                    }`}>
                      {plan.count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{plan.planName}</p>
                      <p className="text-xs text-gray-500">{plan.percentage.toFixed(1)}% des abonnés</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-gray-900">{formatCompactPrice(plan.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Subscriptions Summary */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Résumé des abonnements</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Total abonnements</span>
              <span className="text-sm font-bold text-blue-600">{stats.totalSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Actifs</span>
              <span className="text-sm font-bold text-green-600">{stats.activeSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-700">En essai</span>
              <span className="text-sm font-bold text-orange-600">{stats.trialSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-700">En attente paiement</span>
              <span className="text-sm font-bold text-yellow-600">{stats.pendingPaymentSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-700">Suspendus</span>
              <span className="text-sm font-bold text-red-600">{stats.suspendedSubscriptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Évolution des abonnements</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setEvolutionView('subscribers')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                evolutionView === 'subscribers'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Abonnés
            </button>
            <button
              onClick={() => setEvolutionView('revenue')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                evolutionView === 'revenue'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Revenus
            </button>
            <button
              onClick={() => setEvolutionView('churn')}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                evolutionView === 'churn'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Churn
            </button>
          </div>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {monthlyData.map((month) => {
            const value = evolutionView === 'subscribers' ? month.newSubscriptions :
                         evolutionView === 'revenue' ? month.revenue :
                         month.cancelledSubscriptions;
            const maxValue = Math.max(...monthlyData.map(m => 
              evolutionView === 'subscribers' ? m.newSubscriptions :
              evolutionView === 'revenue' ? m.revenue :
              m.cancelledSubscriptions
            ), 1);
            const percentage = (value / maxValue) * 100;
            
            return (
              <div key={month.month} className="flex items-center gap-2 sm:gap-3">
                <div className="w-16 sm:w-20 flex-shrink-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{month.monthLabel.substring(0, 3)}</p>
                </div>
                <div className="flex-1">
                  <div className="h-6 sm:h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        evolutionView === 'subscribers' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        evolutionView === 'revenue' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 sm:w-32 text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    {evolutionView === 'revenue' ? formatCompactPrice(value) : value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Validated Payments */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Derniers paiements validés</h3>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucun paiement validé</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Plan</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Mode</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {new Date(payment.validatedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {payment.organizationName}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                      {payment.planName}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-green-600 font-medium">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                      {getPaymentMethodName(payment.paymentMethod as any)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
