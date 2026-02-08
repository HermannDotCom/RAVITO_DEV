import React from 'react';
import { Lock, Star, Check, Crown } from 'lucide-react';
import type { SubscriptionPlan } from '../../types/subscription';
import { formatCurrency } from '../../types/subscription';

interface PaywallProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export const Paywall: React.FC<PaywallProps> = ({ plans, onSelectPlan, loading }) => {
  console.log('[Paywall] Rendering with plans:', plans.length, 'loading:', loading);

  // Sort plans by price to ensure consistent order (Monthly, Semesterly, Annually)
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Crown className="h-4 w-4 mr-2" />
            Idéal pour les propriétaires qui délèguent
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Module <span className="text-orange-600">Ravito Gestion</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Digitalisez votre cahier de suivi quotidien et gérez votre activité en temps réel.
            Choisissez le plan qui vous convient le mieux.
          </p>
        </div>

        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 mb-12 text-center shadow-lg transform hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-6 h-6 fill-current text-yellow-300" />
            <span className="text-2xl font-bold uppercase tracking-tight">30 jours d'essai gratuit</span>
            <Star className="w-6 h-6 fill-current text-yellow-300" />
          </div>
          <p className="text-orange-50 font-medium">
            Profitez de toutes les fonctionnalités gratuitement pendant votre premier mois
          </p>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Chargement des offres...</p>
            </div>
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="bg-white border-2 border-red-100 rounded-2xl p-12 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-gray-900 font-bold text-xl mb-2">Aucun plan disponible</p>
            <p className="text-gray-600">
              Les plans d'abonnement ne sont pas disponibles pour le moment.
              Veuillez contacter le support technique.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sortedPlans.map((plan) => {
              // Logic for recommended and savings based on billing cycle
              const isRecommended = plan.billingCycle === 'semesterly';
              const savings = plan.billingCycle === 'semesterly' ? '1 mois offert' : 
                             plan.billingCycle === 'annually' ? '4 mois offerts' : null;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 flex flex-col ${
                    isRecommended
                      ? 'border-orange-500 shadow-2xl lg:scale-105 relative z-10'
                      : 'border-gray-200 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md flex items-center gap-1">
                        ⭐ Recommandé
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    
                    {savings && (
                      <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold mb-4">
                        🎁 {savings}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-5xl font-extrabold text-gray-900">
                        {new Intl.NumberFormat('fr-FR').format(plan.price)}
                      </span>
                      <span className="text-xl font-bold text-gray-500 ml-2 uppercase">FCFA</span>
                    </div>
                    <div className="text-gray-500 font-medium">
                      par {plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle === 'semesterly' ? '6 mois' : 'an'}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 rounded-full p-0.5">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
                      isRecommended
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-orange-200'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Choisir ce plan
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom info */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-gray-500 text-sm font-medium">
            <p className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Paiement sécurisé (Wave, Orange, MTN, Espèces)
            </p>
            <p className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Aucun engagement, annulation à tout moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
