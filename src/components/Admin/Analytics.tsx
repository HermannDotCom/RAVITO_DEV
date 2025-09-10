import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Package, MapPin, Clock, Star, Calendar, DollarSign, Target, Activity, Zap, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Analytics: React.FC = () => {
  const { allOrders, commissionSettings } = useApp();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  // Calculate real analytics from orders
  const calculateAnalytics = () => {
    const now = new Date();
    let startDate = new Date();
    
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

    const filteredOrders = allOrders.filter(order => order.createdAt >= startDate);
    const completedOrders = filteredOrders.filter(order => order.status === 'delivered');
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalCommission = completedOrders.reduce((sum, order) => {
      const baseAmount = order.totalAmount / (1 + commissionSettings.clientCommission / 100);
      return sum + (baseAmount * (commissionSettings.clientCommission + commissionSettings.supplierCommission) / 100);
    }, 0);

    return {
      revenue: {
        total: totalRevenue,
        commission: totalCommission,
        growth: Math.random() * 20 + 5, // Mock growth
        orders: completedOrders.length
      },
      orders: {
        total: filteredOrders.length,
        completed: completedOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
        averageValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        completionRate: filteredOrders.length > 0 ? (completedOrders.length / filteredOrders.length) * 100 : 0
      }
    };
  };

  const analytics = calculateAnalytics();

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

  // Mock data for charts and detailed analytics
  const zonePerformance = [
    { name: 'Plateau', orders: 45, revenue: 1200000, suppliers: 5, avgTime: 18, growth: 15.2 },
    { name: 'Cocody', orders: 38, revenue: 980000, suppliers: 4, avgTime: 22, growth: 12.8 },
    { name: 'Marcory', orders: 28, revenue: 720000, suppliers: 3, avgTime: 25, growth: 8.5 },
    { name: 'Treichville', orders: 22, revenue: 580000, suppliers: 3, avgTime: 20, growth: 18.7 },
    { name: 'Adjamé', orders: 18, revenue: 450000, suppliers: 2, avgTime: 28, growth: 5.3 }
  ];

  const supplierPerformance = [
    { name: 'Dépôt du Plateau', orders: 45, rating: 4.8, revenue: 1200000, onTime: 95, zones: 4 },
    { name: 'Dépôt Cocody Express', orders: 38, rating: 4.6, revenue: 980000, onTime: 92, zones: 3 },
    { name: 'Dépôt Marcory', orders: 28, rating: 4.5, revenue: 720000, onTime: 88, zones: 2 },
    { name: 'Cocody Express', orders: 22, rating: 4.4, revenue: 580000, onTime: 90, zones: 2 },
    { name: 'Dépôt Treichville', orders: 18, rating: 4.7, revenue: 450000, onTime: 94, zones: 2 }
  ];

  const clientSegments = [
    { type: 'Maquis Premium', count: 45, avgOrder: 85000, frequency: 'Quotidienne', revenue: 3825000 },
    { type: 'Bars Haut Standing', count: 23, avgOrder: 120000, frequency: '3x/semaine', revenue: 2760000 },
    { type: 'Maquis Standard', count: 67, avgOrder: 45000, frequency: '2x/semaine', revenue: 3015000 },
    { type: 'Bars Populaires', count: 34, avgOrder: 35000, frequency: 'Hebdomadaire', revenue: 1190000 },
    { type: 'Événements', count: 12, avgOrder: 200000, frequency: 'Occasionnelle', revenue: 2400000 }
  ];

  const hourlyDistribution = [
    { hour: '18h-19h', orders: 15, percentage: 12 },
    { hour: '19h-20h', orders: 28, percentage: 22 },
    { hour: '20h-21h', orders: 35, percentage: 28 },
    { hour: '21h-22h', orders: 25, percentage: 20 },
    { hour: '22h-23h', orders: 18, percentage: 14 },
    { hour: '23h-00h', orders: 8, percentage: 6 },
    { hour: '00h-01h', orders: 5, percentage: 4 },
    { hour: 'Autres', orders: 3, percentage: 2 }
  ];

  const productCategories = [
    { category: 'Bières', orders: 89, revenue: 4200000, margin: 15.2, topBrand: 'Flag' },
    { category: 'Sodas', orders: 45, revenue: 1800000, margin: 18.5, topBrand: 'Coca-Cola' },
    { category: 'Vins', orders: 23, revenue: 2100000, margin: 22.0, topBrand: 'Cellier' },
    { category: 'Spiritueux', orders: 12, revenue: 1900000, margin: 25.8, topBrand: 'Johnnie Walker' },
    { category: 'Eaux', orders: 34, revenue: 680000, margin: 12.3, topBrand: 'Awoulaba' }
  ];

  const kpiMetrics = [
    {
      title: 'Taux de conversion',
      value: '87.5%',
      change: '+2.3%',
      trend: 'up',
      description: 'Commandes confirmées / Commandes initiées',
      icon: Target,
      color: 'green'
    },
    {
      title: 'Temps moyen de livraison',
      value: '22 min',
      change: '-1.5 min',
      trend: 'up',
      description: 'Délai moyen de livraison effectif',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Satisfaction client',
      value: '4.6/5',
      change: '+0.2',
      trend: 'up',
      description: 'Note moyenne des évaluations clients',
      icon: Star,
      color: 'yellow'
    },
    {
      title: 'Taux d\'annulation',
      value: '3.2%',
      change: '-0.8%',
      trend: 'up',
      description: 'Commandes annulées / Total commandes',
      icon: XCircle,
      color: 'red'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyses et Pilotage</h1>
            <p className="text-gray-600">Tableau de bord analytique complet de DISTRI-NIGHT</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="revenue">Chiffre d'affaires</option>
              <option value="orders">Commandes</option>
              <option value="users">Utilisateurs</option>
              <option value="performance">Performance</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-lg bg-${kpi.color}-100 flex items-center justify-center`}>
                  <KpiIcon className={`h-6 w-6 text-${kpi.color}-600`} />
                </div>
                <span className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Analytics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Analyse financière - {getTimeRangeLabel()}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{formatCompactPrice(analytics.revenue.total)}</div>
              <div className="text-sm text-gray-600">Chiffre d'affaires total</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatCompactPrice(analytics.revenue.commission)}</div>
              <div className="text-sm text-gray-600">Commissions DISTRI-NIGHT</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Commission client ({commissionSettings.clientCommission}%)</span>
              <span className="font-bold text-blue-600">
                {formatCompactPrice(analytics.revenue.commission * 0.8)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Commission fournisseur ({commissionSettings.supplierCommission}%)</span>
              <span className="font-bold text-orange-600">
                {formatCompactPrice(analytics.revenue.commission * 0.2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 font-medium">Marge nette DISTRI-NIGHT</span>
              <span className="font-bold text-green-600">
                {((analytics.revenue.commission / analytics.revenue.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Order Analytics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-orange-600" />
            Analyse des commandes - {getTimeRangeLabel()}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{analytics.orders.total}</div>
              <div className="text-sm text-gray-600">Commandes totales</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{analytics.orders.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Livrées</span>
              </div>
              <span className="font-bold text-green-600">{analytics.orders.completed}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-700">En attente</span>
              </div>
              <span className="font-bold text-yellow-600">{analytics.orders.pending}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-gray-700">Annulées</span>
              </div>
              <span className="font-bold text-red-600">{analytics.orders.cancelled}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-purple-800 font-medium">Panier moyen</span>
              <span className="font-bold text-purple-600">{formatCompactPrice(analytics.orders.averageValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Performance Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-orange-600" />
          Performance par zone de livraison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chiffre d'affaires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseurs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps moyen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Croissance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zonePerformance.map((zone, index) => (
                <tr key={zone.name} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{zone.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{zone.orders}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCompactPrice(zone.revenue)}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{zone.suppliers}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{zone.avgTime} min</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      zone.growth > 10 ? 'bg-green-100 text-green-800' :
                      zone.growth > 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {zone.growth > 0 ? '+' : ''}{zone.growth.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2 text-green-600" />
          Top fournisseurs - Performance détaillée
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {supplierPerformance.map((supplier, index) => (
            <div key={supplier.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{supplier.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraisons:</span>
                  <span className="font-medium text-gray-900">{supplier.orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chiffre d'affaires:</span>
                  <span className="font-medium text-gray-900">{formatCompactPrice(supplier.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ponctualité:</span>
                  <span className={`font-medium ${supplier.onTime >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                    {supplier.onTime}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zones couvertes:</span>
                  <span className="font-medium text-gray-900">{supplier.zones}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Segmentation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Segmentation clientèle
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientSegments.map((segment, index) => (
            <div key={segment.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{segment.type}</h4>
                <span className="text-lg font-bold text-blue-600">{segment.count}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Panier moyen:</span>
                  <span className="font-medium text-gray-900">{formatCompactPrice(segment.avgOrder)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fréquence:</span>
                  <span className="font-medium text-gray-900">{segment.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CA total:</span>
                  <span className="font-bold text-green-600">{formatCompactPrice(segment.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Distribution & Product Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-600" />
            Répartition horaire des commandes
          </h3>
          
          <div className="space-y-3">
            {hourlyDistribution.map((slot) => (
              <div key={slot.hour} className="flex items-center space-x-3">
                <span className="w-16 text-sm font-medium text-gray-700">{slot.hour}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${slot.percentage}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm font-bold text-gray-900">{slot.orders}</span>
                <span className="w-12 text-xs text-gray-500">{slot.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-orange-600" />
            Performance par catégorie
          </h3>
          
          <div className="space-y-4">
            {productCategories.map((category) => (
              <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <span className="text-sm text-gray-500">Top: {category.topBrand}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{category.orders}</div>
                    <div className="text-gray-600 text-xs">Commandes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{formatCompactPrice(category.revenue)}</div>
                    <div className="text-gray-600 text-xs">Revenus</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">{category.margin.toFixed(1)}%</div>
                    <div className="text-gray-600 text-xs">Marge</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Activité en temps réel
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fournisseurs en ligne:</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-bold text-green-600">12/18</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Commandes actives:</span>
              <span className="font-bold text-orange-600">{analytics.orders.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Livraisons en cours:</span>
              <span className="font-bold text-blue-600">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Temps moyen actuel:</span>
              <span className="font-bold text-purple-600">19 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            Indicateurs de qualité
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Satisfaction globale:</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-bold text-yellow-600">4.6/5</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Livraisons à l'heure:</span>
              <span className="font-bold text-green-600">92.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Réclamations:</span>
              <span className="font-bold text-red-600">1.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fidélisation:</span>
              <span className="font-bold text-blue-600">78.5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
            Moyens de paiement
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Orange Money:</span>
              <span className="font-bold text-orange-600">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">MTN Mobile Money:</span>
              <span className="font-bold text-yellow-600">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Wave:</span>
              <span className="font-bold text-purple-600">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Moov Money:</span>
              <span className="font-bold text-blue-600">8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cartes bancaires:</span>
              <span className="font-bold text-gray-600">4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Trends */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Tendances de croissance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">+{analytics.revenue.growth.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mb-1">Croissance CA</div>
            <div className="text-xs text-green-600">vs période précédente</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">+23%</div>
            <div className="text-sm text-gray-600 mb-1">Nouveaux clients</div>
            <div className="text-xs text-blue-600">ce mois</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">+18%</div>
            <div className="text-sm text-gray-600 mb-1">Fréquence commandes</div>
            <div className="text-xs text-orange-600">par client actif</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">+15%</div>
            <div className="text-sm text-gray-600 mb-1">Panier moyen</div>
            <div className="text-xs text-purple-600">évolution mensuelle</div>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          Alertes et recommandations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Zone Yopougon sous-performante</p>
                <p className="text-sm text-yellow-700">Temps de livraison moyen: 35 min (objectif: 25 min)</p>
                <p className="text-xs text-yellow-600 mt-1">Recommandation: Recruter 1-2 fournisseurs supplémentaires</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Excellent taux de satisfaction</p>
                <p className="text-sm text-green-700">4.6/5 en moyenne sur tous les fournisseurs</p>
                <p className="text-xs text-green-600 mt-1">Maintenir la qualité de service actuelle</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Croissance forte zone Plateau</p>
                <p className="text-sm text-blue-700">+15.2% de commandes ce mois</p>
                <p className="text-xs text-blue-600 mt-1">Opportunité: Étendre les horaires de service</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Demande forte en spiritueux</p>
                <p className="text-sm text-orange-700">+25% de commandes, marge élevée (25.8%)</p>
                <p className="text-xs text-orange-600 mt-1">Recommandation: Élargir le catalogue premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};