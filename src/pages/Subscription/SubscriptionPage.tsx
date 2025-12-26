/**
 * Subscription Page
 * 
 * Main page for managing subscription plans
 * Accessible to all logged-in users (Clients and Suppliers)
 */

import React, { useState, useEffect } from 'react';
import { Crown, Calendar, Clock, CreditCard, RefreshCw, X as XIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PlanComparison } from '../../components/Subscription/PlanComparison';
import { CurrentPlanBadge } from '../../components/Subscription/CurrentPlanBadge';
import { BillingHistory } from '../../components/Subscription/BillingHistory';
import { SubscribeModal } from '../../components/Subscription/SubscribeModal';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../config/subscriptionPlans';
import type { PlanType, Invoice, PaymentMethod, Subscription } from '../../types';
import { KenteLoader } from '../../components/ui/KenteLoader';

// Date calculation constants
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

interface SubscriptionPageProps {
  onNavigate?: (section: string) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation, fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock current subscription - FREE by default
      setCurrentSubscription({
        id: 'sub_mock_1',
        userId: user?.id || '',
        plan: 'FREE',
        billingPeriod: 'monthly',
        status: 'active',
        startedAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-01-01'),
        autoRenew: false
      });

      // Mock invoices - empty for FREE plan
      setInvoices([]);
      
      // Mock treasury balance
      setTreasuryBalance(150);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlanId(null);
  };

  const handleConfirmSubscription = async (
    planId: string,
    billingPeriod: 'monthly' | 'yearly',
    paymentMethod: PaymentMethod
  ) => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription state
      const planKey = planId.toUpperCase() as PlanType;
      setCurrentSubscription({
        id: 'sub_new_' + Date.now(),
        userId: user?.id || '',
        plan: planKey,
        billingPeriod,
        status: 'active',
        startedAt: new Date(),
        expiresAt: billingPeriod === 'monthly' 
          ? new Date(Date.now() + DAYS_IN_MONTH * MS_PER_DAY)
          : new Date(Date.now() + DAYS_IN_YEAR * MS_PER_DAY),
        autoRenew: true
      });

      // Add invoice
      const plan = SUBSCRIPTION_PLANS[planKey];
      if (plan.price.monthly > 0) {
        const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly;
        setInvoices(prev => [{
          id: 'inv_' + Date.now(),
          subscriptionId: 'sub_new_' + Date.now(),
          userId: user?.id || '',
          amount: price,
          status: 'paid',
          createdAt: new Date(),
          paidAt: new Date()
        }, ...prev]);
      }

      alert(`Abonnement ${plan.name} souscrit avec succès !`);
      handleCloseModal();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Erreur lors de la souscription. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription || currentSubscription.plan === 'FREE') return;
    
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentSubscription(prev => prev ? {
        ...prev,
        status: 'cancelled',
        autoRenew: false
      } : null);

      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = currentSubscription?.plan || 'FREE';
  const planConfig = SUBSCRIPTION_PLANS[currentPlan];

  // Calculate days remaining
  const daysRemaining = currentSubscription?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(currentSubscription.expiresAt).getTime() - Date.now()) / MS_PER_DAY))
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <KenteLoader size="md" text="Chargement de votre abonnement..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Abonnement</h1>
            <p className="text-gray-600">Gérez votre abonnement et consultez vos factures</p>
          </div>
        </div>
        <CurrentPlanBadge plan={currentPlan} size="lg" />
      </div>

      {/* Current Plan Section */}
      <div className={`rounded-xl shadow-lg p-6 text-white ${planConfig.headerGradient}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Plan Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold">{planConfig.displayName}</h2>
                {currentSubscription?.status === 'cancelled' && (
                  <span className="bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Annulé
                  </span>
                )}
              </div>
              <p className="text-white/80">{planConfig.description}</p>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="flex flex-col sm:flex-row gap-4">
            {currentPlan !== 'FREE' && currentSubscription && (
              <>
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Début</span>
                  </div>
                  <div className="font-semibold">
                    {new Intl.DateTimeFormat('fr-FR', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    }).format(new Date(currentSubscription.startedAt))}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Expiration</span>
                  </div>
                  <div className="font-semibold">
                    {daysRemaining} jours restants
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                    <RefreshCw className="h-4 w-4" />
                    <span>Renouvellement</span>
                  </div>
                  <div className="font-semibold">
                    {currentSubscription.autoRenew ? 'Automatique' : 'Manuel'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {currentPlan !== 'FREE' && currentSubscription?.status === 'active' && (
          <div className="mt-6 pt-6 border-t border-white/20 flex flex-col sm:flex-row gap-3">
            <a
              href="#plans"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Changer de plan
            </a>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
            >
              <XIcon className="h-4 w-4" />
              Annuler l'abonnement
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer l'annulation</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès jusqu'à la fin de la période en cours.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Treasury Balance Info */}
      {treasuryBalance > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Solde Trésorerie</div>
              <div className="text-sm text-gray-600">Utilisable pour vos abonnements</div>
            </div>
          </div>
          <div className="text-xl font-bold text-blue-600">{formatPrice(treasuryBalance)}</div>
        </div>
      )}

      {/* Plans Comparison Section */}
      <div id="plans">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Nos Offres d'Abonnement</h3>
          <p className="text-gray-600 mt-2">Choisissez le plan qui correspond à vos besoins</p>
        </div>
        <PlanComparison
          currentPlan={currentPlan}
          onSelectPlan={handleSelectPlan}
          disabled={isProcessing}
        />
      </div>

      {/* Billing History */}
      <BillingHistory invoices={invoices} loading={loading} />

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Questions Fréquentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Puis-je annuler à tout moment ?</h4>
            <p className="text-gray-600 text-sm">
              Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès 
              jusqu'à la fin de votre période de facturation en cours.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quels modes de paiement acceptez-vous ?</h4>
            <p className="text-gray-600 text-sm">
              Nous acceptons Orange Money, MTN Mobile Money, Moov Money, Wave et les cartes bancaires.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Puis-je changer de plan ?</h4>
            <p className="text-gray-600 text-sm">
              Oui, vous pouvez changer de plan à tout moment. Les mises à niveau prennent effet 
              immédiatement, les rétrogradations à la fin de votre période actuelle.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Mes données sont-elles sécurisées ?</h4>
            <p className="text-gray-600 text-sm">
              Absolument. Toutes vos données sont cryptées et stockées de manière sécurisée. 
              Nous ne partageons jamais vos informations.
            </p>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {selectedPlanId && (
        <SubscribeModal
          planId={selectedPlanId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmSubscription}
          treasuryBalance={treasuryBalance}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
