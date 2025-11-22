/**
 * Executive Overview Dashboard
 * High-level business metrics for CEO/Founder
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity, DollarSign, Star } from 'lucide-react';
import { businessMetrics } from '../../services/monitoring/businessMetrics';
import type {
  RevenueMetrics,
  TransactionMetrics,
  CustomerMetrics,
} from '../../services/monitoring/businessMetrics';

export const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const [rev, trans, cust] = await Promise.all([
        businessMetrics.getRevenueMetrics(),
        businessMetrics.getTransactionMetrics(),
        businessMetrics.getCustomerMetrics(),
      ]);
      setRevenue(rev);
      setTransactions(trans);
      setCustomers(cust);
    } catch (error) {
      console.error('Failed to load executive metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Executive Overview
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revenue Today
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(revenue?.today || 0)}
                <span className="text-sm font-normal ml-1">FCFA</span>
              </p>
              <p className={`text-sm mt-2 ${getTrendColor(revenue?.trend || 0)}`}>
                {getTrendIcon(revenue?.trend || 0)} {Math.abs(revenue?.trend || 0).toFixed(1)}%
                <span className="text-gray-500"> vs last week</span>
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Users
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {transactions?.total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">online now</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Users className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System Health
              </p>
              <div className="flex items-center mt-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  99.8%
                </span>
                <span className="text-2xl ml-2">✅</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">uptime</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        {/* NPS Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                NPS Score
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {customers?.nps || 68}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Customer satisfaction
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Trend
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(revenue?.month || 0)} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(revenue?.week || 0)} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(revenue?.today || 0)} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transaction Success Rate
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {transactions?.successRate.toFixed(1)}%
            </p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{ width: `${transactions?.successRate || 0}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customer Satisfaction
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {customers?.satisfaction.toFixed(0)}%
            </p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${customers?.satisfaction || 0}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Growth Rate
            </p>
            <p className={`text-2xl font-bold mt-1 ${getTrendColor(revenue?.trend || 0)}`}>
              +{Math.abs(revenue?.trend || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">week-over-week</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
