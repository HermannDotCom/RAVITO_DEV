import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { getOrdersBySupplier } from '../../../services/orderService';

interface PerformanceStatsProps {
  supplierId: string;
  rating?: number;
}

// Performance benchmarks for supplier ratings
const PERFORMANCE_BENCHMARKS = {
  acceptanceRate: {
    excellent: 90,
    good: 75,
  },
  avgDeliveryTime: {
    fast: 30,
    acceptable: 45,
  },
  customerRating: {
    topTier: 4.5,
    good: 4.0,
  },
};

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ supplierId, rating }) => {
  const [stats, setStats] = useState({
    acceptanceRate: 0,
    avgDeliveryTime: 0,
    customerRating: rating || 5,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformanceStats = async () => {
      try {
        const orders = await getOrdersBySupplier(supplierId);
        
        // Calculate acceptance rate (orders accepted vs total orders)
        const totalOrders = orders.length;
        const acceptedOrders = orders.filter(o => 
          !['cancelled', 'rejected'].includes(o.status)
        ).length;
        const acceptanceRate = totalOrders > 0 
          ? Math.round((acceptedOrders / totalOrders) * 100) 
          : 0;

        // Calculate average delivery time (mock calculation)
        const completedOrders = orders.filter(o => o.status === 'delivered');
        const avgDeliveryTime = completedOrders.length > 0 
          ? Math.round(completedOrders.reduce((sum, order) => {
              const created = new Date(order.createdAt).getTime();
              const delivered = order.deliveredAt 
                ? new Date(order.deliveredAt).getTime() 
                : created;
              return sum + ((delivered - created) / (1000 * 60)); // minutes
            }, 0) / completedOrders.length)
          : 0;

        setStats({
          acceptanceRate,
          avgDeliveryTime,
          customerRating: rating || 5,
        });
      } catch (error) {
        console.error('Error loading performance stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerformanceStats();
  }, [supplierId, rating]);

  const getBenchmark = (value: number, type: 'rate' | 'time' | 'rating') => {
    if (type === 'rate') {
      if (value >= PERFORMANCE_BENCHMARKS.acceptanceRate.excellent) 
        return { label: 'Excellent', color: 'text-emerald-600' };
      if (value >= PERFORMANCE_BENCHMARKS.acceptanceRate.good) 
        return { label: 'Bon', color: 'text-blue-600' };
      return { label: 'À améliorer', color: 'text-orange-600' };
    }
    if (type === 'time') {
      if (value <= PERFORMANCE_BENCHMARKS.avgDeliveryTime.fast) 
        return { label: 'Rapide', color: 'text-emerald-600' };
      if (value <= PERFORMANCE_BENCHMARKS.avgDeliveryTime.acceptable) 
        return { label: 'Correct', color: 'text-blue-600' };
      return { label: 'Lent', color: 'text-orange-600' };
    }
    if (type === 'rating') {
      if (value >= PERFORMANCE_BENCHMARKS.customerRating.topTier) 
        return { label: 'Top 10%', color: 'text-emerald-600' };
      if (value >= PERFORMANCE_BENCHMARKS.customerRating.good) 
        return { label: 'Top 30%', color: 'text-blue-600' };
      return { label: 'Moyen', color: 'text-orange-600' };
    }
    return { label: '', color: '' };
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Performance du mois</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Performance du mois</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Acceptance Rate */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Taux accept.</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stats.acceptanceRate}%</p>
            <p className={`text-xs font-medium ${getBenchmark(stats.acceptanceRate, 'rate').color}`}>
              {getBenchmark(stats.acceptanceRate, 'rate').label}
            </p>
          </div>
        </div>

        {/* Average Delivery Time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Temps moyen</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stats.avgDeliveryTime} min</p>
            <p className={`text-xs font-medium ${getBenchmark(stats.avgDeliveryTime, 'time').color}`}>
              {getBenchmark(stats.avgDeliveryTime, 'time').label}
            </p>
          </div>
        </div>

        {/* Customer Rating */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Note clients</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">⭐ {stats.customerRating.toFixed(1)}</p>
            <p className={`text-xs font-medium ${getBenchmark(stats.customerRating, 'rating').color}`}>
              {getBenchmark(stats.customerRating, 'rating').label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
