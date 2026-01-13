import React from 'react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import { MonthlyKPIs as MonthlyKPIsType } from '../../../../types/activity';

interface MonthlyKPIsProps {
  kpis: MonthlyKPIsType;
  previousMonthKPIs?: MonthlyKPIsType;
}

export const MonthlyKPIs: React.FC<MonthlyKPIsProps> = ({ kpis, previousMonthKPIs }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateEvolution = (current: number, previous?: number): { value: number; isPositive: boolean } | null => {
    if (!previous || previous === 0) return null;
    const evolution = ((current - previous) / previous) * 100;
    return { value: Math.abs(evolution), isPositive: evolution >= 0 };
  };

  const revenueEvolution = previousMonthKPIs ? calculateEvolution(kpis.totalRevenue, previousMonthKPIs.totalRevenue) : null;

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <h2 className="text-xl font-bold text-slate-900">Indicateurs Clés du Mois</h2>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            {revenueEvolution && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                revenueEvolution.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {revenueEvolution.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {revenueEvolution.value.toFixed(1)}%
              </div>
            )}
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">CA Total</h3>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.totalRevenue)} F</p>
          <p className="text-xs text-slate-500 mt-1">
            Moy. {formatCurrency(kpis.avgDailyRevenue)} F/jour
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Dépenses Totales</h3>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.totalExpenses)} F</p>
          <p className="text-xs text-slate-500 mt-1">
            {kpis.daysWorked > 0 ? formatCurrency(kpis.totalExpenses / kpis.daysWorked) : '0'} F/jour
          </p>
        </div>

        {/* Cash Difference Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              kpis.totalCashDifference >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {kpis.totalCashDifference >= 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Écart de Caisse</h3>
          <p className={`text-2xl font-bold ${
            kpis.totalCashDifference >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {kpis.totalCashDifference >= 0 ? '+' : ''}{formatCurrency(kpis.totalCashDifference)} F
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {kpis.positiveDays}j
            </span>
            <span className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {kpis.negativeDays}j
            </span>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Jours Travaillés</h3>
          <p className="text-2xl font-bold text-slate-900">{kpis.daysWorked}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${kpis.completionRate}%` }}
              />
            </div>
            <span className="text-xs text-slate-600 font-medium">
              {kpis.completionRate.toFixed(0)}%
            </span>
          </div>
          {kpis.daysIncomplete > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              {kpis.daysIncomplete} jour{kpis.daysIncomplete > 1 ? 's' : ''} incomplet{kpis.daysIncomplete > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800 mb-1">CA Moyen Journalier</p>
          <p className="text-xl font-bold text-green-900">{formatCurrency(kpis.avgDailyRevenue)} F</p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
          <p className="text-sm font-medium text-slate-800 mb-1">Écart Moyen/Jour</p>
          <p className={`text-xl font-bold ${
            kpis.avgCashDifference >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {kpis.avgCashDifference >= 0 ? '+' : ''}{formatCurrency(kpis.avgCashDifference)} F
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-1">Marge Brute</p>
          <p className="text-xl font-bold text-blue-900">
            {formatCurrency(kpis.totalRevenue - kpis.totalExpenses)} F
          </p>
        </div>
      </div>
    </div>
  );
};
