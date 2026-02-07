import { supabase } from '../../lib/supabase';
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPayment,
  SubscriptionSettings,
  UpdatePlanData,
  ValidatePaymentData,
  SubscriptionStats,
  SubscriptionWithDetails,
  InvoiceWithDetails,
  PaymentMethod,
  PaymentClaimStatus
} from '../../types/subscription';

// ============================================
// ADMIN - PLANS MANAGEMENT
// ============================================

/**
 * Obtenir tous les plans (actifs et inactifs)
 */
export const getAllPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      price: parseFloat(d.price),
      billingCycle: d.billing_cycle,
      daysInCycle: d.days_in_cycle,
      trialDays: d.trial_days,
      isActive: d.is_active,
      displayOrder: d.display_order,
      features: d.features || [],
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching all plans:', error);
    throw error;
  }
};

/**
 * Mettre à jour un plan
 */
export const updatePlan = async (
  planId: string,
  data: UpdatePlanData
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.features !== undefined) updateData.features = data.features;

    const { error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', planId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

// ============================================
// ADMIN - SUBSCRIPTIONS MANAGEMENT
// ============================================

/**
 * Obtenir toutes les souscriptions avec détails
 */
export const getAllSubscriptions = async (
  status?: string
): Promise<SubscriptionWithDetails[]> => {
  try {
    let query = supabase
      .from('subscriptions')
      .select(`
        id,
        organization_id,
        plan_id,
        status,
        is_first_subscription,
        trial_start_date,
        trial_end_date,
        current_period_start,
        current_period_end,
        next_billing_date,
        amount_due,
        is_prorata,
        prorata_days,
        subscribed_at,
        activated_at,
        suspended_at,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at,
        subscription_plans (*),
        organizations (id, name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(d => {
      const subscription: Subscription = {
        id: d.id,
        organizationId: d.organization_id,
        planId: d.plan_id,
        status: d.status,
        isFirstSubscription: d.is_first_subscription,
        trialStartDate: d.trial_start_date ? new Date(d.trial_start_date) : null,
        trialEndDate: d.trial_end_date ? new Date(d.trial_end_date) : null,
        currentPeriodStart: d.current_period_start ? new Date(d.current_period_start) : null,
        currentPeriodEnd: d.current_period_end ? new Date(d.current_period_end) : null,
        nextBillingDate: d.next_billing_date ? new Date(d.next_billing_date) : null,
        amountDue: parseFloat(d.amount_due || 0),
        isProrata: d.is_prorata,
        prorataDays: d.prorata_days,
        subscribedAt: new Date(d.subscribed_at),
        activatedAt: d.activated_at ? new Date(d.activated_at) : null,
        suspendedAt: d.suspended_at ? new Date(d.suspended_at) : null,
        cancelledAt: d.cancelled_at ? new Date(d.cancelled_at) : null,
        cancellationReason: d.cancellation_reason,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      };

      const daysLeftInTrial = subscription.status === 'trial' && subscription.trialEndDate
        ? Math.ceil((subscription.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const daysUntilDue = subscription.nextBillingDate
        ? Math.ceil((subscription.nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...subscription,
        plan: {
          id: d.subscription_plans.id,
          name: d.subscription_plans.name,
          description: d.subscription_plans.description,
          price: parseFloat(d.subscription_plans.price),
          billingCycle: d.subscription_plans.billing_cycle,
          daysInCycle: d.subscription_plans.days_in_cycle,
          trialDays: d.subscription_plans.trial_days,
          isActive: d.subscription_plans.is_active,
          displayOrder: d.subscription_plans.display_order,
          features: d.subscription_plans.features || [],
          createdAt: new Date(d.subscription_plans.created_at),
          updatedAt: new Date(d.subscription_plans.updated_at)
        },
        organizationName: d.organizations?.name || 'Organisation inconnue',
        daysLeftInTrial,
        daysUntilDue,
        hasUnpaidInvoices: subscription.status === 'pending_payment'
      };
    });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques des abonnements
 */
export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        status,
        amount_due,
        subscription_plans (price)
      `);

    if (error) throw error;

    const stats: SubscriptionStats = {
      totalSubscriptions: data?.length || 0,
      activeSubscriptions: data?.filter(s => s.status === 'active').length || 0,
      trialSubscriptions: data?.filter(s => s.status === 'trial').length || 0,
      suspendedSubscriptions: data?.filter(s => s.status === 'suspended').length || 0,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      churnRate: 0
    };

    // Calculer les revenus
    const activeAndPendingSubs = data?.filter(s => s.status === 'active' || s.status === 'pending_payment') || [];

    stats.monthlyRecurringRevenue = activeAndPendingSubs.reduce((sum, sub) => {
      const price = parseFloat(sub.subscription_plans?.price || 0);
      return sum + price;
    }, 0);

    stats.totalRevenue = stats.monthlyRecurringRevenue;
    stats.averageRevenuePerUser = stats.activeSubscriptions > 0
      ? stats.monthlyRecurringRevenue / stats.activeSubscriptions
      : 0;

    // Calculer le taux de churn (simplifié)
    const cancelledCount = data?.filter(s => s.status === 'cancelled').length || 0;
    stats.churnRate = stats.totalSubscriptions > 0
      ? (cancelledCount / stats.totalSubscriptions) * 100
      : 0;

    return stats;
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    throw error;
  }
};

// ============================================
// ADMIN - INVOICES MANAGEMENT
// ============================================

/**
 * Obtenir toutes les factures avec détails
 */
export const getAllInvoices = async (
  status?: string
): Promise<InvoiceWithDetails[]> => {
  try {
    let query = supabase
      .from('subscription_invoices')
      .select(`
        id,
        subscription_id,
        organization_id,
        invoice_number,
        amount,
        amount_due,
        amount_paid,
        prorata_amount,
        days_calculated,
        is_prorata,
        period_start,
        period_end,
        due_date,
        status,
        paid_at,
        paid_amount,
        transaction_reference,
        payment_method_id,
        notes,
        created_at,
        updated_at,
        subscriptions!subscription_invoices_subscription_id_fkey (
          id,
          organization_id,
          plan_id,
          organizations!subscriptions_organization_id_fkey (
            name
          ),
          subscription_plans!subscriptions_plan_id_fkey (
            id,
            name,
            description,
            price,
            billing_cycle,
            days_in_cycle,
            trial_days,
            is_active,
            display_order,
            features,
            created_at,
            updated_at,
            free_months
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all invoices:', error);
      throw error;
    }

    const invoiceIds = (data || []).map(d => d.id);
    let paymentsData: any[] = [];

    if (invoiceIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        paymentsData = payments || [];
      }
    }

    return (data || []).map((d: any) => {
      const invoice: SubscriptionInvoice = {
        id: d.id,
        subscriptionId: d.subscription_id,
        organizationId: d.organization_id,
        invoiceNumber: d.invoice_number,
        amount: parseFloat(d.amount),
        amountDue: parseFloat(d.amount_due || d.amount),
        amountPaid: parseFloat(d.amount_paid || 0),
        prorataAmount: d.prorata_amount ? parseFloat(d.prorata_amount) : null,
        daysCalculated: d.days_calculated,
        isProrata: d.is_prorata || false,
        periodStart: new Date(d.period_start),
        periodEnd: new Date(d.period_end),
        dueDate: new Date(d.due_date),
        status: d.status,
        paidAt: d.paid_at ? new Date(d.paid_at) : null,
        paidAmount: d.paid_amount ? parseFloat(d.paid_amount) : null,
        transactionReference: d.transaction_reference,
        paymentMethodId: d.payment_method_id,
        notes: d.notes,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      };

      const invoicePayments = paymentsData.filter(p => p.invoice_id === d.id);
      const payments: SubscriptionPayment[] = invoicePayments.map((p: any) => ({
        id: p.id,
        invoiceId: p.invoice_id,
        subscriptionId: p.subscription_id,
        amount: parseFloat(p.amount),
        paymentMethod: p.payment_method,
        paymentDate: new Date(p.payment_date),
        status: p.status || 'validated',
        validatedBy: p.validated_by,
        validationDate: p.validation_date ? new Date(p.validation_date) : null,
        rejectionReason: p.rejection_reason || null,
        receiptNumber: p.receipt_number,
        transactionReference: p.transaction_reference,
        notes: p.notes,
        createdAt: new Date(p.created_at)
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || parseFloat(d.amount_paid || 0);
      const remainingAmount = Math.max(0, invoice.amountDue - totalPaid);

      const sub = d.subscriptions;
      const plan = sub?.subscription_plans;

      return {
        ...invoice,
        subscription: {
          id: sub?.id || '',
          organizationId: sub?.organization_id || '',
          organizationName: sub?.organizations?.name || 'Organisation inconnue',
          plan: plan ? {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: parseFloat(plan.price),
            billingCycle: plan.billing_cycle,
            daysInCycle: plan.days_in_cycle,
            trialDays: plan.trial_days,
            isActive: plan.is_active,
            displayOrder: plan.display_order,
            features: plan.features || [],
            freeMonths: plan.free_months || 0,
            createdAt: new Date(plan.created_at),
            updatedAt: new Date(plan.updated_at)
          } : {
            id: '',
            name: 'Plan inconnu',
            description: '',
            price: 0,
            billingCycle: 'monthly' as const,
            daysInCycle: 30,
            trialDays: 0,
            isActive: false,
            displayOrder: 0,
            features: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        payments,
        totalPaid,
        remainingAmount
      };
    });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    throw error;
  }
};

/**
 * Valider un paiement (fonction Admin)
 */
export const adminValidatePayment = async (
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

    // Créer le paiement
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        invoice_id: data.invoiceId,
        subscription_id: invoiceData.subscriptions.id,
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
    const { error: updateSubError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        suspended_at: null
      })
      .eq('id', invoiceData.subscriptions.id);

    if (updateSubError) throw updateSubError;
  } catch (error) {
    console.error('Error validating payment:', error);
    throw error;
  }
};

/**
 * Suspendre un abonnement manuellement
 */
export const adminSuspendSubscription = async (
  subscriptionId: string,
  reason: string
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

/**
 * Réactiver un abonnement
 */
export const adminReactivateSubscription = async (
  subscriptionId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        suspended_at: null,
        cancellation_reason: null
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
};

// ============================================
// ADMIN - SETTINGS MANAGEMENT
// ============================================

/**
 * Obtenir les paramètres d'abonnement
 */
export const getSubscriptionSettings = async (): Promise<SubscriptionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default values
        return {
          id: '',
          trialDurationDays: 30,
          autoSuspendAfterTrial: true,
          reminderDays: {
            monthly: [15, 7, 2],
            semesterly: [60, 30, 15],
            annually: [90, 60, 30, 15]
          },
          gracePeriodDays: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: null
        };
      }
      throw error;
    }

    return {
      id: data.id,
      trialDurationDays: data.trial_duration_days,
      autoSuspendAfterTrial: data.auto_suspend_after_trial,
      reminderDays: data.reminder_days,
      gracePeriodDays: data.grace_period_days,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by
    };
  } catch (error) {
    console.error('Error fetching subscription settings:', error);
    throw error;
  }
};

/**
 * Mettre à jour les paramètres d'abonnement
 */
export const updateSubscriptionSettings = async (
  settings: Partial<SubscriptionSettings>,
  updatedBy: string
): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    };

    if (settings.trialDurationDays !== undefined) {
      updateData.trial_duration_days = settings.trialDurationDays;
    }
    if (settings.autoSuspendAfterTrial !== undefined) {
      updateData.auto_suspend_after_trial = settings.autoSuspendAfterTrial;
    }
    if (settings.reminderDays !== undefined) {
      updateData.reminder_days = settings.reminderDays;
    }
    if (settings.gracePeriodDays !== undefined) {
      updateData.grace_period_days = settings.gracePeriodDays;
    }

    // Mettre à jour la première ligne (singleton)
    const { error } = await supabase
      .from('subscription_settings')
      .update(updateData)
      .limit(1);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    throw error;
  }
};

// ============================================
// ADMIN - PAYMENT CLAIMS MANAGEMENT
// ============================================

export interface PendingPaymentClaim {
  id: string;
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  transactionReference: string | null;
  status: PaymentClaimStatus;
  notes: string | null;
  createdAt: Date;
  invoiceNumber: string;
  organizationName: string;
  organizationId: string;
}

export const getPendingPaymentClaims = async (): Promise<PendingPaymentClaim[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select(`
        id,
        invoice_id,
        subscription_id,
        amount,
        payment_method,
        payment_date,
        transaction_reference,
        status,
        notes,
        created_at,
        subscription_invoices!subscription_payments_invoice_id_fkey (
          invoice_number,
          amount,
          amount_due
        ),
        subscriptions!subscription_payments_subscription_id_fkey (
          organization_id,
          organizations!subscriptions_organization_id_fkey (
            name
          )
        )
      `)
      .eq('status', 'pending_validation')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.id,
      invoiceId: d.invoice_id,
      subscriptionId: d.subscription_id,
      amount: parseFloat(d.amount),
      paymentMethod: d.payment_method,
      paymentDate: new Date(d.payment_date),
      transactionReference: d.transaction_reference,
      status: d.status,
      notes: d.notes,
      createdAt: new Date(d.created_at),
      invoiceNumber: d.subscription_invoices?.invoice_number || '',
      organizationName: d.subscriptions?.organizations?.name || 'Organisation inconnue',
      organizationId: d.subscriptions?.organization_id || ''
    }));
  } catch (error) {
    console.error('Error fetching pending payment claims:', error);
    throw error;
  }
};

export const validatePaymentClaim = async (
  paymentId: string,
  adminUserId: string
): Promise<void> => {
  try {
    const { data: payment, error: fetchError } = await supabase
      .from('subscription_payments')
      .select('id, invoice_id, subscription_id, amount')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updatePaymentError } = await supabase
      .from('subscription_payments')
      .update({
        status: 'validated',
        validated_by: adminUserId,
        validation_date: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updatePaymentError) throw updatePaymentError;

    const { error: updateInvoiceError } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: payment.amount,
        amount_paid: payment.amount
      })
      .eq('id', payment.invoice_id);

    if (updateInvoiceError) throw updateInvoiceError;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status, organization_id')
      .eq('id', payment.subscription_id)
      .maybeSingle();

    if (subscription && (subscription.status === 'pending_payment' || subscription.status === 'trial' || subscription.status === 'suspended')) {
      const { error: updateSubError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          suspended_at: null
        })
        .eq('id', payment.subscription_id);

      if (updateSubError) throw updateSubError;
    }

    if (subscription) {
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', subscription.organization_id)
        .eq('status', 'active');

      for (const member of members || []) {
        await supabase.from('notifications').insert({
          user_id: member.user_id,
          type: 'subscription_reminder',
          title: 'Paiement valide',
          message: 'Votre paiement a ete valide ! Merci.',
          priority: 'normal'
        });
      }
    }
  } catch (error) {
    console.error('Error validating payment claim:', error);
    throw error;
  }
};

export const rejectPaymentClaim = async (
  paymentId: string,
  rejectionReason: string
): Promise<void> => {
  try {
    const { data: payment, error: fetchError } = await supabase
      .from('subscription_payments')
      .select('id, invoice_id, subscription_id')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updatePaymentError } = await supabase
      .from('subscription_payments')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason
      })
      .eq('id', paymentId);

    if (updatePaymentError) throw updatePaymentError;

    const { error: updateInvoiceError } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'pending'
      })
      .eq('id', payment.invoice_id);

    if (updateInvoiceError) throw updateInvoiceError;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('organization_id')
      .eq('id', payment.subscription_id)
      .maybeSingle();

    if (subscription) {
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', subscription.organization_id)
        .eq('status', 'active');

      for (const member of members || []) {
        await supabase.from('notifications').insert({
          user_id: member.user_id,
          type: 'subscription_reminder',
          title: 'Paiement non valide',
          message: `Votre paiement n'a pas pu etre valide. Motif : ${rejectionReason}. Veuillez nous contacter.`,
          priority: 'high'
        });
      }
    }
  } catch (error) {
    console.error('Error rejecting payment claim:', error);
    throw error;
  }
};
