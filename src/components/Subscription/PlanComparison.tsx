/**
 * Plan Comparison Component
 * 
 * Grid comparing all subscription plans side by side
 */

import React, { useState } from 'react';
import { PlanCard } from './PlanCard';
import { getOrderedPlans, calculateYearlySavings, formatPrice } from '../../config/subscriptionPlans';
import type { PlanType } from '../../types';

interface PlanComparisonProps {
  currentPlan: PlanType;
  onSelectPlan: (planId: string) => void;
  disabled?: boolean;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  currentPlan,
  onSelectPlan,
  disabled = false
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const plans = getOrderedPlans();

  return (
    <div>
      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex items-center">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`
              px-6 py-2 rounded-md text-sm font-medium transition-all
              ${billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`
              px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Annuel
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              -50%
            </span>
          </button>
        </div>
      </div>

      {/* Yearly Savings Info */}
      {billingPeriod === 'yearly' && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Économisez jusqu'à{' '}
            <span className="font-semibold text-green-600">
              {formatPrice(calculateYearlySavings(plans[3]))}
            </span>{' '}
            par an avec le plan Platinum
          </p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const planKey = plan.displayName as PlanType;
          const isCurrent = currentPlan === planKey;

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrent}
              billingPeriod={billingPeriod}
              onSelect={onSelectPlan}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
};
