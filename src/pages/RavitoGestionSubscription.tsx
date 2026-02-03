import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../context/ToastContext';
import { Paywall } from '../components/Subscription/Paywall';
import { ArrowLeft, CheckCircle, Clock, CreditCard, AlertCircle, Info, FileText } from 'lucide-react';
import { formatCurrency } from '../types/subscription';
import { calculateProrata } from '../services/ravitoGestionSubscriptionService';
import type { SubscriptionPlan } from '../types/subscription';

interface RavitoGestionSubscriptionProps {
  onSectionChange?: (section: string) => void;
}

export const RavitoGestionSubscription: React.FC<RavitoGestionSubscriptionProps> = ({ onSectionChange }) => {
  const { showToast } = useToast();
  const {
    subscription,
    plans,
    invoices,
    loading,
    error: subscriptionError,
    createSubscription,
    isInTrial,
    isPendingPayment,
    isSuspended,
    daysLeftInTrial
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const currentPlan = subscription?.plan;

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
        if (onSectionChange) {
          onSectionChange('activity');
        }
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
    } else if (onSectionChange) {
      onSectionChange('dashboard');
    }
  };

  const handleContactSupport = () => {
    if (onSectionChange) {
      onSectionChange('support');
    }
  };

  // Filtrer les factures impayées
  const unpaidInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  // Si l'utilisateur a déjà un abonnement, afficher la gestion d'abonnement
  // (pas de check sur loading car on veut continuer à afficher l'abonnement pendant le rechargement)
  if (subscription && !selectedPlanId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Bouton retour */}
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Abonnement Ravito Gestion</h1>

          {/* Statut de l'abonnement */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statut de l'abonnement</h2>

            {/* Badge de statut */}
            <div className="flex items-center space-x-4 mb-4">
              {isInTrial && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Période d'essai - {daysLeftInTrial} jour{daysLeftInTrial && daysLeftInTrial > 1 ? 's' : ''} restant{daysLeftInTrial && daysLeftInTrial > 1 ? 's' : ''}</span>
                </div>
              )}
              {subscription.status === 'active' && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Abonnement actif</span>
                </div>
              )}
              {isPendingPayment && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">En attente de paiement</span>
                </div>
              )}
              {isSuspended && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Abonnement suspendu</span>
                </div>
              )}
            </div>

            {/* Détails du plan */}
            {currentPlan && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Plan {currentPlan.name}</h3>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(currentPlan.price)}
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      / {currentPlan.billingCycle === 'monthly' ? 'mois' : currentPlan.billingCycle === 'semesterly' ? 'semestre' : 'an'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{currentPlan.description}</p>
              </div>
            )}

            {/* Prochaine date de facturation */}
            {subscription.nextBillingDate && subscription.status === 'active' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Prochaine facturation</p>
                    <p className="text-gray-600 text-sm">
                      {subscription.nextBillingDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Factures en attente de paiement */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <span>Factures en attente</span>
              </h2>

              <div className="space-y-4">
                {unpaidInvoices.map((invoice) => (
                  <div key={invoice.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Facture {invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          Période : {invoice.periodStart.toLocaleDateString('fr-FR')} - {invoice.periodEnd.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date d'échéance : {invoice.dueDate.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Montant à payer</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(invoice.amount)}</p>
                      </div>
                    </div>

                    {invoice.isProrata && (
                      <div className="bg-white border border-orange-200 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Montant au prorata :</strong> Cette facture correspond à {invoice.daysCalculated} jours de service.
                        </p>
                      </div>
                    )}

                    {/* Instructions de paiement */}
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Comment payer ?</span>
                      </h4>

                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Effectuez votre paiement via l'un des moyens suivants :
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-900 mb-1">Espèces</p>
                            <p className="text-xs text-gray-600">Paiement en liquide</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-900 mb-1">Wave</p>
                            <p className="text-xs text-gray-600">Transfert mobile</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-900 mb-1">Orange Money</p>
                            <p className="text-xs text-gray-600">Transfert mobile</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-900 mb-1">MTN Money</p>
                            <p className="text-xs text-gray-600">Transfert mobile</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900">
                            <strong>Important :</strong> Après avoir effectué votre paiement, contactez notre équipe support avec votre référence de transaction pour validation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleContactSupport}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Contacter le support après paiement
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historique des paiements */}
          {paidInvoices.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Historique des paiements</h2>

              <div className="space-y-3">
                {paidInvoices.map((invoice) => (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Facture {invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          Payée le {invoice.paidAt?.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Période : {invoice.periodStart.toLocaleDateString('fr-FR')} - {invoice.periodEnd.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Payée</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message si abonnement suspendu */}
          {isSuspended && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Abonnement suspendu</h3>
                  <p className="text-red-700 mb-4">
                    Votre abonnement a été suspendu. Veuillez régulariser votre situation en payant les factures en attente.
                  </p>
                  <button
                    onClick={handleContactSupport}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Contacter le support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Étape 1: Sélection du plan (Paywall) - pour les nouveaux utilisateurs
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
