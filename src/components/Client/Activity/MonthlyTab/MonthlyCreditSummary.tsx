import React from 'react';
import { CreditCard, TrendingUp, TrendingDown, AlertTriangle, Percent, DollarSign } from 'lucide-react';
import { MonthlyCreditStats, AlertLevel } from '../../../../types/activity';

interface MonthlyCreditSummaryProps {
  stats: MonthlyCreditStats;
}

export const MonthlyCreditSummary: React.FC<MonthlyCreditSummaryProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertLevelColor = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      default:
        return 'text-green-600';
    }
  };

  const getAlertLevelBg = (level: AlertLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-slate-900">💳 Crédits du Mois</h2>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crédits accordés */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Crédits accordés</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalCredited)} F
          </div>
        </div>

        {/* Crédits encaissés */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Crédits encaissés</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalPaid)} F
          </div>
        </div>

        {/* Solde fin de mois */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Solde fin de mois</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.endBalance)} F
          </div>
        </div>

        {/* Taux de recouvrement */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Taux de recouvrement</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.recoveryRate.toFixed(1)} %
          </div>
        </div>
      </div>

      {/* Alertes Crédits */}
      {stats.alertsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Alertes Crédits</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-amber-700 mb-1">Clients sans règlement &gt; 30 jours</p>
              <p className="text-2xl font-bold text-amber-900">{stats.alertsCount}</p>
            </div>
            <div>
              <p className="text-sm text-amber-700 mb-1">Montant à risque</p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(stats.amountAtRisk)} F
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Débiteurs */}
      {stats.topDebtors.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top 5 Débiteurs</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Solde dû
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Dernier règlement
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.topDebtors.map((debtor) => (
                    <tr key={debtor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900">{debtor.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-orange-600">
                          {formatCurrency(debtor.balance)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {debtor.lastPaymentDate
                            ? `${debtor.daysSincePayment} jours`
                            : 'Jamais'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getAlertLevelBg(debtor.alertLevel)}`}>
                          {debtor.alertLevel === 'critical' ? '🔴' : '🟠'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
