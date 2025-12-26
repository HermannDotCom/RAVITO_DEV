/**
 * Plan Card Component
 * 
 * Individual subscription plan card with pricing and features
 */

import React from 'react';
import { Star, ArrowRight, Check } from 'lucide-react';
import { PlanFeatureList } from './PlanFeatureList';
import { formatPrice, type SubscriptionPlanConfig } from '../../config/subscriptionPlans';

interface PlanCardProps {
  plan: SubscriptionPlanConfig;
  isCurrentPlan: boolean;
  billingPeriod: 'monthly' | 'yearly';
  onSelect: (planId: string) => void;
  disabled?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  billingPeriod,
  onSelect,
  disabled = false
}) => {
  const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly;
  const monthlyEquivalent = billingPeriod === 'yearly' 
    ? Math.round(plan.price.yearly / 12) 
    : plan.price.monthly;

  return (
    <div
      className={`
        relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 
        hover:scale-105 hover:shadow-xl
        ${plan.bgColor} border-2 ${plan.borderColor}
        ${isCurrentPlan ? 'ring-4 ring-orange-400' : ''}
      `}
    >
      {/* Popular Badge */}
      {plan.popular && !isCurrentPlan && (
        <div className="absolute -top-0 -right-0 z-10">
          <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            POPULAIRE
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-0 -right-0 z-10">
          <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
            <Check className="h-3 w-3" />
            ACTUEL
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-6 ${plan.headerGradient}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xl font-bold text-white">{plan.displayName}</h4>
        </div>
        <div className="text-white">
          {plan.price.monthly === 0 ? (
            <span className="text-3xl font-bold">Gratuit</span>
          ) : (
            <>
              <span className="text-2xl font-bold">{formatPrice(price)}</span>
              <span className="text-sm font-normal opacity-80">
                /{billingPeriod === 'monthly' ? 'mois' : 'an'}
              </span>
              {billingPeriod === 'yearly' && (
                <div className="text-sm opacity-80 mt-1">
                  soit {formatPrice(monthlyEquivalent)}/mois
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
        <PlanFeatureList features={plan.features} className="mb-6" />

        {/* Action Button */}
        {isCurrentPlan ? (
          <div className="text-center py-2.5 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
            Plan actuel
          </div>
        ) : plan.price.monthly === 0 ? (
          <div className="text-center py-2.5 bg-gray-100 rounded-lg text-gray-500 font-medium text-sm">
            Plan gratuit
          </div>
        ) : (
          <button
            onClick={() => onSelect(plan.id)}
            disabled={disabled}
            className={`
              w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm 
              ${plan.headerGradient} text-white hover:opacity-90
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Souscrire
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
