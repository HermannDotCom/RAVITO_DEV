import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../context/ToastContext';
import { Paywall } from '../components/Subscription/Paywall';
import { PaymentModal } from '../components/Subscription/PaymentModal';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const currentPlan = subscription?.plan;

  // Si un plan est sélectionné, on calcule le prorata
  const prorataInfo = selectedPlan
    ? calculateProrata(selectedPlan, new Date())
    : null;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setShowConfirmModal(true);
  };

  const handleConfirmSubscription = async (payNow: boolean = false) => {
    if (!selectedPlanId) return;

    try {
      setIsCreating(true);

      const success = await createSubscription(selectedPlanId);

      if (success) {
        showToast('Abonnement créé avec succès ! Votre période d\'essai gratuit a commencé.', 'success');
        setShowConfirmModal(false);
        
        if (payNow) {
          setShowPaymentModal(true);
        } else {
          // Rediriger vers la page d'activité
          if (onSectionChange) {
            onSectionChange('activity');
          }
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
    if (showPaymentModal) {
      setShowPaymentModal(false);
    } else if (selectedPlanId && !showConfirmModal) {
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

  const handlePaymentConfirm = async (data: {
    paymentMethod: string;
    transactionReference: string;
  }) => {
    // TODO: Enregistrer la demande de paiement dans la base de données
    // Pour l'instant, on affiche juste une notification
    showToast('Votre demande de paiement a été enregistrée. Notre équipe va la vérifier.', 'success');
    setShowPaymentModal(false);
  };

  const handleModifySubscription = () => {
    // Rediriger vers le Paywall pour choisir un nouveau plan
    setSelectedPlanId(null);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    // TODO: Implémenter la résiliation
    showToast('La résiliation sera effective à la fin de votre période en cours', 'info');
    setShowCancelModal(false);
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
                  <div>
                    <h3 className="font-semibold text-gray-900">Plan {currentPlan.name}</h3>
                    {currentPlan.freeMonths && currentPlan.freeMonths > 0 && (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium mt-1">
                        🎁 {currentPlan.freeMonths} mois offert{currentPlan.freeMonths > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
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

            {/* Informations supplémentaires pour période d'essai */}
            {isInTrial && subscription.trialEndDate && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Après la période d'essai</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de fin de période d'essai</span>
                    <span className="font-semibold text-gray-900">
                      {subscription.trialEndDate.toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {subscription.isProrata && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant au prorata</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(subscription.amountDue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jours jusqu'à la fin de période</span>
                        <span className="font-semibold text-gray-900">
                          {subscription.prorataDays} jours
                        </span>
                      </div>
                      {subscription.currentPeriodEnd && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date de fin de période calendaire</span>
                          <span className="font-semibold text-gray-900">
                            {subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {currentPlan && (
                    <div className="pt-2 border-t border-gray-300">
                      <p className="text-gray-600">
                        Ensuite, vous serez facturé {formatCurrency(currentPlan.price)} tous les {
                          currentPlan.billingCycle === 'monthly' ? 'mois' :
                          currentPlan.billingCycle === 'semesterly' ? 'semestres' : 'ans'
                        }.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            {(isPendingPayment || isInTrial) && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Payer maintenant
                </button>
                <button
                  onClick={handleModifySubscription}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Modifier mon abonnement
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Résilier
                </button>
              </div>
            )}

            {/* Modes de paiement */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Modes de paiement : <strong>Espèces</strong> | <strong>Wave</strong> | <strong>Orange Money</strong> | <strong>MTN Money</strong>
              </p>
            </div>
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

  // Étape 1: Sélection du plan (Paywall) - pour les nouveaux utilisateurs ou utilisateur existant sans plan sélectionné
  return (
    <>
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

      {/* Modal de confirmation */}
      {showConfirmModal && selectedPlan && prorataInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Confirmation d'abonnement
                  </h2>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedPlanId(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Plan info */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Confirmez-vous la souscription de votre abonnement <strong>{selectedPlan.name}</strong> ?
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Plan {selectedPlan.name}</p>
                        {selectedPlan.freeMonths && selectedPlan.freeMonths > 0 && (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium mt-1">
                            🎁 {selectedPlan.freeMonths} mois offert{selectedPlan.freeMonths > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(selectedPlan.price)}
                        <span className="text-sm font-normal text-gray-600 ml-1">
                          / {selectedPlan.billingCycle === 'monthly' ? 'mois' : selectedPlan.billingCycle === 'semesterly' ? 'semestre' : 'an'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Après votre période d'essai de 30 jours, vous devrez régler{' '}
                    <strong>{formatCurrency(prorataInfo.amount)}</strong> puis{' '}
                    <strong>{formatCurrency(selectedPlan.price)}</strong> par{' '}
                    {selectedPlan.billingCycle === 'monthly' ? 'mois' : 
                     selectedPlan.billingCycle === 'semesterly' ? 'semestre' : 'an'}.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleConfirmSubscription(false)}
                    disabled={isCreating}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Création en cours...
                      </>
                    ) : (
                      "Je m'abonne et je paie plus tard"
                    )}
                  </button>

                  <button
                    onClick={() => handleConfirmSubscription(true)}
                    disabled={isCreating}
                    className="w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-50 py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Je m'abonne et je paie maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={subscription?.amountDue || 0}
          invoiceNumber={unpaidInvoices[0]?.invoiceNumber}
          invoiceId={unpaidInvoices[0]?.id}
          onPaymentConfirm={handlePaymentConfirm}
        />

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Confirmer la résiliation
              </h3>
              <p className="text-gray-700 mb-6">
                Êtes-vous sûr de vouloir résilier votre abonnement ? Vous conserverez l'accès jusqu'à la fin de votre période en cours.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCancellation}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Confirmer la résiliation
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
