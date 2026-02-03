import React, { useState } from 'react';
import { useNavigate } from '../hooks/useSimpleRouter';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../context/ToastContext';
import { Paywall } from '../components/Subscription/Paywall';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, calculateProrata } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';

export const RavitoGestionSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    subscription,
    plans,
    loading,
    error: subscriptionError,
    createSubscription
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Si un plan est sélectionné, on calcule le prorata
  const prorataInfo = selectedPlan
    ? calculateProrata(selectedPlan, new Date())
    : null;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlanId) return;

    try {
      setIsCreating(true);

      const success = await createSubscription(selectedPlanId);

      if (success) {
        showToast('Abonnement créé avec succès ! Votre période d\'essai gratuit a commencé.', 'success');
        // Rediriger vers la page d'activité
        navigate('/activity');
      } else {
        showToast('Erreur lors de la création de l\'abonnement', 'error');
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      showToast('Erreur lors de la création de l\'abonnement', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (selectedPlanId) {
      setSelectedPlanId(null);
    } else {
      navigate('/');
    }
  };

  // Si l'utilisateur a déjà un abonnement actif, on le redirige
  if (subscription && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Abonnement actif
          </h2>
          <p className="text-gray-600 mb-6">
            Vous avez déjà un abonnement {subscription.status === 'trial' ? 'd\'essai gratuit' : 'actif'}.
          </p>
          <button
            onClick={() => navigate('/activity')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold"
          >
            Accéder à Gestion Activité
          </button>
        </div>
      </div>
    );
  }

  // Étape 1: Sélection du plan (Paywall)
  if (!selectedPlanId) {
    return (
      <div>
        <div className="p-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
        </div>
        <Paywall
          plans={plans}
          onSelectPlan={handleSelectPlan}
          loading={loading}
        />
      </div>
    );
  }

  // Étape 2: Confirmation du plan et affichage du prorata
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux offres</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Confirmation de votre abonnement
          </h2>

          {/* Plan sélectionné */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan {selectedPlan?.name}
            </h3>
            <div className="text-3xl font-bold text-orange-600">
              {selectedPlan && formatCurrency(selectedPlan.price)}
              <span className="text-base font-normal text-gray-600 ml-2">
                / {selectedPlan?.billingCycle === 'monthly' ? 'mois' : selectedPlan?.billingCycle === 'semesterly' ? 'semestre' : 'an'}
              </span>
            </div>
          </div>

          {/* Période d'essai */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-6 h-6 text-green-600" />
              <h4 className="font-semibold text-gray-900">
                1 mois d'essai gratuit
              </h4>
            </div>
            <p className="text-gray-700">
              Profitez de 30 jours d'essai gratuit pour tester toutes les fonctionnalités de Ravito Gestion.
            </p>
          </div>

          {/* Facturation après l'essai */}
          {prorataInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Après la période d'essai
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant au prorata</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(prorataInfo.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jours jusqu'à la fin de période</span>
                  <span className="font-semibold text-gray-900">
                    {prorataInfo.daysRemaining} jours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de fin de période</span>
                  <span className="font-semibold text-gray-900">
                    {prorataInfo.periodEnd.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <p className="text-sm text-gray-600">
                    Ensuite, vous serez facturé {formatCurrency(selectedPlan.price)} tous les {
                      selectedPlan.billingCycle === 'monthly' ? 'mois' :
                      selectedPlan.billingCycle === 'semesterly' ? 'semestres' : 'ans'
                    }.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modes de paiement */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Modes de paiement acceptés
            </h4>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                Espèces
              </span>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                Wave
              </span>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                Orange Money
              </span>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                MTN Money
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Le paiement sera validé manuellement par notre équipe après réception.
            </p>
          </div>

          {/* Erreur */}
          {subscriptionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{subscriptionError}</p>
            </div>
          )}

          {/* Bouton de confirmation */}
          <button
            onClick={handleConfirmSubscription}
            disabled={isCreating}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Création en cours...
              </>
            ) : (
              'Démarrer mon essai gratuit'
            )}
          </button>

          {/* Conditions */}
          <p className="text-xs text-center text-gray-600 mt-4">
            En cliquant sur "Démarrer mon essai gratuit", vous acceptez nos{' '}
            <a href="/cgu" className="text-orange-600 hover:underline">
              Conditions Générales d'Utilisation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
