/**
 * Subscribe Modal Component
 * 
 * Multi-step modal for subscription process
 */

import React, { useState } from 'react';
import { X, Check, CreditCard, Wallet, ArrowLeft, ArrowRight, Sparkles, Smartphone } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice, calculateYearlySavings } from '../../config/subscriptionPlans';
import { PlanFeatureList } from './PlanFeatureList';
import type { PaymentMethod } from '../../types';

interface SubscribeModalProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (planId: string, billingPeriod: 'monthly' | 'yearly', paymentMethod: PaymentMethod) => void;
  treasuryBalance?: number;
  loading?: boolean;
}

type Step = 'summary' | 'period' | 'payment' | 'confirmation';

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'orange', label: 'Orange Money', icon: Smartphone },
  { id: 'mtn', label: 'MTN Mobile Money', icon: Smartphone },
  { id: 'wave', label: 'Wave', icon: Smartphone },
  { id: 'moov', label: 'Moov Money', icon: Smartphone },
  { id: 'card', label: 'Carte bancaire', icon: CreditCard },
];

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  planId,
  isOpen,
  onClose,
  onConfirm,
  treasuryBalance = 0,
  loading = false
}) => {
  const [step, setStep] = useState<Step>('summary');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('orange');
  const [useTreasury, setUseTreasury] = useState(false);

  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
  if (!plan || !isOpen) return null;

  const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly;
  const yearlySavings = calculateYearlySavings(plan);
  const canUseTreasury = treasuryBalance >= price;

  const steps: { id: Step; label: string }[] = [
    { id: 'summary', label: 'Récapitulatif' },
    { id: 'period', label: 'Période' },
    { id: 'payment', label: 'Paiement' },
    { id: 'confirmation', label: 'Confirmation' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleNext = () => {
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) setStep(nextStep.id);
  };

  const handleBack = () => {
    const prevStep = steps[currentStepIndex - 1];
    if (prevStep) setStep(prevStep.id);
  };

  const handleConfirm = () => {
    onConfirm(planId, billingPeriod, useTreasury ? 'wave' : selectedPayment);
  };

  const resetModal = () => {
    setStep('summary');
    setBillingPeriod('monthly');
    setSelectedPayment('orange');
    setUseTreasury(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${plan.headerGradient} text-white relative`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl font-bold">Souscrire au plan {plan.name}</h2>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                    ${idx <= currentStepIndex
                      ? 'bg-white text-gray-800'
                      : 'bg-white/30 text-white/70'
                    }
                  `}
                >
                  {idx < currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      idx < currentStepIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Step 1: Summary */}
          {step === 'summary' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plan {plan.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {plan.price.monthly === 0 ? 'Gratuit' : `${plan.price.monthly}€/mois`}
                </div>
                {plan.price.monthly > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    ou {plan.price.yearly}€/an (économisez {yearlySavings}€)
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-3">Fonctionnalités incluses:</h4>
              <PlanFeatureList features={plan.features} />
            </div>
          )}

          {/* Step 2: Billing Period */}
          {step === 'period' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choisissez votre période de facturation
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${billingPeriod === 'monthly'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Mensuel</div>
                      <div className="text-sm text-gray-600">Flexibilité maximale</div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(plan.price.monthly)}/mois
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all relative
                    ${billingPeriod === 'yearly'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    -20%
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Annuel</div>
                      <div className="text-sm text-gray-600">
                        Économisez {formatPrice(yearlySavings)} par an
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(plan.price.yearly)}/an
                      </div>
                      <div className="text-sm text-gray-600">
                        soit {formatPrice(Math.round(plan.price.yearly / 12))}/mois
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choisissez votre mode de paiement
              </h3>

              {/* Treasury Option */}
              {treasuryBalance > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setUseTreasury(!useTreasury)}
                    disabled={!canUseTreasury}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${useTreasury
                        ? 'border-orange-500 bg-orange-50'
                        : canUseTreasury
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-semibold text-gray-900">Solde Trésorerie</div>
                          <div className="text-sm text-gray-600">
                            {formatPrice(treasuryBalance)} disponible
                          </div>
                        </div>
                      </div>
                      {useTreasury && <Check className="h-5 w-5 text-orange-500" />}
                    </div>
                    {!canUseTreasury && (
                      <div className="text-xs text-red-500 mt-2">
                        Solde insuffisant ({formatPrice(price - treasuryBalance)} manquant)
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Payment Methods */}
              {!useTreasury && (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between
                        ${selectedPayment === method.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{method.label}</span>
                      </div>
                      {selectedPayment === method.id && (
                        <Check className="h-5 w-5 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirmation' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmer votre abonnement
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Période</span>
                  <span className="font-semibold text-gray-900">
                    {billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paiement</span>
                  <span className="font-semibold text-gray-900">
                    {useTreasury
                      ? 'Solde Trésorerie'
                      : paymentMethods.find(m => m.id === selectedPayment)?.label
                    }
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatPrice(price)}
                    <span className="text-sm text-gray-600 font-normal">
                      /{billingPeriod === 'monthly' ? 'mois' : 'an'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  En confirmant, vous acceptez les conditions générales d'utilisation et 
                  autorisez le prélèvement automatique selon la période choisie.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStepIndex === 0 ? 'Annuler' : 'Retour'}
          </button>

          {step === 'confirmation' ? (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Traitement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmer
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
