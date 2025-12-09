import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Activity, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../ui/StatCard';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      commission: 0,
      growth: 0,
      orders: 0
    },
    orders: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      averageValue: 0,
      completionRate: 0
    },
    users: {
      totalClients: 0,
      totalSuppliers: 0,
      activeUsers: 0,
      pendingApprovals: 0
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role, approval_status');

      if (profilesError) throw profilesError;

      const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalCommission = completedOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);

      const clients = profiles?.filter(p => p.role === 'client') || [];
      const suppliers = profiles?.filter(p => p.role === 'supplier') || [];
      const pendingApprovals = profiles?.filter(p => p.approval_status === 'pending') || [];

      setAnalytics({
        revenue: {
          total: totalRevenue,
          commission: totalCommission,
          growth: 0,
          orders: completedOrders.length
        },
        orders: {
          total: orders?.length || 0,
          completed: completedOrders.length,
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
          averageValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
          completionRate: orders && orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0
        },
        users: {
          totalClients: clients.length,
          totalSuppliers: suppliers.length,
          activeUsers: profiles?.filter(p => p.approval_status === 'approved').length || 0,
          pendingApprovals: pendingApprovals.length
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
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

  const getTimeRangeLabel = () => {
    const labels = {
      day: 'Aujourd\'hui',
      week: 'Cette semaine',
      month: 'Ce mois',
      year: 'Cette année'
    };
    return labels[timeRange as keyof typeof labels];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Analytics</h1>
            <p className="text-gray-600">Suivez les performances de votre plateforme en temps réel</p>
          </div>

          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Revenu Total"
            value={formatCompactPrice(analytics.revenue.total)}
            icon={<DollarSign className="h-6 w-6" />}
            color="blue"
            trend={{ value: analytics.revenue.growth, isPositive: analytics.revenue.growth >= 0 }}
          />

          <StatCard
            title="Commission Totale"
            value={formatCompactPrice(analytics.revenue.commission)}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />

          <StatCard
            title="Commandes Complétées"
            value={analytics.orders.completed}
            icon={<Package className="h-6 w-6" />}
            color="purple"
          />

          <StatCard
            title="Utilisateurs Actifs"
            value={analytics.users.activeUsers}
            icon={<Users className="h-6 w-6" />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-600" />
              État des Commandes
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Livrées</p>
                    <p className="text-sm text-gray-600">Commandes complétées</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{analytics.orders.completed}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-yellow-200 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">En cours</p>
                    <p className="text-sm text-gray-600">En attente de livraison</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{analytics.orders.pending}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-200 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Annulées</p>
                    <p className="text-sm text-gray-600">Commandes annulées</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{analytics.orders.cancelled}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              Métriques Clés
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Valeur Moyenne des Commandes</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCompactPrice(analytics.orders.averageValue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${Math.min((analytics.orders.averageValue / 100000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Taux de Complétion</span>
                  <span className="text-lg font-bold text-gray-900">
                    {analytics.orders.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analytics.orders.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Demandes en Attente</span>
                  <span className="text-lg font-bold text-gray-900">
                    {analytics.users.pendingApprovals}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: analytics.users.pendingApprovals > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {analytics.orders.total === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <Activity className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune activité pour le moment</h3>
            <p className="text-gray-600 mb-4">
              Les statistiques apparaîtront dès que les premières commandes seront passées sur la plateforme.
            </p>
            <p className="text-sm text-gray-500">
              En attendant, vous pouvez gérer les utilisateurs et configurer les paramètres de la plateforme.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
