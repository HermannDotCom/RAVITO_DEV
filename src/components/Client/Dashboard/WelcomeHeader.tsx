import React, { useState, useEffect } from 'react';
import { Package, Wallet, Clock } from 'lucide-react';
import { getOrdersByClient } from '../../../services/orderService';
import { COMPLETED_ORDER_STATUSES, PENDING_ORDER_STATUSES } from '../../../constants/orderStatuses';

interface MonthlyStatsProps {
  userId: string;
}

export const MonthlyStats:  React.FC<MonthlyStatsProps> = ({ userId }) => {
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
        
        // Filter orders from this month
        const now = new Date();
        const startOfMonth = new Date(now. getFullYear(), now.getMonth(), 1);
        const thisMonthOrders = orders.filter(order => 
          new Date(order.createdAt) >= startOfMonth && 
          COMPLETED_ORDER_STATUSES. includes(order.status)
        );

        // Calculate stats
        const ordersCount = thisMonthOrders.length;
        const totalSpent = thisMonthOrders. reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Count pending orders (using consistent status constants)
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
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Commandes</p>
            <p className="text-2xl font-bold text-slate-900">{stats.ordersCount}</p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Dépensé</p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatPrice(stats.totalSpent)}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {stats.pendingCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {stats.pendingCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">En attente</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};