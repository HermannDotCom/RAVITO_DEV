import React from 'react';
import { Lock, Star, CheckCircle } from 'lucide-react';
import type { SubscriptionPlan } from '../../types/subscription';
import { formatCurrency } from '../../types/subscription';

interface PaywallProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export const Paywall: React.FC<PaywallProps> = ({ plans, onSelectPlan, loading }) => {
  console.log('[Paywall] Rendering with plans:', plans.length, 'loading:', loading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
            <Lock className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Module Ravito Gestion
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Digitalisez votre cahier de suivi quotidien et gérez votre activité en temps réel
          </p>
        </div>

        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 mb-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-6 h-6 fill-current" />
            <span className="text-2xl font-bold">1 MOIS GRATUIT OFFERT</span>
            <Star className="w-6 h-6 fill-current" />
          </div>
          <p className="text-green-100">
            Profitez d'un mois d'essai gratuit sur votre première souscription
          </p>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-900 font-semibold mb-2">Aucun plan disponible</p>
            <p className="text-red-700 text-sm">
              Les plans d'abonnement ne sont pas disponibles pour le moment.
              Veuillez réessayer ou contacter le support.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, index) => {
              const isPopular = index === 1; // Semestriel est le plus populaire
              const hasFreeMonths = plan.freeMonths && plan.freeMonths > 0;

              return (
                <div
                  key={plan.id}
                  className={`
                    relative bg-white rounded-xl shadow-lg border-2 transition-all hover:scale-105
                    ${isPopular ? 'border-orange-500 transform scale-105' : 'border-gray-200'}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                        RECOMMANDÉ
                      </span>
                    </div>
                  )}

                  {/* Badge mois offerts */}
                  {hasFreeMonths && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        🎁 {plan.freeMonths} mois offert{plan.freeMonths > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          / {plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle === 'semesterly' ? 'semestre' : 'an'}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => onSelectPlan(plan.id)}
                      className={`
                        w-full py-3 px-6 rounded-lg font-semibold transition-colors
                        ${isPopular
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }
                      `}
                    >
                      Choisir ce plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom info */}
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">
            Paiement sécurisé par Cash, Wave, Orange Money ou MTN Money
          </p>
          <p>
            Aucun engagement • Annulation possible à tout moment
          </p>
        </div>
      </div>
    </div>
  );
};
