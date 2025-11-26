/**
 * Subscription Plans Configuration
 * 
 * Defines the 4 subscription plans available in DISTRI-NIGHT:
 * FREE, SILVER, GOLD, PLATINUM
 */

import type { PlanFeature } from '../types';

// Constants for pricing calculations
export const YEARLY_DISCOUNT_RATE = 0.8; // 20% discount for yearly billing
export const EUR_TO_FCFA_RATE = 655.957; // Euro to FCFA exchange rate

/**
 * Calculate yearly price with discount
 */
const calculateYearlyPrice = (monthlyPrice: number): number => {
  return Math.round(monthlyPrice * 12 * YEARLY_DISCOUNT_RATE);
};

export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  displayName: string;
  price: { monthly: number; yearly: number };
  color: string;
  bgColor: string;
  borderColor: string;
  headerGradient: string;
  popular?: boolean;
  features: PlanFeature[];
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  FREE: {
    id: 'free',
    name: 'Free',
    displayName: 'FREE',
    price: { monthly: 0, yearly: 0 },
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    headerGradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
    description: 'Parfait pour démarrer',
    features: [
      { name: 'Commandes de base', included: true },
      { name: 'Historique 30 jours', included: true },
      { name: 'Support email', included: true },
      { name: 'Statistiques avancées', included: false },
      { name: 'Priorité commandes', included: false },
      { name: 'API Access', included: false },
    ]
  },
  SILVER: {
    id: 'silver',
    name: 'Silver',
    displayName: 'SILVER',
    price: { monthly: 29, yearly: calculateYearlyPrice(29) },
    color: 'slate',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    headerGradient: 'bg-gradient-to-r from-slate-400 to-slate-500',
    description: 'Pour les utilisateurs actifs',
    features: [
      { name: 'Commandes de base', included: true },
      { name: 'Historique illimité', included: true },
      { name: 'Support email prioritaire', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Priorité commandes', included: false },
      { name: 'API Access', included: false },
    ]
  },
  GOLD: {
    id: 'gold',
    name: 'Gold',
    displayName: 'GOLD',
    price: { monthly: 59, yearly: calculateYearlyPrice(59) },
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    headerGradient: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    popular: true,
    description: 'Notre offre la plus populaire',
    features: [
      { name: 'Commandes de base', included: true },
      { name: 'Historique illimité', included: true },
      { name: 'Support prioritaire 24/7', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Priorité commandes', included: true },
      { name: 'API Access', included: false },
    ]
  },
  PLATINUM: {
    id: 'platinum',
    name: 'Platinum',
    displayName: 'PLATINUM',
    price: { monthly: 99, yearly: calculateYearlyPrice(99) },
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    headerGradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
    description: 'Toutes les fonctionnalités premium',
    features: [
      { name: 'Commandes de base', included: true },
      { name: 'Historique illimité', included: true },
      { name: 'Support VIP dédié', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Priorité commandes max', included: true },
      { name: 'API Access complet', included: true },
    ]
  }
};

export const PLAN_ORDER = ['FREE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

/**
 * Get all plans in display order
 */
export const getOrderedPlans = (): SubscriptionPlanConfig[] => {
  return PLAN_ORDER.map(planKey => SUBSCRIPTION_PLANS[planKey]);
};

/**
 * Calculate yearly savings for a plan
 */
export const calculateYearlySavings = (plan: SubscriptionPlanConfig): number => {
  const monthlyTotal = plan.price.monthly * 12;
  return monthlyTotal - plan.price.yearly;
};

/**
 * Calculate yearly discount percentage
 */
export const calculateYearlyDiscount = (plan: SubscriptionPlanConfig): number => {
  if (plan.price.monthly === 0) return 0;
  const monthlyTotal = plan.price.monthly * 12;
  return Math.round(((monthlyTotal - plan.price.yearly) / monthlyTotal) * 100);
};

/**
 * Format price in EUR
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format price in FCFA
 */
export const formatPriceFCFA = (price: number): string => {
  const fcfaPrice = Math.round(price * EUR_TO_FCFA_RATE);
  return new Intl.NumberFormat('fr-FR').format(fcfaPrice) + ' FCFA';
};
