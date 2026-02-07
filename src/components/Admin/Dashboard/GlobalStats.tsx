import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getSubscriptionStats } from '../../../services/admin/subscriptionStatsService';
import type { SubscriptionStats as SubscriptionStatsType } from '../../../types/subscription';

interface GlobalStatsProps {
  selectedYear: number;
}

interface MarketplaceRevenue {
  totalCommissions: number;
  orderCount: number;
  monthlyData: Array<{
    month: number;
    monthName: string;
    commissions: number;
  }>;
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ selectedYear }) => {
  const [loading, setLoading] = useState(true);
  const [marketplaceRevenue, setMarketplaceRevenue] = useState<MarketplaceRevenue | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStatsType | null>(null);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);

  useEffect(() => {
    loadGlobalData();
  }, [selectedYear]);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      // Load marketplace commissions
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, client_commission, supplier_commission, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid');

      if (error) throw error;

      const totalCommissions = orders?.reduce((sum, o) => 
        sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
      ) || 0;

      // Calculate monthly marketplace data
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];

      const monthlyMap: Record<number, { month: number; monthName: string; commissions: number }> = {};

      orders?.forEach(order => {
        const date = new Date(order.created_at);
        const month = date.getMonth();

        if (!monthlyMap[month]) {
          monthlyMap[month] = {
            month: month + 1,
            monthName: monthNames[month],
            commissions: 0
          };
        }

        monthlyMap[month].commissions += (order.client_commission || 0) + (order.supplier_commission || 0);
      });

      setMarketplaceRevenue({
        totalCommissions,
        orderCount: orders?.length || 0,
        monthlyData: Object.values(monthlyMap).sort((a, b) => a.month - b.month)
      });

      // Load subscription stats
      const subStats = await getSubscriptionStats(selectedYear);
      setSubscriptionStats(subStats);

      // Calculate previous month total for growth
      const currentMonth = new Date().getMonth();
      if (currentMonth > 0) {
        const prevMonthStart = new Date(selectedYear, currentMonth - 1, 1);
        const prevMonthEnd = new Date(selectedYear, currentMonth, 0, 23, 59, 59);

        const { data: prevOrders } = await supabase
          .from('orders')
          .select('client_commission, supplier_commission')
          .gte('created_at', prevMonthStart.toISOString())
          .lte('created_at', prevMonthEnd.toISOString())
          .eq('payment_status', 'paid');

        const prevMarketplace = prevOrders?.reduce((sum, o) => 
          sum + (o.client_commission || 0) + (o.supplier_commission || 0), 0
        ) || 0;

        setPreviousMonthTotal(prevMarketplace);
      }
    } catch (error) {
      console.error('Error loading global data:', error);
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

  if (!marketplaceRevenue || !subscriptionStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  const totalRevenue = marketplaceRevenue.totalCommissions + subscriptionStats.totalRevenue;
  const currentMonthTotal = marketplaceRevenue.totalCommissions;
  const growthRate = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;

  return (
    <>
      {/* Consolidated KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Revenus totaux</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">
                {formatCompactPrice(totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Marketplace + Abonnements</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Marketplace Revenue */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Revenus Marketplace</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 break-words">
                {formatCompactPrice(marketplaceRevenue.totalCommissions)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Commissions</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Subscription Revenue */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Revenus Abonnements</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600 break-words">
                {formatCompactPrice(subscriptionStats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Paiements validés</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Global Growth */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Croissance globale</p>
              <p className={`text-lg sm:text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">vs mois précédent</p>
            </div>
            <div className={`h-10 w-10 sm:h-12 sm:w-12 ${growthRate >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {growthRate >= 0 ? (
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6">Évolution des revenus par source</h3>
        
        <div className="space-y-3 sm:space-y-4">
          {marketplaceRevenue.monthlyData.map((month) => {
            // Find corresponding subscription revenue for this month
            const subscriptionRevenue = subscriptionStats.totalRevenue / 12; // Simplified average
            const total = month.commissions + subscriptionRevenue;
            const marketplacePercentage = total > 0 ? (month.commissions / total) * 100 : 0;
            const subscriptionPercentage = total > 0 ? (subscriptionRevenue / total) * 100 : 0;
            
            return (
              <div key={month.month}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{month.monthName}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {formatCompactPrice(total)}
                  </span>
                </div>
                <div className="flex h-6 sm:h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center"
                    style={{ width: `${marketplacePercentage}%` }}
                    title={`Marketplace: ${formatCompactPrice(month.commissions)}`}
                  >
                    {marketplacePercentage > 10 && (
                      <span className="text-xs text-white font-medium">
                        {marketplacePercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center"
                    style={{ width: `${subscriptionPercentage}%` }}
                    title={`Abonnements: ${formatCompactPrice(subscriptionRevenue)}`}
                  >
                    {subscriptionPercentage > 10 && (
                      <span className="text-xs text-white font-medium">
                        {subscriptionPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
            <span className="text-sm text-gray-700">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded"></div>
            <span className="text-sm text-gray-700">Abonnements</span>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Marketplace Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Résumé Marketplace
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Commissions totales:</span>
              <span className="font-bold">{formatCompactPrice(marketplaceRevenue.totalCommissions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Commandes traitées:</span>
              <span className="font-bold">{marketplaceRevenue.orderCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Revenu moyen/commande:</span>
              <span className="font-bold">
                {formatCompactPrice(marketplaceRevenue.orderCount > 0 ? marketplaceRevenue.totalCommissions / marketplaceRevenue.orderCount : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-orange-900 mb-3 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Résumé Abonnements
          </h3>
          <div className="space-y-2 text-sm text-orange-800">
            <div className="flex justify-between">
              <span>MRR:</span>
              <span className="font-bold">{formatCompactPrice(subscriptionStats.mrr)}</span>
            </div>
            <div className="flex justify-between">
              <span>Abonnés actifs:</span>
              <span className="font-bold">{subscriptionStats.activeSubscriptions}</span>
            </div>
            <div className="flex justify-between">
              <span>En période d'essai:</span>
              <span className="font-bold">{subscriptionStats.trialSubscriptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(subscriptionStats.pendingPaymentsCount > 0 || subscriptionStats.trialSubscriptions > 5) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Alertes importantes
          </h3>
          <div className="space-y-2 text-sm text-yellow-800">
            {subscriptionStats.pendingPaymentsCount > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                  {subscriptionStats.pendingPaymentsCount} paiement(s) en attente de validation 
                  ({formatCompactPrice(subscriptionStats.pendingPaymentsAmount)})
                </span>
              </div>
            )}
            {subscriptionStats.trialSubscriptions > 5 && (
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>
                  {subscriptionStats.trialSubscriptions} abonnements en période d'essai - 
                  Taux de conversion actuel: {subscriptionStats.conversionRate.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
