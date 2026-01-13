import React from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { MonthlyAnnualData } from '../../../../types/activity';
import { formatCurrency } from '../../../../utils/activityUtils';

interface AnnualTableProps {
  monthlyData: MonthlyAnnualData[];
}

export const AnnualTable: React.FC<AnnualTableProps> = ({ monthlyData }) => {

  // Calculate totals
  const totals = monthlyData.reduce(
    (acc, month) => ({
      revenue: acc.revenue + month.revenue,
      expenses: acc.expenses + month.expenses,
      margin: acc.margin + month.margin,
      cashDifference: acc.cashDifference + month.cashDifference,
      daysWorked: acc.daysWorked + month.daysWorked,
    }),
    { revenue: 0, expenses: 0, margin: 0, cashDifference: 0, daysWorked: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Récapitulatif Mensuel</h2>
        <span className="text-sm text-slate-600">
          {monthlyData.filter(m => m.daysWorked > 0).length} mois avec activité
        </span>
      </div>

      {monthlyData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Aucune donnée disponible pour cette année</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Mois
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    CA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Dépenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Marge
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Écart Caisse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Jours Travaillés
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyData.map((month) => {
                  const hasData = month.daysWorked > 0;
                  const isPositiveCash = month.cashDifference >= 0;
                  const isPositiveMargin = month.margin >= 0;

                  return (
                    <tr 
                      key={month.month} 
                      className={`${hasData ? 'hover:bg-slate-50' : 'opacity-50'} transition-colors`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900 capitalize">
                          {month.monthName}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {hasData ? `${formatCurrency(month.revenue)} F` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {hasData ? `${formatCurrency(month.expenses)} F` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {hasData ? (
                          <span
                            className={`text-sm font-medium ${
                              isPositiveMargin ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(month.margin)} F
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {hasData ? (
                          <div className="flex items-center justify-end gap-1">
                            {isPositiveCash ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                isPositiveCash ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isPositiveCash ? '+' : ''}
                              {formatCurrency(month.cashDifference)} F
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {hasData ? month.daysWorked : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    TOTAUX
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(totals.revenue)} F
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(totals.expenses)} F
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-bold ${
                        totals.margin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(totals.margin)} F
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-bold ${
                        totals.cashDifference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {totals.cashDifference >= 0 ? '+' : ''}
                      {formatCurrency(totals.cashDifference)} F
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {totals.daysWorked}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
