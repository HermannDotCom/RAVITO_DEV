import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  PieChart,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCommission } from '../../context/CommissionContext';

interface CommissionStats {
  totalClientCommissions: number;
  totalSupplierCommissions: number;
  totalCommissions: number;
  orderCount: number;
  averageCommissionPerOrder: number;
}

interface MonthlyCommission {
  month: number;
  year: number;
  monthName: string;
  clientCommissions: number;
  supplierCommissions: number;
  totalCommissions: number;
  orderCount: number;
}

export const CommissionsDashboard: React.FC = () => {
  const { commissionSettings } = useCommission();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1y');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyCommission[]>([]);

  useEffect(() => {
    loadCommissionsData();
  }, [period, selectedYear]);

  const loadCommissionsData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, client_commission, supplier_commission, created_at, status, payment_status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid');

      if (error) {
        console.error('Error loading commissions:', error);
        return;
      }

      const totalClientCommissions = orders?.reduce((sum, o) => sum + (o.client_commission || 0), 0) || 0;
      const totalSupplierCommissions = orders?.reduce((sum, o) => sum + (o.supplier_commission || 0), 0) || 0;
      const orderCount = orders?.length || 0;

      setStats({
        totalClientCommissions,
        totalSupplierCommissions,
        totalCommissions: totalClientCommissions + totalSupplierCommissions,
        orderCount,
        averageCommissionPerOrder: orderCount > 0 ? (totalClientCommissions + totalSupplierCommissions) / orderCount : 0
      });

      const monthNames = [
        'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
      ];

      const monthlyMap: Record<number, MonthlyCommission> = {};

      orders?.forEach(order => {
        const date = new Date(order.created_at);
        const month = date.getMonth();

        if (!monthlyMap[month]) {
          monthlyMap[month] = {
            month: month + 1,
            year: selectedYear,
            monthName: monthNames[month],
            clientCommissions: 0,
            supplierCommissions: 0,
            totalCommissions: 0,
            orderCount: 0
          };
        }

        monthlyMap[month].clientCommissions += order.client_commission || 0;
        monthlyMap[month].supplierCommissions += order.supplier_commission || 0;
        monthlyMap[month].totalCommissions += (order.client_commission || 0) + (order.supplier_commission || 0);
        monthlyMap[month].orderCount += 1;
      });

      setMonthlyData(Object.values(monthlyMap).sort((a, b) => a.month - b.month));
    } catch (error) {
      console.error('Exception loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const handleExport = () => {
    const headers = ['Mois', 'Commandes', 'Frais Client', 'Commission Fournisseur', 'Total Commissions'];
    const rows = monthlyData.map(m => [
      m.monthName,
      m.orderCount.toString(),
      m.clientCommissions.toFixed(0),
      m.supplierCommissions.toFixed(0),
      m.totalCommissions.toFixed(0)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `commissions_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxCommission = useMemo(() => {
    return Math.max(...monthlyData.map(m => m.totalCommissions), 1);
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!stats || stats.orderCount === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mes Commissions</h1>
          <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble des commissions perçues</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Aucune commission pour {selectedYear}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
            Les commissions seront affichées ici une fois que des commandes auront été payées durant cette période.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Année précédente
            </button>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Année suivante
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mes Commissions</h1>
            <p className="text-sm sm:text-base text-gray-600">Vue detaillee des commissions percues par la plateforme</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {[0, 1, 2].map(offset => {
                const year = new Date().getFullYear() - offset;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <button
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Commissions</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">{formatPrice(stats?.totalCommissions || 0)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Annee {selectedYear}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Frais Client ({commissionSettings.clientCommission}%)</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 break-words">{formatPrice(stats?.totalClientCommissions || 0)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Payes par les clients</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Commission Fournisseur ({commissionSettings.supplierCommission}%)</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600 break-words">{formatPrice(stats?.totalSupplierCommissions || 0)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Prelevees sur les offres</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Commandes Traitees</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats?.orderCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Moy: {formatPrice(stats?.averageCommissionPerOrder || 0)}/cmd</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Evolution des commissions mensuelles</h3>
        </div>

        {monthlyData.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune donnee pour cette annee</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month} className="flex items-center gap-2 sm:gap-4">
                <div className="w-12 sm:w-24 text-xs sm:text-sm font-medium text-gray-600">{month.monthName.substring(0, 3)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-0.5 sm:gap-1 h-6 sm:h-8">
                    <div
                      className="bg-blue-500 rounded-l"
                      style={{ width: `${(month.clientCommissions / maxCommission) * 100}%`, minWidth: month.clientCommissions > 0 ? '2px' : '0' }}
                      title={`Frais client: ${formatPrice(month.clientCommissions)}`}
                    />
                    <div
                      className="bg-orange-500 rounded-r"
                      style={{ width: `${(month.supplierCommissions / maxCommission) * 100}%`, minWidth: month.supplierCommissions > 0 ? '2px' : '0' }}
                      title={`Commission fournisseur: ${formatPrice(month.supplierCommissions)}`}
                    />
                  </div>
                </div>
                <div className="w-20 sm:w-32 text-right">
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">{formatPrice(month.totalCommissions)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Frais client ({commissionSettings.clientCommission}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Commission fournisseur ({commissionSettings.supplierCommission}%)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail mensuel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cmd</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Frais Client</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Commission Fournisseur</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                    Aucune donnee disponible
                  </td>
                </tr>
              ) : (
                monthlyData.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {month.monthName}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center text-gray-600">
                      {month.orderCount}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-blue-600 font-medium">
                      {formatPrice(month.clientCommissions)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-orange-600 font-medium hidden sm:table-cell">
                      {formatPrice(month.supplierCommissions)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-green-600 font-bold">
                      {formatPrice(month.totalCommissions)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {monthlyData.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                    Total {selectedYear}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center font-bold text-gray-900">
                    {stats?.orderCount || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-blue-600">
                    {formatPrice(stats?.totalClientCommissions || 0)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-orange-600 hidden sm:table-cell">
                    {formatPrice(stats?.totalSupplierCommissions || 0)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-green-600">
                    {formatPrice(stats?.totalCommissions || 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Structure des commissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">Frais client ({commissionSettings.clientCommission}%)</p>
            <p>Ces frais sont ajoutes au montant de l'offre et payes par le client lors du paiement de la commande.</p>
          </div>
          <div>
            <p className="font-medium mb-2">Commission fournisseur ({commissionSettings.supplierCommission}%)</p>
            <p>Cette commission est prelevee sur le montant de l'offre lors du virement au fournisseur.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
