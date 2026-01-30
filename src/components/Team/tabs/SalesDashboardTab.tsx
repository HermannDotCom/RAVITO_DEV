import React, { useEffect } from 'react';
import { Users, Building2, DollarSign, Activity } from 'lucide-react';
import { useSalesCommissions } from '../../../hooks/useSalesCommissions';
import { formatCurrency, MONTH_NAMES } from '../../../types/sales';

export const SalesDashboardTab: React.FC = () => {
  const {
    dashboardKPIs,
    repsWithMetrics,
    selectedPeriod,
    setSelectedPeriod,
    currentPeriod,
    refreshDashboard,
    isLoading
  } = useSalesCommissions();

  // Load dashboard data when component mounts or period changes
  useEffect(() => {
    refreshDashboard();
  }, [selectedPeriod, refreshDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">📊 Tableau de Bord Commercial</h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Période:</span>
          <select
            value={`${selectedPeriod.year}-${selectedPeriod.month}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              setSelectedPeriod({ year, month });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {/* Generate last 12 months */}
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(currentPeriod.year, currentPeriod.month - 1 - i, 1);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              return (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTH_NAMES[month - 1]} {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Inscrits total</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboardKPIs.totalRegistered}</div>
            <div className="mt-1 text-xs text-gray-500">CHR + Dépôts</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Dépôts inscrits</span>
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboardKPIs.depotsRegistered}</div>
            <div className="mt-1 text-xs text-gray-500">Fournisseurs</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CA total clients</span>
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardKPIs.totalCa)}</div>
            <div className="mt-1 text-xs text-gray-500">Chiffre d'affaires</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Taux actif</span>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboardKPIs.activeRate}%</div>
            <div className="mt-1 text-xs text-gray-500">Clients ayant commandé</div>
          </div>
        </div>
      )}

      {/* Sales Reps Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">👤 Performance par Commercial</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscrits
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activés
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Obj
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {repsWithMetrics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucun commercial trouvé
                  </td>
                </tr>
              ) : (
                repsWithMetrics.map((rep) => {
                  const totalActivated = rep.chrActivated + rep.depotActivated;
                  const totalObjective = (rep.objectiveChr || 0) + (rep.objectiveDepots || 0);
                  const percentObjective = totalObjective > 0 
                    ? Math.round((totalActivated / totalObjective) * 100)
                    : 0;
                  
                  // Indicator color based on objective completion
                  let indicatorColor = 'bg-gray-400';
                  if (percentObjective >= 100) indicatorColor = 'bg-green-500';
                  else if (percentObjective >= 80) indicatorColor = 'bg-yellow-500';
                  else if (percentObjective >= 50) indicatorColor = 'bg-orange-500';
                  else indicatorColor = 'bg-red-500';

                  return (
                    <tr key={rep.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${indicatorColor} mr-3`} />
                          <span className="text-sm font-medium text-gray-900">{rep.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rep.zoneName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">{rep.totalRegistered}</span>
                        <div className="text-xs text-gray-500">
                          {rep.chrRegistered} CHR · {rep.depotRegistered} Dépôts
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">{totalActivated}</span>
                        <div className="text-xs text-gray-500">
                          {rep.chrActivated} CHR · {rep.depotActivated} Dépôts
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${
                          percentObjective >= 100 ? 'text-green-600' :
                          percentObjective >= 80 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {percentObjective}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(rep.totalCa)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
