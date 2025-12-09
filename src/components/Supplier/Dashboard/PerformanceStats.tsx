import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Star } from 'lucide-react';

interface PerformanceStatsProps {
  supplierId: string;
  rating?: number;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ supplierId, rating }) => {
  // Mock data - in production, fetch from database
  const [stats] = useState({
    acceptanceRate: 92,
    avgDeliveryTime: 28,
    customerRating: rating || 4.8,
  });

  const getBenchmark = (value: number, type: 'rate' | 'time' | 'rating') => {
    if (type === 'rate') {
      if (value >= 90) return { label: 'Excellent', color: 'text-emerald-600' };
      if (value >= 75) return { label: 'Bon', color: 'text-blue-600' };
      return { label: 'À améliorer', color: 'text-orange-600' };
    }
    if (type === 'time') {
      if (value <= 30) return { label: 'Rapide', color: 'text-emerald-600' };
      if (value <= 45) return { label: 'Correct', color: 'text-blue-600' };
      return { label: 'Lent', color: 'text-orange-600' };
    }
    if (type === 'rating') {
      if (value >= 4.5) return { label: 'Top 10%', color: 'text-emerald-600' };
      if (value >= 4.0) return { label: 'Top 30%', color: 'text-blue-600' };
      return { label: 'Moyen', color: 'text-orange-600' };
    }
    return { label: '', color: '' };
  };

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
