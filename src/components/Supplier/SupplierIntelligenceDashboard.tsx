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
  Lock
} from 'lucide-react';
import { SupplierAnalyticsService } from '../../services/supplierAnalyticsService';
import { SubscriptionService } from '../../services/subscriptionService';
import type { SubscriptionTier } from '../../types/intelligence';

interface SupplierIntelligenceDashboardProps {
  supplierId: string;
  onNavigate?: (section: string) => void;
}

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const tierColor = {
    FREE: 'gray',
    SILVER: 'slate',
    GOLD: 'yellow',
    PLATINUM: 'purple'
  }[tier?.tierName || 'FREE'];

  const tierIcon = {
    FREE: Target,
    SILVER: Award,
    GOLD: Crown,
    PLATINUM: Zap
  }[tier?.tierName || 'FREE'];

  const TierIcon = tierIcon;

  return (
    <div className="space-y-6">
      {/* Header with Subscription Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-1">Advanced analytics and market insights</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 bg-${tierColor}-100 border border-${tierColor}-300 rounded-lg`}>
          <TierIcon className={`h-5 w-5 text-${tierColor}-600`} />
          <span className={`font-semibold text-${tierColor}-900`}>
            {tier?.tierName || 'FREE'} Tier
          </span>
        </div>
      </div>

      {/* Upgrade Banner for FREE/SILVER users */}
      {tier?.tierName !== 'PLATINUM' && tier?.tierName !== 'GOLD' && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6" />
                <h3 className="text-xl font-bold">Unlock Premium Intelligence</h3>
              </div>
              <p className="text-orange-100 mb-4">
                Get real-time ML predictions, price optimization, and competitor benchmarking with GOLD tier
              </p>
              <button
                onClick={() => onNavigate?.('subscription')}
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Upgrade Now - 15,000 FCFA/month
              </button>
            </div>
            <Crown className="h-16 w-16 text-orange-200 opacity-50" />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Acceptance Rate */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Acceptance Rate</span>
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis?.acceptanceRate || 0}%</div>
          <div className="flex items-center gap-1 mt-2">
            {kpis?.acceptanceRate >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm ${kpis?.acceptanceRate >= 90 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis?.acceptanceRate >= 90 ? 'Excellent' : 'Needs improvement'}
            </span>
          </div>
        </div>

        {/* Delivery Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Avg Delivery Time</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis?.avgDeliveryTime || 0} min</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-sm text-gray-600">Target: 45 min</span>
          </div>
        </div>

        {/* Customer Rating */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Customer Rating</span>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis?.customerRating?.toFixed(1) || '0.0'}</div>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (kpis?.customerRating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Monthly Revenue</span>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(kpis?.monthlyRevenue || 0).toLocaleString()} F
          </div>
          <div className="flex items-center gap-1 mt-2">
            {kpis?.revenueGrowth > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm ${kpis?.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis?.revenueGrowth > 0 ? '+' : ''}{kpis?.revenueGrowth?.toFixed(1) || 0}%
            </span>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Revenue Potential</h3>
              <p className="text-gray-700 mb-4">
                You could earn{' '}
                <span className="text-2xl font-bold text-green-600">
                  {revenueOpportunity.potentialMonthlyRevenue.toLocaleString()} FCFA/month
                </span>{' '}
                if you matched top 10% performers
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Current Revenue</span>
                  <span className="font-semibold">{revenueOpportunity.currentMonthlyRevenue.toLocaleString()} F</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(revenueOpportunity.currentMonthlyRevenue / revenueOpportunity.potentialMonthlyRevenue) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Potential Revenue</span>
                  <span className="font-semibold">{revenueOpportunity.potentialMonthlyRevenue.toLocaleString()} F</span>
                </div>
              </div>
              {revenueOpportunity.actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Action Items:</h4>
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

      {/* Locked Features (for non-premium users) */}
      {!featureAccess?.mlPredictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demand Forecasting - Locked */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative">
            <div className="absolute top-4 right-4">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-bold text-gray-900">Demand Forecasting</h3>
                <span className="text-xs text-orange-600 font-semibold">GOLD TIER</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              ML-powered predictions of demand by zone, hour, and day for optimal supply planning
            </p>
            <button
              onClick={() => onNavigate?.('subscription')}
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              Upgrade to unlock →
            </button>
          </div>

          {/* Price Optimization - Locked */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative">
            <div className="absolute top-4 right-4">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-bold text-gray-900">Price Optimization</h3>
                <span className="text-xs text-orange-600 font-semibold">GOLD TIER</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              AI-driven dynamic pricing recommendations based on demand vs supply ratios
            </p>
            <button
              onClick={() => onNavigate?.('subscription')}
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              Upgrade to unlock →
            </button>
          </div>
        </div>
      )}

      {/* Customer Retention */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Customer Retention</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{kpis?.customerRetention?.toFixed(1) || 0}%</div>
            <div className="text-sm text-gray-600">Retention Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Repeat Customers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">At-Risk Customers</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate?.('analytics')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <BarChart3 className="h-6 w-6 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-900">View Full Analytics</div>
              <div className="text-sm text-gray-600">Detailed performance metrics</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate?.('benchmarking')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            disabled={!featureAccess?.competitorBenchmarking}
          >
            <Award className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Competitor Benchmarking</div>
              <div className="text-sm text-gray-600">Compare with competitors</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate?.('subscription')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Crown className="h-6 w-6 text-purple-600" />
            <div>
              <div className="font-semibold text-gray-900">Manage Subscription</div>
              <div className="text-sm text-gray-600">Upgrade or change plan</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
