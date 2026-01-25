import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Target,
  CheckCircle,
  Award,
  Star,
  Clock,
  Bell,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCommission } from '../../context/CommissionContext';
import {
  getSuperAdminMetrics,
  getTopSuppliers,
  getTopClients,
  getAlerts,
  getOrderStats,
  type SuperAdminMetrics,
  type TopSupplier,
  type TopClient,
  type Alert,
  type OrderStats
} from '../../services/admin/superAdminAnalyticsService';

interface CommissionStats {
  totalClientCommissions: number;
  totalSupplierCommissions: number;
  totalCommissions: number;
  orderCount: number;
  averageCommissionPerOrder: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface MonthlyCommission {
  month: number;
  year: number;
  monthName: string;
  clientCommissions: number;
  supplierCommissions: number;
  totalCommissions: number;
  orderCount: number;
  totalRevenue: number;
  uniqueClients: number;
  activeSuppliers: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const { commissionSettings } = useCommission();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyCommission[]>([]);
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({ delivered: 0, inProgress: 0, cancelled: 0 });
  const [chartView, setChartView] = useState<'commissions' | 'revenue' | 'orders'>('commissions');

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      // Load commission data (existing logic from CommissionsDashboard)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, client_commission, supplier_commission, created_at, status, payment_status, client_id, supplier_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid');

      if (error) {
        console.error('Error loading commissions:', error);
        return;
      }

      // Calculate basic stats
      const totalClientCommissions = orders?.reduce((sum, o) => sum + (o.client_commission || 0), 0) || 0;
      const totalSupplierCommissions = orders?.reduce((sum, o) => sum + (o.supplier_commission || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      // Get total created orders for conversion rate
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalCreatedOrders = allOrders?.length || 0;
      const conversionRate = totalCreatedOrders > 0 ? (orderCount / totalCreatedOrders) * 100 : 0;

      setStats({
        totalClientCommissions,
        totalSupplierCommissions,
        totalCommissions: totalClientCommissions + totalSupplierCommissions,
        orderCount,
        averageCommissionPerOrder: orderCount > 0 ? (totalClientCommissions + totalSupplierCommissions) / orderCount : 0,
        totalRevenue,
        averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
        conversionRate
      });

      // Calculate monthly data
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
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
            orderCount: 0,
            totalRevenue: 0,
            uniqueClients: 0,
            activeSuppliers: 0
          };
        }

        monthlyMap[month].clientCommissions += order.client_commission || 0;
        monthlyMap[month].supplierCommissions += order.supplier_commission || 0;
        monthlyMap[month].totalCommissions += (order.client_commission || 0) + (order.supplier_commission || 0);
        monthlyMap[month].orderCount += 1;
        monthlyMap[month].totalRevenue += order.total_amount || 0;
      });

      // Calculate unique clients and active suppliers per month
      for (const month of Object.keys(monthlyMap)) {
        const monthNum = parseInt(month);
        const monthOrders = orders?.filter(o => new Date(o.created_at).getMonth() === monthNum) || [];
        monthlyMap[monthNum].uniqueClients = new Set(monthOrders.map(o => o.client_id)).size;
        monthlyMap[monthNum].activeSuppliers = new Set(monthOrders.map(o => o.supplier_id)).size;
      }

      setMonthlyData(Object.values(monthlyMap).sort((a, b) => a.month - b.month));

      // Load super admin metrics - ISOLÉ
      try {
        const metricsData = await getSuperAdminMetrics(startDate, endDate);
        setMetrics(metricsData);
      } catch (error) {
        console.error('Error loading metrics:', error);
        setMetrics(null);
      }

      // Load Top 5 Fournisseurs - ISOLÉ
      try {
        const suppliers = await getTopSuppliers(5, selectedYear);
        setTopSuppliers(suppliers);
      } catch (error) {
        console.error('Error loading top suppliers:', error);
        setTopSuppliers([]);
      }

      // Load Top 5 Clients - ISOLÉ
      try {
        const clients = await getTopClients(5, selectedYear);
        setTopClients(clients);
      } catch (error) {
        console.error('Error loading top clients:', error);
        setTopClients([]);
      }

      // Load Alertes - ISOLÉ
      try {
        const alertsData = await getAlerts();
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error loading alerts:', error);
        setAlerts([]);
      }

      // Load order statistics - ISOLÉ
      try {
        const orderStatsData = await getOrderStats(selectedYear);
        setOrderStats(orderStatsData);
      } catch (error) {
        console.error('Error loading order stats:', error);
        setOrderStats({ delivered: 0, inProgress: 0, cancelled: 0 });
      }

    } catch (error) {
      console.error('Exception loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  const formatCompactPrice = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M FCFA';
    }
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K FCFA';
    }
    return formatPrice(price);
  };

  const handleExport = () => {
    const headers = [
      'Mois',
      'Commandes',
      'CA Total',
      'Frais Client',
      'Commission Fournisseur',
      'Total Commissions',
      'Clients Uniques',
      'Fournisseurs Actifs'
    ];
    const rows = monthlyData.map(m => [
      m.monthName,
      m.orderCount.toString(),
      m.totalRevenue.toFixed(0),
      m.clientCommissions.toFixed(0),
      m.supplierCommissions.toFixed(0),
      m.totalCommissions.toFixed(0),
      m.uniqueClients.toString(),
      m.activeSuppliers.toString()
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `dashboard_super_admin_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxValue = useMemo(() => {
    if (chartView === 'commissions') {
      return Math.max(...monthlyData.map(m => m.totalCommissions), 1);
    } else if (chartView === 'revenue') {
      return Math.max(...monthlyData.map(m => m.totalRevenue), 1);
    } else {
      return Math.max(...monthlyData.map(m => m.orderCount), 1);
    }
  }, [monthlyData, chartView]);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Super Admin</h1>
          <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble complète de la plateforme</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Aucune donnée pour {selectedYear}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
            Les statistiques seront affichées ici une fois que des commandes auront été payées durant cette période.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Super Admin</h1>
            <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble complète de la plateforme RAVITO</p>
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

      {/* Section 1: Primary KPIs - Existing from CommissionsDashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Commissions</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">{formatPrice(stats.totalCommissions)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Revenus nets</p>
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
              <p className="text-lg sm:text-2xl font-bold text-blue-600 break-words">{formatPrice(stats.totalClientCommissions)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Payés par clients</p>
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
              <p className="text-lg sm:text-2xl font-bold text-orange-600 break-words">{formatPrice(stats.totalSupplierCommissions)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Prélevées</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Commandes Traitées</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.orderCount}</p>
              <p className="text-xs text-gray-500 mt-1">Payées</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 1b: Strategic KPIs - New Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">CA Total (GMV)</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600 break-words">{formatCompactPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Transactions</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Panier Moyen</p>
              <p className="text-lg sm:text-2xl font-bold text-teal-600 break-words">{formatCompactPrice(stats.averageOrderValue)}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Par commande</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Taux de Conversion</p>
              <p className="text-lg sm:text-2xl font-bold text-cyan-600">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Payées/Créées</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Croissance MoM</p>
              <p className={`text-lg sm:text-2xl font-bold ${metrics && metrics.monthOverMonthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics ? `${metrics.monthOverMonthGrowth >= 0 ? '+' : ''}${metrics.monthOverMonthGrowth.toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">vs mois préc.</p>
            </div>
            <div className={`h-10 w-10 sm:h-12 sm:w-12 ${metrics && metrics.monthOverMonthGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {metrics && metrics.monthOverMonthGrowth >= 0 ? (
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Business Metrics - Critical Indicators */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Performance financière */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Performance Financière
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GMV (Valeur totale)</span>
                <span className="text-sm font-bold text-gray-900">{formatCompactPrice(metrics.grossMerchandiseValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenus nets</span>
                <span className="text-sm font-bold text-green-600">{formatCompactPrice(metrics.netRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ARPU</span>
                <span className="text-sm font-bold text-gray-900">{formatCompactPrice(metrics.revenuePerUser)}</span>
              </div>
            </div>
          </div>

          {/* Santé de la plateforme */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Santé de la Plateforme
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clients actifs (30j)</span>
                <span className="text-sm font-bold text-blue-600">{metrics.activeClientsLast30Days}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fournisseurs actifs (30j)</span>
                <span className="text-sm font-bold text-orange-600">{metrics.activeSuppliersLast30Days}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nouveaux ce mois</span>
                <span className="text-sm font-bold text-gray-900">{metrics.newUsersThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Performance opérationnelle */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-600" />
              Performance Opérationnelle
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux abouties</span>
                <span className="text-sm font-bold text-green-600">{metrics.orderFulfillmentRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Temps livraison moy.</span>
                <span className="text-sm font-bold text-gray-900">{metrics.averageDeliveryTime.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux annulation</span>
                <span className={`text-sm font-bold ${metrics.cancellationRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.cancellationRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section: État des Commandes et Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* État des Commandes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">État des Commandes</h3>
          </div>
          
          <div className="space-y-3">
            {/* Livrées */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">Livrées</p>
                  <p className="text-xs sm:text-sm text-gray-500">Commandes complétées</p>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-green-600">{orderStats.delivered}</span>
            </div>
            
            {/* En cours */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">En cours</p>
                  <p className="text-xs sm:text-sm text-gray-500">En attente de livraison</p>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-yellow-600">{orderStats.inProgress}</span>
            </div>
            
            {/* Annulées */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">Annulées</p>
                  <p className="text-xs sm:text-sm text-gray-500">Commandes annulées</p>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-red-600">{orderStats.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-orange-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Alertes</h3>
            {alerts.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm sm:text-base">Aucune alerte - Tout va bien ! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                    alert.type === 'danger' 
                      ? 'bg-red-50 border-red-500' 
                      : alert.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      alert.type === 'danger' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Top Suppliers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-orange-600" />
            Top 5 Fournisseurs
          </h3>
          {topSuppliers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun fournisseur actif</p>
          ) : (
            <div className="space-y-3">
              {topSuppliers.map((supplier, index) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{supplier.orderCount} cmd</span>
                        {supplier.averageRating > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 fill-current mr-0.5" />
                              <span>{supplier.averageRating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-gray-900">{formatCompactPrice(supplier.totalRevenue)}</p>
                    <p className="text-xs text-green-600">{formatCompactPrice(supplier.commissionGenerated)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            Top 5 Clients
          </h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun client actif</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      {client.businessName && (
                        <p className="text-xs text-gray-500 truncate">{client.businessName}</p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{client.orderCount} cmd</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-0.5" />
                          <span>{new Date(client.lastOrderDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-blue-600">{formatCompactPrice(client.totalSpent)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Monthly Evolution Chart (Enhanced) */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Évolution mensuelle</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartView('commissions')}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartView === 'commissions'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Commissions
            </button>
            <button
              onClick={() => setChartView('revenue')}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartView === 'revenue'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              CA Total
            </button>
            <button
              onClick={() => setChartView('orders')}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartView === 'orders'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Commandes
            </button>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune donnée pour cette année</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {monthlyData.map((month) => {
              const value = chartView === 'commissions' ? month.totalCommissions :
                          chartView === 'revenue' ? month.totalRevenue :
                          month.orderCount;
              const displayValue = chartView === 'orders' ? value.toString() : formatPrice(value);

              return (
                <div key={month.month} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-12 sm:w-24 text-xs sm:text-sm font-medium text-gray-600">{month.monthName.substring(0, 3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-0.5 sm:gap-1 h-6 sm:h-8">
                      {chartView === 'commissions' ? (
                        <>
                          <div
                            className="bg-blue-500 rounded-l"
                            style={{ width: `${(month.clientCommissions / maxValue) * 100}%`, minWidth: month.clientCommissions > 0 ? '2px' : '0' }}
                            title={`Frais client: ${formatPrice(month.clientCommissions)}`}
                          />
                          <div
                            className="bg-orange-500 rounded-r"
                            style={{ width: `${(month.supplierCommissions / maxValue) * 100}%`, minWidth: month.supplierCommissions > 0 ? '2px' : '0' }}
                            title={`Commission fournisseur: ${formatPrice(month.supplierCommissions)}`}
                          />
                        </>
                      ) : (
                        <div
                          className={`${
                            chartView === 'revenue' ? 'bg-indigo-500' : 'bg-purple-500'
                          } rounded`}
                          style={{ width: `${(value / maxValue) * 100}%`, minWidth: value > 0 ? '2px' : '0' }}
                          title={displayValue}
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-20 sm:w-32 text-right">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{displayValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {chartView === 'commissions' && (
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
        )}
      </div>

      {/* Section 6: Monthly Detail Table (Enhanced) */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Détail mensuel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cmd</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">CA Total</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Frais Client</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Comm. Fourn.</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Clients</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fourn.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm">
                    Aucune donnée disponible
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
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-indigo-600 font-medium hidden md:table-cell">
                      {formatPrice(month.totalRevenue)}
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
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center text-gray-600 hidden lg:table-cell">
                      {month.uniqueClients}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center text-gray-600 hidden lg:table-cell">
                      {month.activeSuppliers}
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
                    {stats.orderCount}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-indigo-600 hidden md:table-cell">
                    {formatPrice(stats.totalRevenue)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-blue-600">
                    {formatPrice(stats.totalClientCommissions)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-orange-600 hidden sm:table-cell">
                    {formatPrice(stats.totalSupplierCommissions)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-green-600">
                    {formatPrice(stats.totalCommissions)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center font-bold text-gray-900 hidden lg:table-cell">
                    -
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center font-bold text-gray-900 hidden lg:table-cell">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section 7: Commission Structure (Existing) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 sm:mb-4">Structure des commissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">Frais client ({commissionSettings.clientCommission}%)</p>
            <p>Ces frais sont ajoutés au montant de l'offre et payés par le client lors du paiement de la commande.</p>
          </div>
          <div>
            <p className="font-medium mb-2">Commission fournisseur ({commissionSettings.supplierCommission}%)</p>
            <p>Cette commission est prélevée sur le montant de l'offre lors du virement au fournisseur.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
