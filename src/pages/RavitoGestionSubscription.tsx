import React, { useState, useCallback } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../context/ToastContext';
import { Paywall } from '../components/Subscription/Paywall';
import { PaymentModal } from '../components/Subscription/PaymentModal';
import { ArrowLeft, CheckCircle, Clock, CreditCard, AlertCircle, Info, FileText } from 'lucide-react';
import { formatCurrency } from '../types/subscription';
import { calculateProrata } from '../services/ravitoGestionSubscriptionService';
import { generatePaymentReceipt } from '../services/receiptPdfService';
import { supabase } from '../lib/supabase';
import type { SubscriptionPlan, PaymentMethod } from '../types/subscription';

interface RavitoGestionSubscriptionProps {
  onSectionChange?: (section: string) => void;
}

export const RavitoGestionSubscription: React.FC<RavitoGestionSubscriptionProps> = ({ onSectionChange }) => {
  const { showToast } = useToast();
  const { organizationName } = useOrganization();
  const {
    subscription,
    plans,
    invoices,
    loading,
    error: subscriptionError,
    createSubscription,
    cancelSubscription,
    submitPaymentClaim,
    isInTrial,
    isPendingPayment,
    isSuspended,
    hasActiveSubscription,
    daysLeftInTrial
  } = useSubscriptionContext();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const currentPlan = subscription?.plan;

  // Si un plan est sélectionné, on calcule le prorata
  const prorataInfo = selectedPlan
    ? calculateProrata(selectedPlan, new Date())
    : null;

  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setShowConfirmModal(true);
  }, []);

  const handleConfirmSubscription = async (planId: string, payNow: boolean = false) => {
    console.log('[RavitoGestionSubscription] handleConfirmSubscription called with:', { planId, payNow, isCreating });
    
    if (!planId || isCreating) {
      console.log('[RavitoGestionSubscription] Early exit - planId:', planId, 'isCreating:', isCreating);
      return;
    }

    try {
      setIsCreating(true);

      const success = await createSubscription(planId);

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
    const invoice = unpaidInvoices[0];
    if (!invoice) {
      showToast('Aucune facture en attente trouvée', 'error');
      return;
    }

    try {
      const success = await submitPaymentClaim(
        invoice.id,
        data.paymentMethod,
        data.transactionReference
      );

      if (success) {
        showToast('Votre déclaration de paiement a été enregistrée. Notre équipe va la vérifier et valider.', 'success');
        setShowPaymentModal(false);
      } else {
        showToast('Erreur lors de l\'enregistrement', 'error');
      }
    } catch (error) {
      console.error('Error submitting payment claim:', error);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDownloadReceipt = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        showToast('Facture non trouvée', 'error');
        return;
      }

      // Récupérer les informations nécessaires
      const planName = subscription?.plan?.name || 'Plan inconnu';
      const orgName = organizationName || 'Organisation';
      
      // Récupérer la méthode de paiement depuis la table subscription_payments
      let paymentMethod: PaymentMethod = 'wave'; // Default fallback
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('subscription_payments')
          .select('payment_method')
          .eq('invoice_id', invoiceId)
          .eq('status', 'validated')
          .order('payment_date', { ascending: false })
          .limit(1)
          .single();

        if (!paymentError && paymentData?.payment_method) {
          paymentMethod = paymentData.payment_method as PaymentMethod;
        }
      } catch (paymentFetchError) {
        console.warn('Could not fetch payment method, using default:', paymentFetchError);
      }
      
      await generatePaymentReceipt({
        invoice,
        organizationName: orgName,
        planName,
        paymentMethod,
        transactionReference: invoice.transactionReference
      });

      showToast('Reçu téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Error generating receipt:', error);
      showToast('Erreur lors de la génération du reçu', 'error');
    }
  };

  const handleModifySubscription = () => {
    setShowPlanSelector(true);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      setIsCancelling(true);
      const success = await cancelSubscription('Résiliation demandée par le client');

      if (success) {
        showToast('Votre abonnement a été résilié. L\'accès reste actif jusqu\'à la fin de la période en cours.', 'info');
        setShowCancelModal(false);
      } else {
        showToast('Erreur lors de la résiliation', 'error');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showToast('Erreur lors de la résiliation', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtrer les factures impayées
  const unpaidInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  // Si l'utilisateur a déjà un abonnement, afficher la gestion d'abonnement
  // (pas de check sur loading car on veut continuer à afficher l'abonnement pendant le rechargement)
  if (subscription && !selectedPlanId && !showPlanSelector) {
    // Debug logs
    console.log('[RavitoGestionSubscription] Rendering subscription page with data:', {
      isInTrial,
      hasActiveSubscription,
      isPendingPayment,
      subscriptionStatus: subscription.status,
      isProrata: subscription.isProrata,
      prorataDays: subscription.prorataDays,
      amountDue: subscription.amountDue,
      nextBillingDate: subscription.nextBillingDate,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndDate: subscription.trialEndDate
    });

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

            {/* Encadré Période d'essai - Toujours visible */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Période d'essai</h4>
              <div className="space-y-1 text-sm">
                {subscription.trialStartDate && subscription.trialEndDate ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-800">Dates de la période d'essai</span>
                      <span className="font-medium text-blue-900">
                        Du {subscription.trialStartDate.toLocaleDateString('fr-FR')} au {subscription.trialEndDate.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {isInTrial ? (
                      <p className="text-blue-700 mt-2">
                        Vous bénéficiez actuellement de votre période d'essai de 30 jours offerts.
                      </p>
                    ) : (
                      <p className="text-blue-700 mt-2">
                        Votre période d'essai de 30 jours est terminée.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-blue-700">
                    Période d'essai de 30 jours offerts lors de la première souscription par organisation.
                  </p>
                )}
              </div>
            </div>

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
              {subscription.status === 'cancelled' && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Abonnement résilié</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Abonnement en cours</h3>

            {/* Détails du plan */}
            {currentPlan && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">Plan {currentPlan.name}</h4>
                    {currentPlan.freeMonths > 0 && (
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
                <p className="text-gray-600 text-sm mb-3">{currentPlan.description}</p>

                {/* Date de souscription */}
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de souscription</span>
                    <span className="font-medium text-gray-900">
                      {subscription.subscribedAt.toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Informations de résiliation si applicable */}
                  {subscription.status === 'cancelled' && subscription.cancelledAt && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date de résiliation</span>
                        <span className="font-medium text-red-600">
                          {subscription.cancelledAt.toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {subscription.currentPeriodEnd && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Résiliation effective</span>
                            <span className="font-medium text-red-600">
                              {(() => {
                                const effectiveDate = new Date(subscription.currentPeriodEnd);
                                effectiveDate.setDate(effectiveDate.getDate() + 1);
                                return effectiveDate.toLocaleDateString('fr-FR');
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            Votre abonnement restera actif jusqu'au {subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Informations de facturation - Pour TOUS les abonnés (essai et actifs) */}
            {(isInTrial || hasActiveSubscription) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {isInTrial ? "Après la période d'essai" : "Informations de facturation"}
                </h4>
                <div className="space-y-2 text-sm">
                  {/* Pour période d'essai */}
                  {isInTrial && subscription.trialEndDate && (
                    <>
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
                    </>
                  )}

                  {/* Pour abonnement actif */}
                  {hasActiveSubscription && subscription.nextBillingDate && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prochaine date de facturation</span>
                        <span className="font-semibold text-gray-900">
                          {subscription.nextBillingDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {(() => {
                        const daysUntilBilling = Math.ceil(
                          (subscription.nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Jours restants avant facturation</span>
                            <span className="font-semibold text-gray-900">
                              {daysUntilBilling} jour{daysUntilBilling > 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })()}
                      {currentPlan && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Montant de la prochaine facture</span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(currentPlan.price)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-300">
                            <p className="text-gray-600">
                              Vous êtes facturé {formatCurrency(currentPlan.price)} tous les {
                                currentPlan.billingCycle === 'monthly' ? 'mois' :
                                currentPlan.billingCycle === 'semesterly' ? 'semestres' : 'ans'
                              }.
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action - Pour tous les abonnés (essai, actifs, en attente) */}
            {(isPendingPayment || isInTrial || hasActiveSubscription) && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {(isPendingPayment || isInTrial) && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Payer maintenant
                  </button>
                )}
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
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Facture {invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          Payée le {invoice.paidAt?.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Période : {invoice.periodStart.toLocaleDateString('fr-FR')} - {invoice.periodEnd.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Payée</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadReceipt(invoice.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors"
                          title="Télécharger le reçu"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Reçu</span>
                        </button>
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

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={unpaidInvoices[0]?.amount || subscription?.amountDue || 0}
          invoiceNumber={unpaidInvoices[0]?.invoiceNumber}
          invoiceId={unpaidInvoices[0]?.id}
          onPaymentConfirm={handlePaymentConfirm}
        />

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
                  disabled={isCancelling}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={isCancelling}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Résiliation...
                    </>
                  ) : (
                    'Confirmer la résiliation'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="p-4">
          <button
            onClick={() => {
              if (showPlanSelector) {
                setShowPlanSelector(false);
              } else {
                handleBack();
              }
            }}
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
                        {selectedPlan.freeMonths > 0 && (
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
                    onClick={() => selectedPlan && handleConfirmSubscription(selectedPlan.id, false)}
                    disabled={isCreating || !selectedPlan}
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
                    onClick={() => selectedPlan && handleConfirmSubscription(selectedPlan.id, true)}
                    disabled={isCreating || !selectedPlan}
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
