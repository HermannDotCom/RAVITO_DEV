/**
 * AdminReferencePricingDashboard - Dashboard de gestion des prix de référence
 * Interface principale pour les administrateurs
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../ui/Card';
import { ReferencePriceManager } from './ReferencePriceManager';
import { PriceAnalyticsCharts } from './PriceAnalyticsCharts';
import { usePricing } from '../../../context/PricingContext';
import { generatePriceReport } from '../../../services/pricing/priceAnalyticsService';

export const AdminReferencePricingDashboard: React.FC = () => {
  const { referencePrices, isLoadingReferencePrices, refreshReferencePrices } = usePricing();
  const [activeTab, setActiveTab] = useState<'manager' | 'analytics'>('manager');
  const [report, setReport] = useState<{
    totalProducts: number;
    withReferencePrices: number;
    withSupplierPrices: number;
    avgVariance: number;
    productsAboveReference: number;
    productsBelowReference: number;
  } | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Charger le rapport au montage
  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setIsLoadingReport(true);
      const reportData = await generatePriceReport();
      setReport(reportData);
    } catch (error) {
      console.error('Error loading price report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refreshReferencePrices(),
      loadReport(),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion Tarifaire RAVITO
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Supervision des prix de référence et analytics de marché
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingReferencePrices || isLoadingReport}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingReferencePrices || isLoadingReport) ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Produits Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingReport ? '...' : report?.totalProducts || 0}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Prix de Référence</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingReport ? '...' : report?.withReferencePrices || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {report && report.totalProducts > 0
                  ? `${((report.withReferencePrices / report.totalProducts) * 100).toFixed(0)}% couverts`
                  : '0% couverts'}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Grilles Fournisseur</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingReport ? '...' : report?.withSupplierPrices || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Variance Moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoadingReport
                  ? '...'
                  : report
                  ? `${report.avgVariance >= 0 ? '+' : ''}${report.avgVariance.toFixed(1)}%`
                  : '0%'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {report && (
                  <>
                    {report.productsAboveReference} au-dessus / {report.productsBelowReference} en-dessous
                  </>
                )}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manager')}
            className={`${
              activeTab === 'manager'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Gestion des Prix
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Analytics & Tendances
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'manager' && <ReferencePriceManager />}
        {activeTab === 'analytics' && <PriceAnalyticsCharts />}
      </div>
    </div>
  );
};
