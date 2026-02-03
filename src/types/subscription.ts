// ============================================
// SUBSCRIPTION SYSTEM TYPES
// ============================================

/**
 * Billing cycles for subscription plans
 */
export type BillingCycle = 'monthly' | 'semesterly' | 'annually';

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'trial'           // Période d'essai en cours
  | 'pending_payment' // Essai terminé, en attente de paiement
  | 'active'          // Abonnement actif et payé
  | 'suspended'       // Suspendu pour non-paiement
  | 'cancelled';      // Annulé

/**
 * Payment methods
 */
export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'mtn_money';

/**
 * Invoice status
 */
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled' | 'overdue';

/**
 * Reminder types based on days before due date
 */
export type ReminderType =
  | 'j_minus_90'
  | 'j_minus_60'
  | 'j_minus_30'
  | 'j_minus_15'
  | 'j_minus_7'
  | 'j_minus_2';

// ============================================
// DATABASE MODELS
// ============================================

/**
 * Subscription Plan
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: BillingCycle;
  daysInCycle: number;
  trialDays: number;
  isActive: boolean;
  displayOrder: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Settings (singleton)
 */
export interface SubscriptionSettings {
  id: string;
  trialDurationDays: number;
  autoSuspendAfterTrial: boolean;
  reminderDays: {
    monthly: number[];
    semesterly: number[];
    annually: number[];
  };
  gracePeriodDays: number;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * Subscription
 */
export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;

  // Trial
  isFirstSubscription: boolean;
  trialStartDate: Date | null;
  trialEndDate: Date | null;

  // Billing
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextBillingDate: Date | null;

  // Amounts
  amountDue: number;
  isProrata: boolean;
  prorataDays: number | null;

  // Metadata
  subscribedAt: Date;
  activatedAt: Date | null;
  suspendedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations (populated)
  plan?: SubscriptionPlan;
}

/**
 * Subscription Invoice
 */
export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  invoiceNumber: string;

  // Amounts
  amount: number;
  prorataAmount: number | null;
  daysCalculated: number | null;
  isProrata: boolean;

  // Period
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;

  // Status
  status: InvoiceStatus;

  // Payment
  paidAt: Date | null;
  paidAmount: number | null;

  // Metadata
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (populated)
  subscription?: Subscription;
}

/**
 * Subscription Payment
 */
export interface SubscriptionPayment {
  id: string;
  invoiceId: string;
  subscriptionId: string;

  // Payment details
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;

  // Validation
  validatedBy: string | null;
  validationDate: Date;

  // Receipt
  receiptNumber: string | null;
  transactionReference: string | null;
  notes: string | null;

  createdAt: Date;

  // Relations (populated)
  invoice?: SubscriptionInvoice;
  validator?: { id: string; fullName: string };
}

/**
 * Subscription Reminder
 */
export interface SubscriptionReminder {
  id: string;
  subscriptionId: string;
  invoiceId: string | null;

  // Reminder details
  reminderType: ReminderType;
  daysBeforeDue: number;

  // Notification
  notificationId: string | null;
  sentAt: Date;

  createdAt: Date;
}

// ============================================
// VIEW MODELS & DTOs
// ============================================

/**
 * Subscription with enriched data for display
 */
export interface SubscriptionWithDetails extends Subscription {
  plan: SubscriptionPlan;
  organizationName: string;
  daysLeftInTrial: number | null;
  daysUntilDue: number | null;
  hasUnpaidInvoices: boolean;
}

/**
 * Invoice with enriched data
 */
export interface InvoiceWithDetails extends SubscriptionInvoice {
  subscription: {
    id: string;
    organizationId: string;
    organizationName: string;
    plan: SubscriptionPlan;
  };
  payments: SubscriptionPayment[];
  totalPaid: number;
  remainingAmount: number;
}

/**
 * Stats for Admin dashboard
 */
export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  suspendedSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
}

// ============================================
// FORM TYPES
// ============================================

/**
 * Form data for creating a subscription
 */
export interface CreateSubscriptionData {
  organizationId: string;
  planId: string;
}

/**
 * Form data for validating a payment
 */
export interface ValidatePaymentData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  receiptNumber?: string;
  transactionReference?: string;
  notes?: string;
}

/**
 * Form data for updating plan pricing
 */
export interface UpdatePlanData {
  price: number;
  description?: string;
  isActive?: boolean;
  features?: string[];
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Prorata calculation result
 */
export interface ProrataCalculation {
  amount: number;
  daysRemaining: number;
  totalDaysInPeriod: number;
  periodEnd: Date;
  fullPrice: number;
}

/**
 * Trial period calculation
 */
export interface TrialPeriod {
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
}

/**
 * Next billing information
 */
export interface NextBilling {
  date: Date;
  amount: number;
  isProrata: boolean;
  description: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get billing cycle display name
 */
export const getBillingCycleName = (cycle: BillingCycle): string => {
  const names: Record<BillingCycle, string> = {
    monthly: 'Mensuel',
    semesterly: 'Semestriel',
    annually: 'Annuel'
  };
  return names[cycle];
};

/**
 * Get subscription status display name
 */
export const getSubscriptionStatusName = (status: SubscriptionStatus): string => {
  const names: Record<SubscriptionStatus, string> = {
    trial: 'Essai gratuit',
    pending_payment: 'En attente de paiement',
    active: 'Actif',
    suspended: 'Suspendu',
    cancelled: 'Annulé'
  };
  return names[status];
};

/**
 * Get subscription status color
 */
export const getSubscriptionStatusColor = (status: SubscriptionStatus): string => {
  const colors: Record<SubscriptionStatus, string> = {
    trial: 'blue',
    pending_payment: 'orange',
    active: 'green',
    suspended: 'red',
    cancelled: 'gray'
  };
  return colors[status];
};

/**
 * Get payment method display name
 */
export const getPaymentMethodName = (method: PaymentMethod): string => {
  const names: Record<PaymentMethod, string> = {
    cash: 'Espèces',
    wave: 'Wave',
    orange_money: 'Orange Money',
    mtn_money: 'MTN Money'
  };
  return names[method];
};

/**
 * Get invoice status display name
 */
export const getInvoiceStatusName = (status: InvoiceStatus): string => {
  const names: Record<InvoiceStatus, string> = {
    pending: 'En attente',
    paid: 'Payée',
    cancelled: 'Annulée',
    overdue: 'En retard'
  };
  return names[status];
};

/**
 * Get invoice status color
 */
export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    pending: 'orange',
    paid: 'green',
    cancelled: 'gray',
    overdue: 'red'
  };
  return colors[status];
};

/**
 * Format currency (FCFA)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

/**
 * Check if subscription can access feature
 */
export const canAccessFeature = (
  subscription: Subscription | null,
  featureName: string
): boolean => {
  if (!subscription) return false;

  // Feature access only for trial, active subscriptions
  if (subscription.status === 'trial' || subscription.status === 'active') {
    return true;
  }

  return false;
};
