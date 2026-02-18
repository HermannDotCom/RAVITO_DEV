import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPIItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
}

interface ResponsiveKPIGridProps {
  items: KPIItem[];
  mobileColumns?: 1 | 2;
  desktopColumns?: 3 | 4 | 5;
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

/**
 * Responsive KPI Grid Component
 * - Adapts number of columns based on screen size
 * - Shows 1-2 columns on mobile, 3-5 on desktop
 * - Professional card design with optional trends
 */
export const ResponsiveKPIGrid: React.FC<ResponsiveKPIGridProps> = ({
  items,
  mobileColumns = 2,
  desktopColumns = 4,
  className = '',
}) => {
  const getGridClasses = () => {
    const mobileClass = mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
    const desktopClassMap: Record<3 | 4 | 5, string> = {
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
    };
    const desktopClass = desktopClassMap[desktopColumns] ?? 'lg:grid-cols-4';
    return `grid ${mobileClass} sm:grid-cols-2 md:grid-cols-3 ${desktopClass} gap-3 sm:gap-4`;
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={`
            border rounded-lg p-4 transition-all
            ${item.color ? colorClasses[item.color] : colorClasses.gray}
            ${item.onClick ? 'cursor-pointer hover:shadow-md' : ''}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium opacity-80">{item.label}</p>
            {item.icon && (
              <div className="opacity-70">
                {item.icon}
              </div>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold mb-1">{item.value}</p>
          {item.trend && (
            <div className={`flex items-center gap-1 text-xs ${item.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {item.trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(item.trend.value)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
