/**
 * Supplier Intelligence Dashboard
 * 
 * Premium analytics dashboard for suppliers with tier-based feature access
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Star,
  Target,
  Award,
  AlertCircle,
  Zap,
  BarChart3,
  Crown,
  Lock,
  Info,
  Truck,
  Package
} from 'lucide-react';
import { SupplierAnalyticsService } from '../../services/supplierAnalyticsService';
import { SubscriptionService } from '../../services/subscriptionService';
import type { SubscriptionTier } from '../../types/intelligence';
import { KenteLoader } from '../ui/KenteLoader';

interface SupplierIntelligenceDashboardProps {
  supplierId: string;
  onNavigate?: (section: string) => void;
}

// Helper function to determine KPI performance color
const getKpiColor = (value: number, type: 'rate' | 'time' | 'rating' | 'revenue') => {
  switch (type) {
    case 'rate':
      if (value >= 90) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' };
      if (value >= 70) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' };
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' };
    case 'time':
      if (value === 0) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: 'text-gray-500' };
      if (value <= 30) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' };
      if (value <= 45) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' };
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' };
    case 'rating':
      if (value >= 4.5) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-yellow-500' };
      if (value >= 3.5) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' };
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-yellow-500' };
    case 'revenue':
      return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900', icon: 'text-green-600' };
    default:
      return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900', icon: 'text-gray-600' };
  }
};

// Check if all KPIs are zero/empty
const hasNoData = (kpis: Record<string, number> | null) => {
  if (!kpis) return true;
  return (kpis.acceptanceRate || 0) === 0 && 
         (kpis.avgDeliveryTime || 0) === 0 && 
         (kpis.customerRating || 0) === 0 && 
         (kpis.monthlyRevenue || 0) === 0;
};

// Demo data for illustration
const DEMO_DATA = {
  acceptanceRate: 92,
  avgDeliveryTime: 28,
  customerRating: 4.7,
  monthlyRevenue: 485000,
  revenueGrowth: 12.5,
  customerRetention: 78
};

export const SupplierIntelligenceDashboard: React.FC<SupplierIntelligenceDashboardProps> = ({
  supplierId,
  onNavigate
}) => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [featureAccess, setFeatureAccess] = useState<Record<string, boolean> | null>(null);
  const [revenueOpportunity, setRevenueOpportunity] = useState<{
    currentMonthlyRevenue: number;
    potentialMonthlyRevenue: number;
    gapToTop10Percent: number;
    actionItems: string[];
  } | null>(null);
  const [showDemoData, setShowDemoData] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [supplierId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load KPIs
      const kpisData = await SupplierAnalyticsService.getDashboardKPIs(supplierId);
      setKpis(kpisData);

      // Load subscription and tier
      const subData = await SubscriptionService.getSupplierSubscriptionWithTier(supplierId);
      if (subData) {
        setTier(subData.tier);
      }

      // Load feature access
      const access = await SubscriptionService.getFeatureAccessMap(supplierId);
      setFeatureAccess(access);

      // Load revenue opportunity (GOLD+ feature)
      if (access.mlPredictions) {
        const opportunity = await SupplierAnalyticsService.getRevenueOpportunity(supplierId);
        setRevenueOpportunity(opportunity);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <KenteLoader size="md" text="Chargement..." />
      </div>
    );
  }

  const tierColor: Record<string, string> = {
    FREE: 'bg-gray-100 border-gray-300 text-gray-600',
    SILVER: 'bg-blue-100 border-blue-300 text-blue-600',
    GOLD: 'bg-yellow-100 border-yellow-300 text-yellow-600',
    PLATINUM: 'bg-purple-100 border-purple-300 text-purple-600'
  };

  const tierIconColor: Record<string, string> = {
    FREE: 'text-gray-600',
    SILVER: 'text-blue-600',
    GOLD: 'text-yellow-600',
    PLATINUM: 'text-purple-600'
  };

  const tierTextColor: Record<string, string> = {
    FREE: 'text-gray-900',
    SILVER: 'text-blue-900',
    GOLD: 'text-yellow-900',
    PLATINUM: 'text-purple-900'
  };

  const tierIcon = {
    FREE: Target,
    SILVER: Award,
    GOLD: Crown,
    PLATINUM: Zap
  }[tier?.tierName || 'FREE'];

  const TierIcon = tierIcon;

  const isEmptyData = hasNoData(kpis);
  const displayKpis = showDemoData ? DEMO_DATA : kpis;

  // Get colors for each KPI
  const acceptanceColor = getKpiColor(displayKpis?.acceptanceRate || 0, 'rate');
  const deliveryColor = getKpiColor(displayKpis?.avgDeliveryTime || 0, 'time');
  const ratingColor = getKpiColor(displayKpis?.customerRating || 0, 'rating');
  const revenueColor = getKpiColor(displayKpis?.monthlyRevenue || 0, 'revenue');

  return (
    <div className="space-y-6 p-6">
      {/* Header with Subscription Badge */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-1">Analytiques avancées et insights marché</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${tierColor[tier?.tierName || 'FREE']}`}>
          <TierIcon className={tierIconColor[tier?.tierName || 'FREE']} />
          <span className={`font-semibold ${tierTextColor[tier?.tierName || 'FREE']}`}>
            {tier?.tierName || 'FREE'} Tier
          </span>
        </div>
      </div>

      {/* Empty State Banner */}
      {isEmptyData && !showDemoData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Commencez à livrer pour voir vos statistiques</h3>
                <p className="text-gray-600 text-sm">
                  Vos KPIs s'afficheront automatiquement après vos premières livraisons
                </p>
              </div>
            </div>
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setShowDemoData(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Voir un exemple
              </button>
              <button
                onClick={() => onNavigate?.('orders')}
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Voir commandes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Data Banner */}
      {showDemoData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Mode démonstration - Données d'exemple pour illustrer le potentiel
              </p>
            </div>
            <button
              onClick={() => setShowDemoData(false)}
              className="text-amber-600 hover:text-amber-800 font-medium text-sm"
            >
              Masquer la démo
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Banner for FREE/SILVER users */}
      {tier?.tierName !== 'PLATINUM' && tier?.tierName !== 'GOLD' && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6" />
                <h3 className="text-xl font-bold">Débloquez l'Intelligence Premium</h3>
              </div>
              <p className="text-orange-100 mb-4">
                Obtenez des prédictions ML en temps réel, l'optimisation des prix et le benchmarking concurrentiel avec le tier GOLD
              </p>
              <button
                onClick={() => onNavigate?.('premium')}
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Passer à GOLD - 15,000 F/mois
              </button>
            </div>
            <Crown className="h-16 w-16 text-orange-200 opacity-50 hidden md:block" />
          </div>
        </div>
      )}

      {/* KPI Cards with Performance Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Acceptance Rate */}
        <div className={`rounded-xl p-6 shadow-sm border ${acceptanceColor.bg} ${acceptanceColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Taux d'acceptation</span>
            <Target className={`h-5 w-5 ${acceptanceColor.icon}`} />
          </div>
          <div className={`text-3xl font-bold ${acceptanceColor.text}`}>
            {displayKpis?.acceptanceRate || 0}%
          </div>
          <div className="flex items-center gap-1 mt-2">
            {(displayKpis?.acceptanceRate || 0) >= 90 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Excellent</span>
              </>
            ) : (displayKpis?.acceptanceRate || 0) >= 70 ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Correct</span>
              </>
            ) : (displayKpis?.acceptanceRate || 0) > 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">À améliorer</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Aucune donnée</span>
            )}
          </div>
          {(displayKpis?.acceptanceRate || 0) > 0 && (displayKpis?.acceptanceRate || 0) < 90 && (
            <div className="mt-2 text-xs text-gray-500">
              Moyenne marché: 85%
            </div>
          )}
        </div>

        {/* Delivery Time */}
        <div className={`rounded-xl p-6 shadow-sm border ${deliveryColor.bg} ${deliveryColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Temps livraison moy.</span>
            <Clock className={`h-5 w-5 ${deliveryColor.icon}`} />
          </div>
          <div className={`text-3xl font-bold ${deliveryColor.text}`}>
            {displayKpis?.avgDeliveryTime || 0} min
          </div>
          <div className="flex items-center gap-1 mt-2">
            {(displayKpis?.avgDeliveryTime || 0) === 0 ? (
              <span className="text-sm text-gray-500">Aucune donnée</span>
            ) : (displayKpis?.avgDeliveryTime || 0) <= 30 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Rapide</span>
              </>
            ) : (displayKpis?.avgDeliveryTime || 0) <= 45 ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Correct</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Lent</span>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Objectif: 45 min
          </div>
        </div>

        {/* Customer Rating */}
        <div className={`rounded-xl p-6 shadow-sm border ${ratingColor.bg} ${ratingColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Note clients</span>
            <Star className={`h-5 w-5 ${ratingColor.icon}`} />
          </div>
          <div className={`text-3xl font-bold ${ratingColor.text}`}>
            {displayKpis?.customerRating?.toFixed(1) || '0.0'}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (displayKpis?.customerRating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {(displayKpis?.customerRating || 0) === 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Aucune évaluation
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className={`rounded-xl p-6 shadow-sm border ${revenueColor.bg} ${revenueColor.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Revenu mensuel</span>
            <DollarSign className={`h-5 w-5 ${revenueColor.icon}`} />
          </div>
          <div className={`text-3xl font-bold ${revenueColor.text}`}>
            {(displayKpis?.monthlyRevenue || 0).toLocaleString()} F
          </div>
          <div className="flex items-center gap-1 mt-2">
            {(displayKpis?.monthlyRevenue || 0) === 0 ? (
              <span className="text-sm text-gray-500">Aucune donnée</span>
            ) : (displayKpis?.revenueGrowth || 0) > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  +{displayKpis?.revenueGrowth?.toFixed(1) || 0}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">
                  {displayKpis?.revenueGrowth?.toFixed(1) || 0}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Opportunity (GOLD+ only) */}
      {featureAccess?.mlPredictions && revenueOpportunity && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Potentiel de revenus</h3>
              <p className="text-gray-700 mb-4">
                Vous pourriez gagner{' '}
                <span className="text-2xl font-bold text-green-600">
                  {revenueOpportunity.potentialMonthlyRevenue.toLocaleString()} F/mois
                </span>{' '}
                en atteignant les performances du top 10%
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Revenus actuels</span>
                  <span className="font-semibold">{revenueOpportunity.currentMonthlyRevenue.toLocaleString()} F</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${revenueOpportunity.potentialMonthlyRevenue > 0 
                        ? Math.min((revenueOpportunity.currentMonthlyRevenue / revenueOpportunity.potentialMonthlyRevenue) * 100, 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenus potentiels</span>
                  <span className="font-semibold">{revenueOpportunity.potentialMonthlyRevenue.toLocaleString()} F</span>
                </div>
              </div>
              {revenueOpportunity.actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Actions recommandées:</h4>
                  <ul className="space-y-2">
                    {revenueOpportunity.actionItems.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Features (for non-premium users) - with blur effect */}
      {!featureAccess?.mlPredictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demand Forecasting - Locked */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-lg mb-3">
                <Lock className="h-8 w-8 text-yellow-600" />
              </div>
              <span className="font-bold text-gray-800 mb-1">Prédictions de demande</span>
              <span className="text-xs text-yellow-600 font-semibold mb-3">Réservé au tier GOLD</span>
              <button
                onClick={() => onNavigate?.('premium')}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-amber-600 transition-colors text-sm"
              >
                Débloquer avec GOLD →
              </button>
            </div>
            <div className="p-6 opacity-50">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
                <div>
                  <h3 className="font-bold text-gray-900">Prévision de la demande</h3>
                  <span className="text-xs text-gray-500">Powered by ML</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded mt-4"></div>
              </div>
            </div>
          </div>

          {/* Price Optimization - Locked */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-lg mb-3">
                <Lock className="h-8 w-8 text-yellow-600" />
              </div>
              <span className="font-bold text-gray-800 mb-1">Optimisation des prix</span>
              <span className="text-xs text-yellow-600 font-semibold mb-3">Réservé au tier GOLD</span>
              <button
                onClick={() => onNavigate?.('premium')}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-amber-600 transition-colors text-sm"
              >
                Débloquer avec GOLD →
              </button>
            </div>
            <div className="p-6 opacity-50">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-gray-400" />
                <div>
                  <h3 className="font-bold text-gray-900">Optimisation dynamique</h3>
                  <span className="text-xs text-gray-500">Powered by AI</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Retention */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Rétention Clients</h3>
        </div>
        {isEmptyData && !showDemoData ? (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Données de rétention disponibles après plusieurs livraisons</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {displayKpis?.customerRetention?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600">Taux de rétention</div>
              <div className="mt-1 text-xs text-gray-500">
                Moyenne marché: 65%
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">--</div>
              <div className="text-sm text-gray-600">Clients fidèles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">--</div>
              <div className="text-sm text-gray-600">Clients à risque</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate?.('orders')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Package className="h-6 w-6 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-900">Voir les commandes</div>
              <div className="text-sm text-gray-600">Commandes disponibles</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate?.('history')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Historique</div>
              <div className="text-sm text-gray-600">Livraisons passées</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate?.('premium')}
            className="flex items-center gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <Crown className="h-6 w-6 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-900">Gérer abonnement</div>
              <div className="text-sm text-gray-600">Voir les offres Premium</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
