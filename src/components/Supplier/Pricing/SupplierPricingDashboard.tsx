/**
 * SupplierPricingDashboard - Dashboard de gestion des prix fournisseur
 * Interface principale pour les fournisseurs pour gérer leurs grilles tarifaires
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../ui/Card';
import { PriceGridTable } from './PriceGridTable';
import { usePricing } from '../../../context/PricingContext';
import { supabase } from '../../../lib/supabase';

export const SupplierPricingDashboard: React.FC = () => {
  const { supplierPriceGrids, isLoadingSupplierGrids, refreshSupplierGrids } = usePricing();
  const [stats, setStats] = useState({
    totalGrids: 0,
    activeGrids: 0,
    productsWithPrices: 0,
    avgVariance: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [supplierPriceGrids]);

  const calculateStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const totalGrids = supplierPriceGrids.length;
      const activeGrids = supplierPriceGrids.filter(g => g.isActive).length;
      const productsWithPrices = new Set(supplierPriceGrids.map(g => g.productId)).size;

      // Calculer la variance moyenne par rapport aux prix de référence
      let totalVariance = 0;
      let variantCount = 0;

      for (const grid of supplierPriceGrids.filter(g => g.isActive)) {
        try {
          const { data: refPrice } = await supabase
            .from('reference_prices')
            .select('reference_crate_price')
            .eq('product_id', grid.productId)
            .eq('is_active', true)
            .maybeSingle();

          if (refPrice && refPrice.reference_crate_price) {
            const variance = ((grid.cratePrice - refPrice.reference_crate_price) / refPrice.reference_crate_price) * 100;
            totalVariance += variance;
            variantCount++;
          }
        } catch (error) {
          // Ignore individual errors
        }
      }

      const avgVariance = variantCount > 0 ? totalVariance / variantCount : 0;

      setStats({
        totalGrids,
        activeGrids,
        productsWithPrices,
        avgVariance,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRefresh = async () => {
    await refreshSupplierGrids();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gestion de mes Prix
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos grilles tarifaires et suivez vos performances
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingSupplierGrids}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingSupplierGrids ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Grilles Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats.totalGrids}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Grilles Actives</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats.activeGrids}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalGrids > 0
                  ? `${((stats.activeGrids / stats.totalGrids) * 100).toFixed(0)}% activé`
                  : '0% activé'}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Produits Couverts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats.productsWithPrices}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Écart Moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingStats
                  ? '...'
                  : `${stats.avgVariance >= 0 ? '+' : ''}${stats.avgVariance.toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 mt-1">vs prix référence</p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              stats.avgVariance > 0 
                ? 'bg-orange-100 dark:bg-orange-900'
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                stats.avgVariance > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Info Alert */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Gestion de vos grilles tarifaires
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Définissez vos prix pour chaque produit. Les prix de référence RAVITO sont affichés pour comparaison. 
              Vous pouvez importer/exporter vos grilles en masse via Excel pour plus d'efficacité.
            </p>
          </div>
        </div>
      </Card>

      {/* Price Grid Table */}
      <PriceGridTable />
    </div>
  );
};
