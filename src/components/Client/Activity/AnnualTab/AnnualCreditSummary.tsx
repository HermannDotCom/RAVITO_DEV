import React from 'react';
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Percent, Star, AlertTriangle, BarChart3 } from 'lucide-react';
import { AnnualCreditStats } from '../../../../types/activity';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnnualCreditSummaryProps {
  stats: AnnualCreditStats;
}

export const AnnualCreditSummary: React.FC<AnnualCreditSummaryProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare data for chart
  const chartData = stats.monthlyData.map(m => ({
    name: m.monthName.substring(0, 3), // Abbreviated month name
    Accordés: m.credited,
    Encaissés: m.paid,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-slate-900">💳 Bilan Crédits Annuel</h2>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total accordés */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Total accordés</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalCredited)} F
          </div>
        </div>

        {/* Total encaissés */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Total encaissés</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalPaid)} F
          </div>
        </div>

        {/* Solde fin d'année */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Solde fin d'année</span>
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
            <span className="text-sm font-medium text-slate-600">Taux recouvrement</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.recoveryRate.toFixed(1)} %
          </div>
        </div>

        {/* Évolution vs N-1 */}
        {stats.previousYearComparison !== undefined && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.previousYearComparison >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`w-4 h-4 ${
                  stats.previousYearComparison >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-600">Évolution vs N-1</span>
            </div>
            <div className={`text-2xl font-bold ${
              stats.previousYearComparison >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.previousYearComparison >= 0 ? '+' : ''}
              {stats.previousYearComparison.toFixed(1)} %
            </div>
          </div>
        )}
      </div>

      {/* Graphique Évolution Mensuelle */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900">Évolution Mensuelle</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => `${formatCurrency(value)} FCFA`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Accordés" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Encaissés" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meilleurs Clients */}
      {stats.topCustomers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-slate-900">Meilleurs Clients (Fidélité & Règlement)</h3>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total crédité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total réglé
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Taux de règlement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.topCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{customer.name}</span>
                          {customer.recoveryRate === 100 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {formatCurrency(customer.totalCredited)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {formatCurrency(customer.totalPaid)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          customer.recoveryRate >= 90 ? 'text-green-600' :
                          customer.recoveryRate >= 70 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {customer.recoveryRate.toFixed(1)} %
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

      {/* Clients à Risque */}
      {stats.atRiskCustomers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-slate-900">Clients à Risque (Taux &lt; 80%)</h3>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Taux de règlement
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Solde actuel
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.atRiskCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900">{customer.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-red-600">
                          {customer.recoveryRate.toFixed(1)} %
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-orange-600">
                          {formatCurrency(customer.currentBalance)} F
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
