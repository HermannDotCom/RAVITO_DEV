import React from 'react';
import { Wallet, CreditCard, PiggyBank } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  pendingBalance?: number;
  actionLabel: string;
  onAction: () => void;
  isClient?: boolean;
  formatValue?: (value: number) => string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  pendingBalance = 0,
  actionLabel,
  onAction,
  isClient = true,
  formatValue = (value) => new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA'
}) => {
  const gradientClass = isClient
    ? 'from-orange-500 to-orange-600'
    : 'from-green-500 to-green-600';
  
  const buttonClass = isClient
    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradientClass} p-6`}>
        <div className="flex items-center justify-between">
          <div className="text-white">
            <p className="text-sm opacity-90 mb-1">
              {isClient ? 'Solde disponible' : 'Gains disponibles'}
            </p>
            <p className="text-3xl font-bold">{formatValue(balance)}</p>
            {pendingBalance > 0 && (
              <p className="text-sm opacity-75 mt-1">
                + {formatValue(pendingBalance)} en attente
              </p>
            )}
          </div>
          <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {isClient ? (
              <Wallet className="h-8 w-8 text-white" />
            ) : (
              <PiggyBank className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <button
          onClick={onAction}
          className={`w-full ${buttonClass} text-white py-3 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2`}
        >
          <CreditCard className="h-5 w-5" />
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  );
};
