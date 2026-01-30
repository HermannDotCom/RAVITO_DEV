import React, { useState } from 'react';
import { Target, TrendingUp, DollarSign, Lightbulb, Users } from 'lucide-react';
import { useCommercialActivity } from '../../hooks/useCommercialActivity';
import { ObjectivesTab } from './tabs/ObjectivesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { CommissionsTab } from './tabs/CommissionsTab';
import { RecommendationsTab } from './tabs/RecommendationsTab';
import { RegisteredClientsTab } from './tabs/RegisteredClientsTab';

type TabId = 'objectives' | 'statistics' | 'commissions' | 'recommendations' | 'registered';

export const CommercialActivityPage: React.FC = () => {
  const {
    salesRep,
    isAuthorized,
    stats,
    registeredClients,
    commissionEstimation,
    paymentHistory,
    recommendations,
    settings,
    selectedPeriod,
    setSelectedPeriod,
    currentPeriod,
    isLoading,
    error
  } = useCommercialActivity();

  const [activeTab, setActiveTab] = useState<TabId>('objectives');

  // Access denied
  if (!isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">
            Cette page est réservée aux commerciaux actifs.
          </p>
          <p className="text-sm text-gray-500">
            Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !salesRep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre activité...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'objectives' as TabId, label: 'Objectifs', icon: Target, emoji: '🎯' },
    { id: 'statistics' as TabId, label: 'Statistiques', icon: TrendingUp, emoji: '📈' },
    { id: 'commissions' as TabId, label: 'Primes', icon: DollarSign, emoji: '💰' },
    { id: 'recommendations' as TabId, label: 'Conseils', icon: Lightbulb, emoji: '🤖' },
    { id: 'registered' as TabId, label: 'Inscrits', icon: Users, emoji: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                MON ACTIVITÉ COMMERCIALE
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Commercial: <span className="font-semibold">{salesRep?.name}</span>
                {salesRep?.zone?.name && (
                  <>
                    {' | '}
                    Zone: <span className="font-semibold">{salesRep.zone.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto pb-px -mb-px scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'objectives' && (
          <ObjectivesTab
            stats={stats}
            settings={settings}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsTab
            stats={stats}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            currentPeriod={currentPeriod}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'commissions' && (
          <CommissionsTab
            commissionEstimation={commissionEstimation}
            paymentHistory={paymentHistory}
            selectedPeriod={selectedPeriod}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'registered' && (
          <RegisteredClientsTab
            clients={registeredClients}
            settings={settings}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
