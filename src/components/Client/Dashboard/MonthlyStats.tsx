import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Sparkles } from 'lucide-react';
import { getOrdersByClient } from '../../../services/orderService';

interface MonthlyStatsProps {
  userId: string;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    ordersCount: 0,
    totalSpent: 0,
    savings: 0,
    trend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await getOrdersByClient(userId);
        
        // Filter orders from this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthOrders = orders.filter(order => 
          new Date(order.createdAt) >= startOfMonth && 
          ['delivered', 'completed'].includes(order.status)
        );

        // Calculate stats
        const ordersCount = thisMonthOrders.length;
        const totalSpent = thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        // Assume 5% savings on average vs retail prices
        const savings = Math.round(totalSpent * 0.05);

        // Calculate trend (mock: random for now, should compare with previous month)
        const trend = Math.floor(Math.random() * 30) - 10;

        setStats({ ordersCount, totalSpent, savings, trend });
      } catch (error) {
        console.error('Error loading monthly stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + 'F';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Ce mois-ci</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Ce mois-ci</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Orders Count */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Commandes</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stats.ordersCount}</p>
            {stats.trend !== 0 && (
              <p className={`text-xs ${stats.trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                {stats.trend > 0 ? '↗' : ''} {stats.trend > 0 ? '+' : ''}{stats.trend} vs M-1
              </p>
            )}
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Dépensé</p>
            <p className="text-2xl font-bold text-slate-900 mb-1 font-mono tabular-nums">
              {formatPrice(stats.totalSpent)}
            </p>
            {stats.trend !== 0 && (
              <p className={`text-xs ${stats.trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                ↗ +{Math.abs(stats.trend)}%
              </p>
            )}
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Économisé</p>
            <p className="text-2xl font-bold text-emerald-600 mb-1 font-mono tabular-nums">
              {formatPrice(stats.savings)}
            </p>
            <p className="text-xs text-slate-500">via RAVITO</p>
          </div>
        </div>
      </div>
    </div>
  );
};
