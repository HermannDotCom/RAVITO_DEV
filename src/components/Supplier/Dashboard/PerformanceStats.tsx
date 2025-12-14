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

  const formatDeliveryTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  };

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

  const statCards = [
    {
      label: 'Taux d\'acceptation',
      value: `${stats.acceptanceRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      benchmark: getBenchmark(stats.acceptanceRate, 'rate')
    },
    {
      label: 'Temps moyen livraison',
      value: formatDeliveryTime(stats.avgDeliveryTime),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      benchmark: getBenchmark(stats.avgDeliveryTime, 'time')
    },
    {
      label: 'Note moyenne clients',
      value: stats.customerRating.toFixed(1),
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      benchmark: getBenchmark(stats.customerRating, 'rating')
    }
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">Performance du mois</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-white border ${stat.borderColor} rounded-2xl p-5 hover:shadow-md transition-shadow`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -mr-10 -mt-10 opacity-20`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color} ${stat.label.includes('Note') ? 'fill-current' : ''}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mb-2 tabular-nums">
                    {stat.value}
                  </p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    stat.benchmark.label === 'Excellent' || stat.benchmark.label === 'Rapide' || stat.benchmark.label === 'Top 10%'
                      ? 'bg-emerald-50 text-emerald-700'
                      : stat.benchmark.label === 'Bon' || stat.benchmark.label === 'Correct' || stat.benchmark.label === 'Top 30%'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {stat.benchmark.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
