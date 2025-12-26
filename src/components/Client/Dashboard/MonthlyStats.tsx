import React, { useState, useEffect } from 'react';
import { Package, Wallet, Clock, TrendingUp } from 'lucide-react';
import { getOrdersByClient } from '../../../services/orderService';
import { COMPLETED_ORDER_STATUSES, PENDING_ORDER_STATUSES } from '../../../constants/orderStatuses';

interface MonthlyStatsProps {
  userId: string;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    ordersCount: 0,
    totalSpent: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await getOrdersByClient(userId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthOrders = orders.filter(order =>
          new Date(order.createdAt) >= startOfMonth &&
          COMPLETED_ORDER_STATUSES.includes(order.status)
        );

        const ordersCount = thisMonthOrders.length;
        const totalSpent = thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        const pendingCount = orders.filter(order =>
          PENDING_ORDER_STATUSES.includes(order.status)
        ).length;

        setStats({ ordersCount, totalSpent, pendingCount });
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
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Aperçu mensuel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Commandes',
      value: stats.ordersCount,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      formatter: (val: number) => val.toString()
    },
    {
      title: 'Dépensé',
      value: stats.totalSpent,
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      formatter: formatPrice
    },
    {
      title: 'En attente',
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      formatter: (val: number) => val.toString(),
      badge: stats.pendingCount > 0
    }
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">Aperçu mensuel</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-white border ${stat.borderColor} rounded-2xl p-4 hover:shadow-md transition-shadow`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -mr-10 -mt-10 opacity-20`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.badge && (
                    <span className={`px-2 py-0.5 ${stat.bgColor} ${stat.color} text-xs font-bold rounded-full`}>
                      Nouveau
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {stat.formatter(stat.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};