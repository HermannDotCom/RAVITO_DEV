import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  /** Main balance amount in FCFA */
  balance: number;
  /** Optional pending amount */
  pendingAmount?: number;
  /** Optional total earned (for suppliers) */
  totalEarned?: number;
  /** Card variant for styling */
  variant?: 'client' | 'supplier';
  /** Whether to show animation on mount */
  animated?: boolean;
  /** Optional trend data */
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * BalanceCard Component
 * 
 * Displays the main balance with optional pending amount and trend indicators.
 * Uses animated numbers and responsive design.
 */
export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  pendingAmount = 0,
  totalEarned,
  variant = 'client',
  animated = true,
  trend
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const gradientClass = variant === 'client' 
    ? 'from-orange-500 to-orange-600'
    : 'from-green-500 to-green-600';

  const bgGradient = variant === 'client'
    ? 'from-orange-50 to-orange-100'
    : 'from-green-50 to-green-100';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-6 shadow-lg border border-gray-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
          <Wallet className="h-7 w-7 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-600 mb-1">
          💰 Solde Disponible
        </p>
        <p className={`text-3xl font-bold text-gray-900 ${animated ? 'animate-pulse-once' : ''}`}>
          {formatPrice(balance)}
        </p>
      </div>

      {pendingAmount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">En attente</span>
            <span className="text-sm font-semibold text-yellow-600">
              {formatPrice(pendingAmount)}
            </span>
          </div>
        </div>
      )}

      {typeof totalEarned === 'number' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">💵 Total des gains</span>
            <span className="text-sm font-semibold text-green-600">
              {formatPrice(totalEarned)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
