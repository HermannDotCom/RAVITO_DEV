import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, MapPin, BarChart3, Headphones, CheckCircle, XCircle, ArrowRight, Sparkles, Star, Smartphone, CreditCard, Zap, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllTiers, 
  getActiveSubscription, 
  createOrUpgradeSubscription,
  PremiumTier,
  ActiveSubscription 
} from '../../services/premiumTierService';

// Default tiers to display when database is empty
const DEFAULT_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'basic',
    displayName: 'FREE',
    priceMonthly: 0,
    features: {
      description: 'Parfait pour démarrer',
      features: [
        'Dashboard basique',
        'Historique 7 jours',
        'Métriques de base',
        'Support communauté'
      ]
    },
    maxZones: 3,
    hasPriorityPlacement: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasUnlimitedZones: false,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'silver',
    name: 'silver',
    displayName: 'SILVER',
    priceMonthly: 5000,
    features: {
      description: 'Pour les fournisseurs actifs',
      features: [
        'Analytics avancées',
        'Rapports hebdomadaires',
        'Historique 30 jours',
        'Support email prioritaire',
        '5 zones de livraison'
      ]
    },
    maxZones: 5,
    hasPriorityPlacement: false,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: false,
    hasUnlimitedZones: false,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'gold',
    name: 'gold',
    displayName: 'GOLD',
    priceMonthly: 15000,
    features: {
      description: 'Notre offre la plus populaire',
      features: [
        'Prédictions ML de demande',
        'Optimisation des prix',
        'Alertes risque de churn',
        'Historique 90 jours',
        'Support prioritaire 24h',
        'Zones illimitées'
      ]
    },
    maxZones: null,
    hasPriorityPlacement: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasUnlimitedZones: true,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'platinum',
    name: 'platinum',
    displayName: 'PLATINUM',
    priceMonthly: 50000,
    features: {
      description: 'Pour les entreprises',
      features: [
        'API personnalisée',
        'White-label disponible',
        'Support 24/7 dédié',
        'Account manager personnel',
        'Rapports personnalisés',
        'Formation équipe incluse'
      ]
    },
    maxZones: null,
    hasPriorityPlacement: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasUnlimitedZones: true,
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Tier colors configuration
const TIER_COLORS: Record<string, { bg: string; border: string; header: string; badge: string; text: string }> = {
  basic: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    header: 'bg-gradient-to-r from-gray-500 to-gray-600',
    badge: 'bg-gray-100 text-gray-700',
    text: 'text-gray-600'
  },
  silver: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    header: 'bg-gradient-to-r from-blue-400 to-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    text: 'text-blue-600'
  },
  gold: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    header: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    badge: 'bg-yellow-100 text-yellow-800',
    text: 'text-yellow-600'
  },
  platinum: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    header: 'bg-gradient-to-r from-purple-500 to-violet-600',
    badge: 'bg-purple-100 text-purple-700',
    text: 'text-purple-600'
  }
};

export const PremiumTierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<PremiumTier[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

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
      // Use default tiers if database returns empty
      setTiers(tiersData.length > 0 ? tiersData : DEFAULT_TIERS);
      setActiveSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading premium tier data:', error);
      // Use default tiers on error
      setTiers(DEFAULT_TIERS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierName: string) => {
    if (!user || upgrading) return;
    
    // Validate tier name before API call
    const validTiers = ['basic', 'silver', 'gold'] as const;
    if (!validTiers.includes(tierName as typeof validTiers[number])) {
      alert('Ce tier n\'est pas encore disponible pour la souscription automatique. Veuillez contacter le support.');
      return;
    }
    
    setUpgrading(true);
    try {
      const result = await createOrUpgradeSubscription(user.id, tierName as 'basic' | 'silver' | 'gold');
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
  const tierColors = TIER_COLORS[currentTierName] || TIER_COLORS.basic;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Current Subscription Status */}
      <div className={`rounded-xl shadow-lg p-8 text-white ${tierColors.header}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center bg-white/20`}>
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">
                  {activeSubscription?.tierDisplayName || 'FREE'}
                </h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  Tier actuel
                </span>
              </div>
              <p className="text-white/80 mt-1">Votre abonnement actuel</p>
            </div>
          </div>
          {currentTierName !== 'platinum' && (
            <a
              href="#plans"
              className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Voir tous les plans
            </a>
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

      {/* All Plans Comparison */}
      <div id="plans">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Nos Offres d'Abonnement</h3>
          <p className="text-gray-600 mt-2">Choisissez le plan qui correspond à vos besoins</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const isCurrent = tier.name === currentTierName;
            const isUpgrade = tier.displayOrder > (currentTier?.displayOrder || 0);
            const colors = TIER_COLORS[tier.name] || TIER_COLORS.basic;
            const isPopular = tier.name === 'gold';
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${colors.bg} border-2 ${colors.border} ${isCurrent ? 'ring-4 ring-orange-400' : ''}`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-0 -right-0 z-10">
                    <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      POPULAIRE
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 ${colors.header}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-bold text-white">{tier.displayName}</h4>
                    {isCurrent && (
                      <span className="bg-white/90 text-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                        ✓ Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {tier.priceMonthly === 0 ? (
                      'Gratuit'
                    ) : (
                      <>
                        {tier.priceMonthly.toLocaleString()} F
                        <span className="text-sm font-normal opacity-80">/mois</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Features */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">{tier.features.description}</p>
                  <ul className="space-y-2 mb-6">
                    {tier.features.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${colors.text}`} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action button */}
                  {isCurrent ? (
                    <div className="text-center py-2 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
                      Plan actuel
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(tier.name)}
                      disabled={upgrading}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${colors.header} text-white hover:opacity-90 ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {upgrading ? 'Traitement...' : 'Souscrire'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="text-center py-2 bg-gray-100 rounded-lg text-gray-500 font-medium text-sm">
                      Tier inférieur
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-6 w-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-900">Comment Payer</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Après avoir souscrit à un plan, effectuez le paiement via l'une des méthodes ci-dessous. 
          Votre abonnement sera activé après vérification du paiement (généralement sous 24h).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Orange Money */}
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Orange Money</h4>
                <span className="text-xs text-orange-600">Côte d'Ivoire</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>1.</strong> Composez #144#</p>
              <p className="text-gray-700"><strong>2.</strong> Sélectionnez "Transfert"</p>
              <p className="text-gray-700"><strong>3.</strong> Entrez le numéro: <span className="font-mono font-bold text-orange-600">07 XX XX XX XX</span></p>
              <p className="text-gray-700"><strong>4.</strong> Entrez le montant du plan</p>
              <p className="text-gray-700"><strong>5.</strong> Validez avec votre code secret</p>
            </div>
          </div>

          {/* MTN Mobile Money */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">MTN Mobile Money</h4>
                <span className="text-xs text-yellow-600">Côte d'Ivoire</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>1.</strong> Composez *133#</p>
              <p className="text-gray-700"><strong>2.</strong> Sélectionnez "Transfert d'argent"</p>
              <p className="text-gray-700"><strong>3.</strong> Entrez le numéro: <span className="font-mono font-bold text-yellow-600">05 XX XX XX XX</span></p>
              <p className="text-gray-700"><strong>4.</strong> Entrez le montant du plan</p>
              <p className="text-gray-700"><strong>5.</strong> Confirmez avec votre PIN</p>
            </div>
          </div>

          {/* Wave */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Wave</h4>
                <span className="text-xs text-blue-600">Côte d'Ivoire / Sénégal</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>1.</strong> Ouvrez l'application Wave</p>
              <p className="text-gray-700"><strong>2.</strong> Sélectionnez "Envoyer de l'argent"</p>
              <p className="text-gray-700"><strong>3.</strong> Entrez le numéro: <span className="font-mono font-bold text-blue-600">07 XX XX XX XX</span></p>
              <p className="text-gray-700"><strong>4.</strong> Entrez le montant du plan</p>
              <p className="text-gray-700"><strong>5.</strong> Confirmez le transfert</p>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> Après le paiement, envoyez une capture d'écran de la confirmation 
                au support ou à votre account manager. Incluez votre nom et le plan souscrit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Upgrade Section */}
      {currentTierName !== 'platinum' && currentTierName !== 'gold' && (
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
