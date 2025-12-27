/**
 * PriceAnalyticsCharts - Visualisations des analytics tarifaires
 * Affiche les tendances, variances et statistiques de marché
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from '../../ui/Card';
import { usePricing } from '../../../context/PricingContext';
import { calculatePriceVariance, getPriceTrends } from '../../../services/pricing/priceAnalyticsService';
import { getProducts } from '../../../services/productService';
import { Product } from '../../../types';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const PriceAnalyticsCharts: React.FC = () => {
  const { priceAnalytics } = usePricing();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [varianceData, setVarianceData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [isLoadingVariance, setIsLoadingVariance] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, []);

  // Charger les données quand un produit est sélectionné
  useEffect(() => {
    if (selectedProductId) {
      loadVarianceData(selectedProductId);
      loadTrendData(selectedProductId);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await getProducts({ isActive: true });
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(fetchedProducts[0].id);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadVarianceData = async (productId: string) => {
    try {
      setIsLoadingVariance(true);
      const data = await calculatePriceVariance(productId);
      setVarianceData(data);
    } catch (error) {
      console.error('Error loading variance data:', error);
    } finally {
      setIsLoadingVariance(false);
    }
  };

  const loadTrendData = async (productId: string) => {
    try {
      setIsLoadingTrend(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 mois de données

      const data = await getPriceTrends(productId, startDate, endDate);
      setTrendData(data);
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  // Préparer les données pour le graphique de variance
  const varianceChartData = varianceData?.supplierPrices.map((sp: any) => ({
    name: sp.supplierName.length > 20 ? sp.supplierName.substring(0, 20) + '...' : sp.supplierName,
    prix: sp.price,
    référence: varianceData.referencePrice,
    variance: sp.variancePercentage,
  })) || [];

  // Préparer les données pour le graphique de tendance
  const trendChartData = trendData?.periods.map((period: any) => ({
    date: new Date(period.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    moyenne: period.avgPrice,
    min: period.minPrice,
    max: period.maxPrice,
  })) || [];

  // Données pour le graphique de répartition des prix
  const distributionData = priceAnalytics
    .slice(0, 5)
    .map((analytics) => {
      const product = products.find((p) => p.id === analytics.productId);
      return {
        name: product?.name || 'Inconnu',
        value: analytics.supplierPriceAvg,
      };
    });

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Produit à analyser:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.brand}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Variance Analysis */}
      {varianceData && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Analyse de Variance - {varianceData.productName}
            </h3>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Prix référence:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {varianceData.referencePrice.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Prix min:</span>
                <span className="font-semibold text-green-600">
                  {varianceData.minPrice.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Prix max:</span>
                <span className="font-semibold text-red-600">
                  {varianceData.maxPrice.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          {isLoadingVariance ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : varianceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={varianceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar dataKey="référence" fill="#94a3b8" name="Prix Référence" />
                <Bar dataKey="prix" fill="#f97316" name="Prix Fournisseur" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Aucune donnée de variance disponible
            </div>
          )}
        </Card>
      )}

      {/* Price Trends */}
      {trendData && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tendances de Prix (3 derniers mois)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Évolution des prix moyens, minimums et maximums
            </p>
          </div>

          {isLoadingTrend ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="moyenne" stroke="#f97316" strokeWidth={2} name="Prix Moyen" />
                <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={2} name="Prix Min" />
                <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} name="Prix Max" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Aucune donnée de tendance disponible
            </div>
          )}
        </Card>
      )}

      {/* Price Distribution */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Répartition des Prix (Top 5 Produits)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prix moyens fournisseurs par produit
          </p>
        </div>

        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toLocaleString()} FCFA`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Aucune donnée analytics disponible
          </div>
        )}
      </Card>

      {/* Market Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tendance Générale</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {priceAnalytics.length > 0 && priceAnalytics[0].avgVariancePercentage > 0 ? '+' : ''}
                {priceAnalytics.length > 0 ? priceAnalytics[0].avgVariancePercentage.toFixed(1) : '0'}%
              </p>
            </div>
            {priceAnalytics.length > 0 && priceAnalytics[0].avgVariancePercentage > 0 ? (
              <TrendingUp className="h-8 w-8 text-red-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-green-500" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Produits Analysés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{priceAnalytics.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commandes Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {priceAnalytics.reduce((sum, a) => sum + a.totalOrders, 0)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};
