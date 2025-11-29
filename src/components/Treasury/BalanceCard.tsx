import React from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet, Plus } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  variationPercent?: number;
  onRecharge?: () => void;
  formatPrice?: (price: number) => string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  variationPercent = 0,
  onRecharge,
  formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA'
}) => {
  const getTrendIcon = () => {
    if (variationPercent > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (variationPercent < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-orange-100 text-sm font-medium">Solde Actuel</p>
            <p className="text-3xl font-bold">{formatPrice(balance)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1`}>
          {getTrendIcon()}
          <span className={`text-sm font-medium ${variationPercent !== 0 ? 'text-white' : 'text-orange-100'}`}>
            {variationPercent > 0 ? '+' : ''}{variationPercent.toFixed(1)}% vs mois dernier
          </span>
        </div>

        {onRecharge && (
          <button
            onClick={onRecharge}
            className="flex items-center space-x-2 bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Recharger mon compte</span>
          </button>
        )}
      </div>
    </div>
  );
};
