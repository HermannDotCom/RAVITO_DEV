import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  CreditCard,
  TrendingUp as TrendingUpIcon,
  Download,
  BarChart3
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
import { MarketplaceStats, SubscriptionStats, GlobalStats } from './Dashboard';

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
  
  // Tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState<'marketplace' | 'subscriptions' | 'global'>(() => {
    const saved = localStorage.getItem('superadmin_dashboard_tab');
    return (saved as 'marketplace' | 'subscriptions' | 'global') || 'global';
  });

  // Save tab selection to localStorage
  useEffect(() => {
    localStorage.setItem('superadmin_dashboard_tab', activeTab);
  }, [activeTab]);

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

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'bg-orange-500 text-white border-b-2 border-orange-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Marketplace</span>
          </button>
          
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'bg-orange-500 text-white border-b-2 border-orange-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Abonnements</span>
          </button>
          
          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'global'
                ? 'bg-orange-500 text-white border-b-2 border-orange-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUpIcon className="h-4 w-4" />
            <span>Vue globale</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'marketplace' && stats && (
        <MarketplaceStats
          stats={stats}
          monthlyData={monthlyData}
          metrics={metrics}
          topSuppliers={topSuppliers}
          topClients={topClients}
          alerts={alerts}
          orderStats={orderStats}
          chartView={chartView}
          setChartView={setChartView}
          commissionSettings={commissionSettings}
        />
      )}
      
      {activeTab === 'subscriptions' && (
        <SubscriptionStats selectedYear={selectedYear} />
      )}
      
      {activeTab === 'global' && (
        <GlobalStats selectedYear={selectedYear} />
      )}
    </div>
  );
};
