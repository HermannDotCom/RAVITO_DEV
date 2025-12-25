import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, MapPin, BarChart3, Headphones, CheckCircle, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllTiers, 
  getActiveSubscription, 
  createOrUpgradeSubscription,
  PremiumTier,
  ActiveSubscription 
} from '../../services/premiumTierService';

export const PremiumTierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<PremiumTier[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [tiersData, subscriptionData] = await Promise.all([
        getAllTiers(),
        getActiveSubscription(user.id)
      ]);
      setTiers(tiersData);
      setActiveSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading premium tier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierName: string) => {
    if (!user || upgrading) return;
    
    setUpgrading(true);
    try {
      const result = await createOrUpgradeSubscription(user.id, tierName as any);
      if (result.success) {
        alert(`Demande d'abonnement ${tierName.toUpperCase()} créée avec succès! Un administrateur activera votre abonnement après réception du paiement.`);
        await loadData();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error upgrading tier:', error);
      alert('Erreur lors de la mise à niveau');
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const currentTierName = activeSubscription?.tierName || 'basic';
  const currentTier = tiers.find(t => t.name === currentTierName);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Current Subscription Status */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              currentTierName === 'gold' ? 'bg-yellow-400' :
              currentTierName === 'silver' ? 'bg-gray-300' :
              'bg-white/20'
            }`}>
              <Crown className={`h-8 w-8 ${
                currentTierName === 'gold' ? 'text-yellow-800' :
                currentTierName === 'silver' ? 'text-gray-700' :
                'text-white'
              }`} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                {activeSubscription?.tierDisplayName || 'Basic (Gratuit)'}
              </h2>
              <p className="text-orange-100 mt-1">Votre abonnement actuel</p>
            </div>
          </div>
          {currentTierName !== 'gold' && (
            <button
              onClick={() => setSelectedTier('upgrade')}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Améliorer mon offre
            </button>
          )}
        </div>
      </div>

      {/* Current Benefits */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Vos avantages actuels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${activeSubscription?.hasPriorityPlacement ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {activeSubscription?.hasPriorityPlacement ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <TrendingUp className="h-5 w-5 text-gray-700" />
            </div>
            <h4 className="font-semibold text-gray-900">Placement prioritaire</h4>
            <p className="text-sm text-gray-600 mt-1">
              {activeSubscription?.hasPriorityPlacement 
                ? 'Vos offres apparaissent en premier' 
                : 'Non inclus dans votre tier'}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${activeSubscription?.hasUnlimitedZones ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {activeSubscription?.hasUnlimitedZones ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <MapPin className="h-5 w-5 text-gray-700" />
            </div>
            <h4 className="font-semibold text-gray-900">Zones de livraison</h4>
            <p className="text-sm text-gray-600 mt-1">
              {activeSubscription?.hasUnlimitedZones 
                ? 'Zones illimitées' 
                : `Jusqu'à ${activeSubscription?.maxZones || 3} zones`}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${activeSubscription?.hasAdvancedAnalytics ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {activeSubscription?.hasAdvancedAnalytics ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <BarChart3 className="h-5 w-5 text-gray-700" />
            </div>
            <h4 className="font-semibold text-gray-900">Analytiques avancées</h4>
            <p className="text-sm text-gray-600 mt-1">
              {activeSubscription?.hasAdvancedAnalytics 
                ? 'Insights détaillés des clients' 
                : 'Statistiques de base uniquement'}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${activeSubscription?.hasPrioritySupport ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {activeSubscription?.hasPrioritySupport ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <Headphones className="h-5 w-5 text-gray-700" />
            </div>
            <h4 className="font-semibold text-gray-900">Support</h4>
            <p className="text-sm text-gray-600 mt-1">
              {activeSubscription?.hasPrioritySupport 
                ? 'Support dédié prioritaire' 
                : 'Support standard'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Tiers */}
      {currentTierName !== 'gold' && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Améliorer votre abonnement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const isCurrent = tier.name === currentTierName;
              const isUpgrade = tier.displayOrder > (currentTier?.displayOrder || 0);
              
              return (
                <div
                  key={tier.id}
                  className={`rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                    isCurrent 
                      ? 'ring-2 ring-orange-500 bg-orange-50' 
                      : tier.name === 'gold'
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400'
                      : tier.name === 'silver'
                      ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  <div className={`p-6 ${
                    tier.name === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                    tier.name === 'silver' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-2xl font-bold text-white">{tier.displayName}</h4>
                      {isCurrent && (
                        <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                          Actuel
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {tier.priceMonthly === 0 ? 'Gratuit' : `${tier.priceMonthly.toLocaleString()} FCFA`}
                      {tier.priceMonthly > 0 && <span className="text-lg font-normal">/mois</span>}
                    </p>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{tier.features.description}</p>
                    <ul className="space-y-2 mb-6">
                      {tier.features.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!isCurrent && isUpgrade && (
                      <button
                        onClick={() => handleUpgrade(tier.name)}
                        disabled={upgrading}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                          tier.name === 'gold'
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600'
                            : tier.name === 'silver'
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {upgrading ? 'Traitement...' : 'Passer à ce tier'}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    )}

                    {isCurrent && (
                      <div className="text-center py-3 bg-orange-100 rounded-lg text-orange-800 font-semibold">
                        Votre plan actuel
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gold Tier Benefits Highlight */}
      {currentTierName !== 'gold' && (
        <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-orange-50 rounded-xl shadow-lg p-8 border-2 border-yellow-400">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="h-6 w-6 text-yellow-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pourquoi passer à Gold ?</h3>
              <p className="text-gray-700 mb-4">
                Nos études de marché montrent que les fournisseurs Gold génèrent <strong>40% de conversions en plus</strong> 
                grâce au placement prioritaire. Dans les marchés logistiques africains, les utilisateurs B2B paient 
                3-5x pour les fonctionnalités de commodité.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📈 Boost de conversion ~40%</h4>
                  <p className="text-sm text-gray-600">Vos offres apparaissent EN PREMIER dans la liste des clients</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">💰 Revenu prévisible</h4>
                  <p className="text-sm text-gray-600">Investissement rentabilisé dès 2-3 commandes supplémentaires/mois</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
