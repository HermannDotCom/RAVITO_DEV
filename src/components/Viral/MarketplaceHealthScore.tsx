import React, { useEffect, useState } from 'react';
import { Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { viralMetricsService } from '../../services/viralMetricsService';
import type { MarketplaceHealthMetrics } from '../../types';

export const MarketplaceHealthScore: React.FC = () => {
  const [health, setHealth] = useState<MarketplaceHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const metrics = await viralMetricsService.getMarketplaceHealth();
      setHealth(metrics);
    } catch (error) {
      console.error('Error loading marketplace health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="text-green-600" size={32} />;
    if (score >= 70) return <Heart className="text-yellow-600" size={32} />;
    return <AlertCircle className="text-red-600" size={32} />;
  };

  const healthScore = Math.round(health.healthScore);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Santé de la Marketplace</h3>

      <div className={`${getHealthBgColor(healthScore)} rounded-lg p-6 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Score Global</p>
            <p className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}%
            </p>
          </div>
          <div>{getHealthIcon(healthScore)}</div>
        </div>

        {health.bonusTriggered && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <p className="text-sm font-semibold text-green-700">
              🎉 Bonus communautaire activé: +{health.bonusPercentage}% pour tous!
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Temps de réponse moyen</span>
          <span className="font-semibold">{health.avgResponseTime} min</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Fiabilité de livraison</span>
          <span className="font-semibold text-green-600">
            {Math.round(health.deliveryReliability)}%
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Satisfaction client</span>
          <span className="font-semibold text-purple-600">
            {health.customerSatisfaction.toFixed(1)}/5 ⭐
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Fournisseurs actifs</span>
          <span className="font-semibold">{health.activeSuppliers}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Commandes 24h</span>
          <span className="font-semibold">{health.totalOrders24h}</span>
        </div>
      </div>

      {healthScore >= 85 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-green-600 font-medium">
            ✅ Marketplace en excellente santé - Tous les utilisateurs bénéficient d'un bonus!
          </p>
        </div>
      )}

      {healthScore < 80 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-orange-600 font-medium">
            ⚠️ Nous travaillons pour améliorer votre expérience
          </p>
        </div>
      )}
    </div>
  );
};
