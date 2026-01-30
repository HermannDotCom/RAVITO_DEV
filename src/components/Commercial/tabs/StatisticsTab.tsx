import React from 'react';
import { Users, Building2, DollarSign, Activity } from 'lucide-react';
import type { CommercialActivityStats, Period } from '../../../types/sales';
import { formatCurrency, MONTH_NAMES } from '../../../types/sales';

interface StatisticsTabProps {
  stats: CommercialActivityStats | null;
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
  currentPeriod: Period;
  isLoading: boolean;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  stats,
  selectedPeriod,
  setSelectedPeriod,
  currentPeriod,
  isLoading
}) => {
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '👤';
  };

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">📈 MES STATISTIQUES</h2>
        
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Inscrits CHR</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.chrRegistered}</div>
          <div className="mt-1 text-xs text-gray-500">Clients</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Dépôts</span>
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.depotRegistered}</div>
          <div className="mt-1 text-xs text-gray-500">Inscrits</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CA généré</span>
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalCa)}
          </div>
          <div className="mt-1 text-xs text-gray-500">Total</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Taux activation</span>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activationRate}%</div>
          <div className="mt-1 text-xs text-gray-500">Activés</div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 ÉVOLUTION INSCRIPTIONS</h3>
        
        {stats.weeklyStats.length > 0 ? (
          <div className="space-y-4">
            {/* Bar chart */}
            <div className="flex items-end justify-around h-40 border-b border-gray-200 pb-2">
              {(() => {
                const maxRegistrations = Math.max(...stats.weeklyStats.map(w => w.registrations), 1);
                return stats.weeklyStats.map((week) => {
                  const heightPercentage = (week.registrations / maxRegistrations) * 100;
                  
                  return (
                    <div key={week.weekNumber} className="flex flex-col items-center">
                      <div className="flex-1 flex items-end w-12 md:w-16">
                        <div
                          className="w-full bg-orange-600 rounded-t transition-all"
                          style={{ height: `${heightPercentage}%` }}
                          title={`${week.registrations} inscriptions`}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-lg font-bold text-gray-900">{week.registrations}</div>
                        <div className="text-xs text-gray-600">{week.weekLabel}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Total */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                Total période: <span className="font-bold text-gray-900">{stats.totalRegistered} inscriptions</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée disponible pour cette période
          </div>
        )}
      </div>

      {/* Ranking */}
      {stats.ranking.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 CLASSEMENT</h3>
          
          {stats.currentRank > 0 && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-center text-gray-900">
                <span className="text-2xl mr-2">{getRankEmoji(stats.currentRank)}</span>
                <span className="font-bold">
                  Tu es {stats.currentRank}{stats.currentRank === 1 ? 'er' : 'ème'} sur {stats.ranking.length} commercial{stats.ranking.length > 1 ? 'aux' : ''} ce mois !
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            {stats.ranking.slice(0, 5).map((rep) => (
              <div
                key={rep.salesRepId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  stats.currentRank === rep.rank
                    ? 'bg-orange-100 border-2 border-orange-300'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getRankEmoji(rep.rank)}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {stats.currentRank === rep.rank ? 'Toi' : rep.salesRepName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {rep.totalRegistered} inscription{rep.totalRegistered > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">#{rep.rank}</div>
                </div>
              </div>
            ))}
          </div>

          {stats.ranking.length > 5 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              ... et {stats.ranking.length - 5} autre{stats.ranking.length - 5 > 1 ? 's' : ''} commercial{stats.ranking.length - 5 > 1 ? 'aux' : ''}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 RÉSUMÉ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total inscrits</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRegistered}</div>
          </div>
          <div>
            <div className="text-gray-600">Activés</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.chrActivated + stats.depotActivated}
            </div>
          </div>
          <div>
            <div className="text-gray-600">En cours</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalRegistered - stats.chrActivated - stats.depotActivated}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
