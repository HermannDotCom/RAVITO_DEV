import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
  color?: 'orange' | 'green' | 'blue' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = 'orange',
  className = '',
}) => {
  const colorStyles = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const trendColorStyles = trend?.isPositive
    ? 'text-green-600 bg-green-50'
    : 'text-red-600 bg-red-50';

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold font-mono text-gray-900 tabular-nums">{value}</p>
          {trend && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-sm font-medium ${trendColorStyles}`}>
              {trend.isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
