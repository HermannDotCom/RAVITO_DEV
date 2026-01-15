import React from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface CreditKPIsProps {
  totalCredit: number;
  customersWithBalance: number;
}

export const CreditKPIs: React.FC<CreditKPIsProps> = ({
  totalCredit,
  customersWithBalance,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Total Credit */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-sm font-semibold text-orange-900">Crédit Total en Cours</h3>
        </div>
        <p className="text-2xl font-bold text-orange-900">
          {formatCurrency(totalCredit)} <span className="text-lg">FCFA</span>
        </p>
      </div>

      {/* Customers with Balance */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Clients avec Solde Dû</h3>
        </div>
        <p className="text-2xl font-bold text-blue-900">
          {customersWithBalance} <span className="text-lg">client{customersWithBalance !== 1 ? 's' : ''}</span>
        </p>
      </div>
    </div>
  );
};
