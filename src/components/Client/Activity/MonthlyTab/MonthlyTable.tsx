import React from 'react';
import { CheckCircle, XCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { DailySheet } from '../../../../types/activity';

interface MonthlyTableProps {
  dailySheets: DailySheet[];
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ dailySheets }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Récapitulatif des Journées</h2>
        <span className="text-sm text-slate-600">
          {dailySheets.length} journée{dailySheets.length > 1 ? 's' : ''} clôturée{dailySheets.length > 1 ? 's' : ''}
        </span>
      </div>

      {dailySheets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Aucune journée clôturée pour ce mois</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    CA Théorique
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Dépenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Caisse Ouv.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Caisse Ferm.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Écart
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dailySheets.map((sheet) => {
                  const cashDifference = sheet.cashDifference || 0;
                  const isPositive = cashDifference >= 0;

                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {formatDate(sheet.sheetDate)}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">
                            {getDayName(sheet.sheetDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(sheet.theoreticalRevenue)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {formatCurrency(sheet.expensesTotal)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {formatCurrency(sheet.openingCash)} F
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-slate-700">
                          {sheet.closingCash !== null && sheet.closingCash !== undefined
                            ? `${formatCurrency(sheet.closingCash)} F`
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatCurrency(cashDifference)} F
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {sheet.status === 'closed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Clôturée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                            <XCircle className="w-3 h-3" />
                            Ouverte
                          </span>
                        )}
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
                    {formatCurrency(
                      dailySheets.reduce((sum, s) => sum + s.theoreticalRevenue, 0)
                    )}{' '}
                    F
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(
                      dailySheets.reduce((sum, s) => sum + s.expensesTotal, 0)
                    )}{' '}
                    F
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">-</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">-</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-bold ${
                        dailySheets.reduce((sum, s) => sum + (s.cashDifference || 0), 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {dailySheets.reduce((sum, s) => sum + (s.cashDifference || 0), 0) >= 0
                        ? '+'
                        : ''}
                      {formatCurrency(
                        dailySheets.reduce((sum, s) => sum + (s.cashDifference || 0), 0)
                      )}{' '}
                      F
                    </span>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
