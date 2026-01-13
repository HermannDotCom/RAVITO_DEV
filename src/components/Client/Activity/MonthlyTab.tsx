import React, { useState } from 'react';
import { FileDown, Calendar, AlertCircle, Package } from 'lucide-react';
import { useMonthlyData } from '../../../hooks/useMonthlyData';
import { useOrganizationName } from '../../../hooks/useOrganizationName';
import { MonthlyKPIs } from './MonthlyTab/MonthlyKPIs';
import { MonthlyCharts } from './MonthlyTab/MonthlyCharts';
import { MonthlyTable } from './MonthlyTab/MonthlyTable';
import { generateMonthlyPDF } from './PDFExport/generateMonthlyPDF';
import { KenteLoader } from '../../ui/KenteLoader';

interface MonthlyTabProps {
  organizationId: string;
}

export const MonthlyTab: React.FC<MonthlyTabProps> = ({ organizationId }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const { organizationName } = useOrganizationName();

  const { data, loading, error } = useMonthlyData({
    organizationId,
    month: selectedMonth,
    year: selectedYear,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long' });
  };

  // Generate month/year options
  const years = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Prepare cash difference data for chart
  const cashDifferenceData = data?.dailySheets.map(sheet => ({
    date: sheet.sheetDate,
    difference: sheet.cashDifference || 0,
  })) || [];

  // Handle PDF export
  const handleExportPDF = () => {
    if (!data) return;
    
    setExportingPDF(true);
    try {
      generateMonthlyPDF({
        establishment: {
          name: organizationName || 'Mon Établissement',
        },
        month: selectedMonth,
        year: selectedYear,
        monthlyData: data,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <KenteLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Erreur</h3>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month/Year Selector and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Clôture Mensuelle</h2>
            <p className="text-sm text-slate-600">Vue consolidée du mois</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={!data || data.dailySheets.length === 0 || exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">
              {exportingPDF ? 'Génération...' : 'Exporter PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* No Data Message */}
      {data && data.dailySheets.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Calendar className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-900 mb-2">
            Aucune donnée pour {getMonthName(selectedMonth)} {selectedYear}
          </h3>
          <p className="text-amber-800">
            Aucune journée n'a été clôturée pour cette période.
          </p>
        </div>
      ) : data ? (
        <>
          {/* KPIs Section */}
          <MonthlyKPIs kpis={data.kpis} previousMonthKPIs={data.previousMonthKPIs} />

          {/* Top Products Section */}
          {data.topProducts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Top 10 Produits Vendus</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Rang
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Quantité Vendue
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          CA Généré
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.topProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {index < 3 ? (
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                                  {index + 1}
                                </span>
                              ) : (
                                <span className="flex items-center justify-center w-6 h-6 text-slate-500 text-xs font-medium">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-slate-700">{product.qtySold}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-slate-900">
                              {formatCurrency(product.revenue)} F
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

          {/* Expenses by Category Section */}
          {data.expensesByCategory.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Dépenses par Catégorie</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.expensesByCategory.map((expense, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                  >
                    <p className="text-sm font-medium text-slate-600 mb-2 capitalize">
                      {expense.category}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(expense.total)} F
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Section */}
          <MonthlyCharts
            dailyRevenue={data.dailyRevenue}
            expensesByCategory={data.expensesByCategory}
            cashDifferenceData={cashDifferenceData}
          />

          {/* Table Section */}
          <MonthlyTable dailySheets={data.dailySheets} />
        </>
      ) : null}
    </div>
  );
};
