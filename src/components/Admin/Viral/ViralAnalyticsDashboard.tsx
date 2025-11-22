import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { viralMetricsService } from '../../../services/viralMetricsService';

export const ViralAnalyticsDashboard: React.FC = () => {
  const [growthSummary, setGrowthSummary] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    viralCoefficient: 0,
    averageReferralsPerUser: 0,
    topReferralChannel: 'whatsapp'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const summary = await viralMetricsService.getGrowthSummary();
      setGrowthSummary(summary);
    } catch (error) {
      console.error('Error loading viral analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getViralCoefficientColor = (k: number) => {
    if (k >= 1.3) return 'text-green-600';
    if (k >= 1.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getViralCoefficientStatus = (k: number) => {
    if (k >= 1.3) return { icon: ArrowUpRight, text: 'Croissance Exponentielle! 🚀', color: 'bg-green-100 text-green-800' };
    if (k >= 1.0) return { icon: TrendingUp, text: 'Croissance Positive', color: 'bg-yellow-100 text-yellow-800' };
    return { icon: ArrowDownRight, text: 'Amélioration Nécessaire', color: 'bg-red-100 text-red-800' };
  };

  const status = getViralCoefficientStatus(growthSummary.viralCoefficient);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Tableau de Bord Viral</h2>
        <p className="text-purple-100">
          Suivi en temps réel de la croissance virale et des métriques d'acquisition
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-500" size={32} />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {growthSummary.totalUsers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">Utilisateurs</p>
        </div>

        {/* New Users This Month */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-500" size={32} />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Ce Mois</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            +{growthSummary.newUsersThisMonth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">Nouveaux Utilisateurs</p>
        </div>

        {/* Viral Coefficient */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-purple-500" size={32} />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Coefficient K</span>
          </div>
          <p className={`text-3xl font-bold ${getViralCoefficientColor(growthSummary.viralCoefficient)}`}>
            {growthSummary.viralCoefficient.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Objectif: &gt; 1.3
          </p>
        </div>

        {/* Avg Referrals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="text-orange-500" size={32} />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Engagement</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {growthSummary.averageReferralsPerUser.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Parrainages/Utilisateur</p>
        </div>
      </div>

      {/* Viral Status Card */}
      <div className={`${status.color} rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon size={32} />
            <div>
              <p className="font-bold text-lg">{status.text}</p>
              <p className="text-sm opacity-90 mt-1">
                {growthSummary.viralCoefficient >= 1.3
                  ? 'Chaque utilisateur amène en moyenne plus d\'un nouvel utilisateur - croissance exponentielle!'
                  : growthSummary.viralCoefficient >= 1.0
                  ? 'Croissance organique positive. Continuez à optimiser pour atteindre K > 1.3'
                  : 'Augmentez les incentives de parrainage et facilitez le partage pour améliorer K'}
              </p>
            </div>
          </div>
          <div className="text-4xl font-bold opacity-50">
            {growthSummary.viralCoefficient >= 1.3 ? '🚀' : growthSummary.viralCoefficient >= 1.0 ? '📈' : '⚠️'}
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-green-600" size={24} />
          Performance des Canaux
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="font-semibold">WhatsApp</p>
                <p className="text-xs text-gray-500">Canal principal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">
                {growthSummary.topReferralChannel === 'whatsapp' ? '🥇 #1' : ''}
              </p>
              <p className="text-xs text-gray-500">Meilleur taux</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="font-semibold">SMS</p>
                <p className="text-xs text-gray-500">Canal secondaire</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">
                {growthSummary.topReferralChannel === 'sms' ? '🥇 #1' : '🥈 #2'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <p className="font-semibold">Instagram</p>
                <p className="text-xs text-gray-500">Social media</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-pink-600">
                {growthSummary.topReferralChannel === 'instagram' ? '🥇 #1' : '🥉 #3'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CAC Projection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">📉 Projection CAC (Coût d'Acquisition Client)</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Mois 1</p>
            <p className="text-2xl font-bold text-red-600">50K</p>
            <p className="text-xs text-gray-500">FCFA/client</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Mois 6</p>
            <p className="text-2xl font-bold text-yellow-600">8K</p>
            <p className="text-xs text-gray-500">FCFA/client</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Mois 12</p>
            <p className="text-2xl font-bold text-green-600">2K</p>
            <p className="text-xs text-gray-500">FCFA/client</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Réduction de 96% du CAC grâce aux effets viraux! 🎯
        </p>
      </div>
    </div>
  );
};
