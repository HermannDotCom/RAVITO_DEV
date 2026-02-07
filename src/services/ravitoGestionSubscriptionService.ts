import { supabase } from '../lib/supabase';
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPayment,
  SubscriptionSettings,
  CreateSubscriptionData,
  ValidatePaymentData,
  ProrataCalculation,
  BillingCycle
} from '../types/subscription';

// ============================================
// TRANSFORMATION HELPERS
// ============================================

const transformPlan = (data: any): SubscriptionPlan => ({
  id: data.id,
  name: data.name,
  description: data.description,
  price: parseFloat(data.price),
  billingCycle: data.billing_cycle,
  daysInCycle: data.days_in_cycle,
  trialDays: data.trial_days,
  isActive: data.is_active,
  displayOrder: data.display_order,
  features: data.features || [],
  freeMonths: data.free_months,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at)
});

const transformSubscription = (data: any): Subscription => {
  // Debug log pour voir les données brutes
  console.log('[transformSubscription] Raw data:', {
    id: data.id,
    status: data.status,
    is_prorata: data.is_prorata,
    prorata_days: data.prorata_days,
    amount_due: data.amount_due,
    next_billing_date: data.next_billing_date,
    current_period_end: data.current_period_end
  });

  const transformed = {
    id: data.id,
    organizationId: data.organization_id,
    planId: data.plan_id,
    status: data.status,
    isFirstSubscription: Boolean(data.is_first_subscription),
    trialStartDate: data.trial_start_date ? new Date(data.trial_start_date) : null,
    trialEndDate: data.trial_end_date ? new Date(data.trial_end_date) : null,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : null,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
    nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : null,
    amountDue: parseFloat(data.amount_due || 0),
    isProrata: Boolean(data.is_prorata),
    prorataDays: data.prorata_days ? parseInt(data.prorata_days) : null,
    subscribedAt: new Date(data.subscribed_at),
    activatedAt: data.activated_at ? new Date(data.activated_at) : null,
    suspendedAt: data.suspended_at ? new Date(data.suspended_at) : null,
    cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : null,
    cancellationReason: data.cancellation_reason,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    plan: data.subscription_plans ? transformPlan(data.subscription_plans) : undefined
  };

  console.log('[transformSubscription] Transformed:', {
    id: transformed.id,
    status: transformed.status,
    isProrata: transformed.isProrata,
    prorataDays: transformed.prorataDays,
    amountDue: transformed.amountDue,
    nextBillingDate: transformed.nextBillingDate,
    currentPeriodEnd: transformed.currentPeriodEnd
  });

  return transformed;
};

const transformInvoice = (data: any): SubscriptionInvoice => ({
  id: data.id,
  subscriptionId: data.subscription_id,
  invoiceNumber: data.invoice_number,
  amount: parseFloat(data.amount),
  prorataAmount: data.prorata_amount ? parseFloat(data.prorata_amount) : null,
  daysCalculated: data.days_calculated,
  isProrata: data.is_prorata,
  periodStart: new Date(data.period_start),
  periodEnd: new Date(data.period_end),
  dueDate: new Date(data.due_date),
  status: data.status,
  paidAt: data.paid_at ? new Date(data.paid_at) : null,
  paidAmount: data.paid_amount ? parseFloat(data.paid_amount) : null,
  notes: data.notes,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at)
});

// ============================================
// PLANS
// ============================================

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    console.log('[SubscriptionService] Fetching subscription plans...');
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('[SubscriptionService] Error fetching plans:', error);
      throw error;
    }

    console.log('[SubscriptionService] Plans fetched:', data?.length || 0, 'plans');
    const plans = (data || []).map(transformPlan);
    console.log('[SubscriptionService] Plans transformed:', plans);
    return plans;
  } catch (error) {
    console.error('[SubscriptionService] Error fetching subscription plans:', error);
    throw error;
  }
};

export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return transformPlan(data);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw error;
  }
};

// ============================================
// SUBSCRIPTIONS
// ============================================

export const getOrganizationSubscription = async (
  organizationId: string
): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['trial', 'pending_payment', 'active'])
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return transformSubscription(data);
  } catch (error) {
    console.error('Error fetching organization subscription:', error);
    throw error;
  }
};

export const createSubscription = async (
  data: CreateSubscriptionData
): Promise<Subscription> => {
  try {
    // Récupérer le plan
    const plan = await getSubscriptionPlan(data.planId);
    if (!plan) throw new Error('Plan not found');

    // Vérifier s'il existe déjà un abonnement actif
    const existing = await getOrganizationSubscription(data.organizationId);
    if (existing && existing.status !== 'cancelled') {
      throw new Error('Organization already has an active subscription');
    }

    // Calculer les dates de période d'essai
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);

    // Créer l'abonnement
    const { data: subscriptionData, error } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: data.organizationId,
        plan_id: data.planId,
        status: 'trial',
        is_first_subscription: true,
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString()
      })
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) throw error;
    return transformSubscription(subscriptionData);
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// ============================================
// CONSTANTS
// ============================================

const TRIAL_PERIOD_DAYS = 30;

// ============================================
// PRORATA CALCULATION
// ============================================

/**
 * Calcule le montant prorata pour une période donnée
 */
export const calculateProrata = (
  plan: SubscriptionPlan,
  subscriptionDate: Date
): ProrataCalculation => {
  // Calculer la fin de l'essai gratuit (30 jours après souscription)
  const trialEndDate = new Date(subscriptionDate);
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);
  
  // Calculer la fin de période calendaire APRÈS l'essai
  const periodEnd = calculatePeriodEnd(trialEndDate, plan.billingCycle);
  
  // Jours entre fin essai et fin période
  const daysRemaining = Math.ceil(
    (periodEnd.getTime() - trialEndDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Diviseur selon le cycle
  const totalDaysInPeriod = plan.daysInCycle; // 31, 183, ou 365
  
  const amount = Math.round((plan.price * daysRemaining) / totalDaysInPeriod);

  return {
    amount,
    daysRemaining,
    totalDaysInPeriod,
    periodEnd,
    trialEndDate,
    fullPrice: plan.price
  };
};

/**
 * Calcule la fin de période selon le cycle de facturation
 */
export const calculatePeriodEnd = (startDate: Date, billingCycle: BillingCycle): Date => {
  const date = new Date(startDate);

  switch (billingCycle) {
    case 'monthly':
      // Dernier jour du mois
      date.setMonth(date.getMonth() + 1);
      date.setDate(0); // Dernier jour du mois précédent
      date.setHours(23, 59, 59, 999);
      return date;

    case 'semesterly':
      // 30 juin ou 31 décembre
      const month = date.getMonth();
      if (month < 6) {
        return new Date(date.getFullYear(), 5, 30, 23, 59, 59, 999); // 30 juin
      } else {
        return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999); // 31 décembre
      }

    case 'annually':
      // 31 décembre
      return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

    default:
      throw new Error('Invalid billing cycle');
  }
};

// ============================================
// TRIAL MANAGEMENT
// ============================================

/**
 * Termine la période d'essai et crée la première facture prorata
 */
export const endTrialPeriod = async (subscriptionId: string): Promise<void> => {
  try {
    // Récupérer l'abonnement avec le plan
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError) throw subError;
    const subscription = transformSubscription(subscriptionData);
    if (!subscription.plan) throw new Error('Plan not found');

    // Calculer le prorata jusqu'à la fin de la période
    const periodStartDate = subscription.trialEndDate || new Date();
    const prorata = calculateProrata(subscription.plan, periodStartDate);

    // Créer la facture prorata
    await createInvoice({
      subscriptionId: subscription.id,
      amount: prorata.amount,
      isProrata: true,
      prorataAmount: prorata.amount,
      daysCalculated: prorata.daysRemaining,
      periodStart: periodStartDate,
      periodEnd: prorata.periodEnd,
      dueDate: prorata.periodEnd
    });

    // Mettre à jour l'abonnement
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'pending_payment',
        current_period_start: periodStartDate.toISOString(),
        current_period_end: prorata.periodEnd.toISOString(),
        next_billing_date: prorata.periodEnd.toISOString(),
        amount_due: prorata.amount,
        is_prorata: true,
        prorata_days: prorata.daysRemaining
      })
      .eq('id', subscriptionId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error ending trial period:', error);
    throw error;
  }
};

// ============================================
// INVOICES
// ============================================

const createInvoice = async (data: {
  subscriptionId: string;
  amount: number;
  isProrata: boolean;
  prorataAmount?: number;
  daysCalculated?: number;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
}): Promise<SubscriptionInvoice> => {
  try {
    // Générer le numéro de facture
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) throw numberError;

    // Créer la facture
    const { data: invoiceData, error } = await supabase
      .from('subscription_invoices')
      .insert({
        subscription_id: data.subscriptionId,
        invoice_number: invoiceNumber,
        amount: data.amount,
        prorata_amount: data.prorataAmount,
        days_calculated: data.daysCalculated,
        is_prorata: data.isProrata,
        period_start: data.periodStart.toISOString(),
        period_end: data.periodEnd.toISOString(),
        due_date: data.dueDate.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return transformInvoice(invoiceData);
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const getSubscriptionInvoices = async (
  subscriptionId: string
): Promise<SubscriptionInvoice[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformInvoice);
  } catch (error) {
    console.error('Error fetching subscription invoices:', error);
    throw error;
  }
};

export const getPendingInvoices = async (
  organizationId: string
): Promise<SubscriptionInvoice[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        subscriptions!inner (organization_id)
      `)
      .eq('subscriptions.organization_id', organizationId)
      .eq('status', 'pending')
      .order('due_date');

    if (error) throw error;
    return (data || []).map(transformInvoice);
  } catch (error) {
    console.error('Error fetching pending invoices:', error);
    throw error;
  }
};

// ============================================
// PAYMENTS
// ============================================

export const validatePayment = async (
  data: ValidatePaymentData,
  validatedBy: string
): Promise<void> => {
  try {
    // Récupérer la facture
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        subscriptions (*)
      `)
      .eq('id', data.invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    const invoice = transformInvoice(invoiceData);

    // Créer le paiement
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        invoice_id: data.invoiceId,
        subscription_id: invoice.subscriptionId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate.toISOString(),
        validated_by: validatedBy,
        receipt_number: data.receiptNumber,
        transaction_reference: data.transactionReference,
        notes: data.notes
      });

    if (paymentError) throw paymentError;

    // Mettre à jour la facture
    const { error: updateInvoiceError } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: data.amount
      })
      .eq('id', data.invoiceId);

    if (updateInvoiceError) throw updateInvoiceError;

    // Activer l'abonnement
    const subscriptionData = invoiceData.subscriptions;
    await activateSubscription(subscriptionData.id);
  } catch (error) {
    console.error('Error validating payment:', error);
    throw error;
  }
};

const activateSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        suspended_at: null
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
};

// ============================================
// SUSPENSION & CANCELLATION
// ============================================

export const suspendSubscription = async (
  subscriptionId: string,
  reason?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error suspending subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (
  subscriptionId: string,
  reason?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// ============================================
// SETTINGS
// ============================================

export const getSubscriptionSettings = async (): Promise<SubscriptionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      trialDurationDays: data.trial_duration_days,
      autoSuspendAfterTrial: data.auto_suspend_after_trial,
      reminderDays: data.reminder_days,
      gracePeriodDays: data.grace_period_days,
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error fetching subscription settings:', error);
    throw error;
  }
};

// ============================================
// SUBSCRIPTION STATUS CHECK
// ============================================

/**
 * Vérifie si une organisation a accès au module Gestion Activité
 */
export const hasGestionActivityAccess = async (organizationId: string): Promise<boolean> => {
  try {
    const subscription = await getOrganizationSubscription(organizationId);

    if (!subscription) return false;

    // Accès autorisé pour les statuts trial et active
    return subscription.status === 'trial' || subscription.status === 'active';
  } catch (error) {
    console.error('Error checking gestion activity access:', error);
    return false;
  }
};
