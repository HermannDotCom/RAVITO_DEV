import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Award,
  Target
} from 'lucide-react';
import { AnnualKPIs as AnnualKPIsType } from '../../../../types/activity';
import { formatCurrency, calculateEvolution } from '../../../../utils/activityUtils';

interface AnnualKPIsProps {
  kpis: AnnualKPIsType;
  previousYearKPIs?: AnnualKPIsType;
}

export const AnnualKPIs: React.FC<AnnualKPIsProps> = ({ kpis, previousYearKPIs }) => {
  const revenueEvolution = previousYearKPIs ? calculateEvolution(kpis.totalRevenue, previousYearKPIs.totalRevenue) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Title */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">Indicateurs Clés de l'Année</h2>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
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
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 mb-1">CA Total Annuel</h3>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{formatCurrency(kpis.totalRevenue)} F</p>
          <p className="text-xs text-slate-500 mt-1">
            Moy. {formatCurrency(kpis.avgMonthlyRevenue)} F/mois
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Dépenses Totales</h3>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{formatCurrency(kpis.totalExpenses)} F</p>
          <p className="text-xs text-slate-500 mt-1">
            Ratio CA : {kpis.expensesRatio.toFixed(1)}%
          </p>
        </div>

        {/* Margin Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Marge Brute</h3>
          <p className="text-lg sm:text-2xl font-bold text-blue-900">{formatCurrency(kpis.grossMargin)} F</p>
          <p className="text-xs text-slate-500 mt-1">
            Taux : {kpis.marginRate.toFixed(1)}%
          </p>
        </div>

        {/* Cash Difference Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
              kpis.totalCashDifference >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {kpis.totalCashDifference >= 0 ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              )}
            </div>
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Écart de Caisse</h3>
          <p className={`text-lg sm:text-2xl font-bold ${
            kpis.totalCashDifference >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {kpis.totalCashDifference >= 0 ? '+' : ''}{formatCurrency(kpis.totalCashDifference)} F
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {kpis.positiveMonths}m
            </span>
            <span className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {kpis.negativeMonths}m
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Best Month */}
        {kpis.bestMonth && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <p className="text-xs sm:text-sm font-medium text-green-800">Meilleur Mois</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-green-900 capitalize">
              {kpis.bestMonth.monthName}
            </p>
            <p className="text-xs sm:text-sm text-green-700 mt-1">
              {formatCurrency(kpis.bestMonth.revenue)} F
            </p>
          </div>
        )}

        {/* Worst Month */}
        {kpis.worstMonth && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              <p className="text-xs sm:text-sm font-medium text-slate-800">Mois le Plus Faible</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-slate-900 capitalize">
              {kpis.worstMonth.monthName}
            </p>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              {formatCurrency(kpis.worstMonth.revenue)} F
            </p>
          </div>
        )}

        {/* Activity */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <p className="text-xs sm:text-sm font-medium text-blue-800">Jours Travaillés</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-blue-900">{kpis.totalDaysWorked} jours</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-blue-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${kpis.completionRate}%` }}
              />
            </div>
            <span className="text-xs text-blue-700 font-medium">
              {kpis.completionRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Average Cash Difference */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
          <p className="text-xs sm:text-sm font-medium text-purple-800 mb-2">Écart Moyen/Mois</p>
          <p className={`text-base sm:text-xl font-bold ${
            kpis.avgMonthlyCashDifference >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {kpis.avgMonthlyCashDifference >= 0 ? '+' : ''}{formatCurrency(kpis.avgMonthlyCashDifference)} F
          </p>
        </div>
      </div>

      {/* Additional Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">CA Moyen Mensuel</p>
          <p className="text-base sm:text-xl font-bold text-slate-900">{formatCurrency(kpis.avgMonthlyRevenue)} F</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Dépenses Moyennes Mensuelles</p>
          <p className="text-base sm:text-xl font-bold text-slate-900">{formatCurrency(kpis.avgMonthlyExpenses)} F</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Marge Brute Moyenne Mensuelle</p>
          <p className="text-base sm:text-xl font-bold text-slate-900">
            {formatCurrency(kpis.monthsWithData > 0 ? kpis.grossMargin / kpis.monthsWithData : 0)} F
          </p>
        </div>
      </div>
    </div>
  );
};
