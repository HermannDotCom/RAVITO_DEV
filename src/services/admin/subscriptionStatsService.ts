import { supabase } from '../../lib/supabase';
import type {
  SubscriptionStats,
  PlanDistribution,
  MonthlySubscriptionData,
  ValidatedPayment,
  SubscriptionStatus
} from '../../types/subscription';

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * Normalizes all active subscriptions to monthly revenue
 */
export async function calculateMRR(): Promise<number> {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        amount_due,
        plan:subscription_plans(billing_cycle)
      `)
      .eq('status', 'active');

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) return 0;

    // Calculate MRR by normalizing each subscription to monthly
    const mrr = subscriptions.reduce((total, sub) => {
      const amount = sub.amount_due || 0;
      const billingCycle = sub.plan?.billing_cycle;

      // Normalize to monthly
      let monthlyAmount = amount;
      if (billingCycle === 'semesterly') {
        monthlyAmount = amount / 6;
      } else if (billingCycle === 'annually') {
        monthlyAmount = amount / 12;
      }

      return total + monthlyAmount;
    }, 0);

    return mrr;
  } catch (error) {
    console.error('Error calculating MRR:', error);
    return 0;
  }
}

/**
 * Calculate trial to active conversion rate
 */
export async function getTrialConversionRate(): Promise<number> {
  try {
    // Get subscriptions that completed trial
    const { data: completedTrials, error: trialError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .not('trial_end_date', 'is', null)
      .lt('trial_end_date', new Date().toISOString());

    if (trialError) throw trialError;

    if (!completedTrials || completedTrials.length === 0) return 0;

    // Count how many became active
    const convertedCount = completedTrials.filter(
      (s) => s.status === 'active'
    ).length;

    const conversionRate = (convertedCount / completedTrials.length) * 100;
    return conversionRate;
  } catch (error) {
    console.error('Error calculating conversion rate:', error);
    return 0;
  }
}

/**
 * Get subscription distribution by plan
 */
export async function getSubscriptionsByPlan(): Promise<PlanDistribution[]> {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        amount_due,
        plan:subscription_plans(id, name)
      `)
      .in('status', ['active', 'trial']);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) return [];

    // Group by plan
    const planMap = new Map<string, { name: string; count: number; revenue: number }>();

    subscriptions.forEach((sub) => {
      const planId = sub.plan_id;
      const planName = sub.plan?.name || 'Unknown';
      const amount = sub.amount_due || 0;

      if (!planMap.has(planId)) {
        planMap.set(planId, { name: planName, count: 0, revenue: 0 });
      }

      const plan = planMap.get(planId)!;
      plan.count++;
      plan.revenue += amount;
    });

    const total = subscriptions.length;

    // Convert to array with percentages
    const distribution: PlanDistribution[] = Array.from(planMap.entries()).map(
      ([planId, data]) => ({
        planId,
        planName: data.name,
        count: data.count,
        percentage: (data.count / total) * 100,
        revenue: data.revenue,
      })
    );

    return distribution.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting subscriptions by plan:', error);
    return [];
  }
}

/**
 * Get monthly subscription evolution data
 */
export async function getSubscriptionEvolution(
  year: number
): Promise<MonthlySubscriptionData[]> {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get all subscriptions for the year
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, subscribed_at, cancelled_at, status')
      .gte('subscribed_at', startDate.toISOString())
      .lte('subscribed_at', endDate.toISOString());

    if (subError) throw subError;

    // Get all payments for the year
    const { data: payments, error: payError } = await supabase
      .from('subscription_payments')
      .select('amount, validation_date')
      .eq('status', 'validated')
      .gte('validation_date', startDate.toISOString())
      .lte('validation_date', endDate.toISOString());

    if (payError) throw payError;

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const monthlyData: MonthlySubscriptionData[] = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      // New subscriptions this month
      const newSubs = subscriptions?.filter((s) => {
        const subDate = new Date(s.subscribed_at);
        return subDate >= monthStart && subDate <= monthEnd;
      }).length || 0;

      // Cancelled subscriptions this month
      const cancelledSubs = subscriptions?.filter((s) => {
        if (!s.cancelled_at) return false;
        const cancelDate = new Date(s.cancelled_at);
        return cancelDate >= monthStart && cancelDate <= monthEnd;
      }).length || 0;

      // Revenue this month
      const monthRevenue = payments?.filter((p) => {
        const payDate = new Date(p.validation_date);
        return payDate >= monthStart && payDate <= monthEnd;
      }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Active at end of month (approximation)
      const activeAtEnd = subscriptions?.filter((s) => {
        const subDate = new Date(s.subscribed_at);
        const cancelDate = s.cancelled_at ? new Date(s.cancelled_at) : null;
        return subDate <= monthEnd && (!cancelDate || cancelDate > monthEnd);
      }).length || 0;

      monthlyData.push({
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        monthLabel: monthNames[month],
        newSubscriptions: newSubs,
        cancelledSubscriptions: cancelledSubs,
        revenue: monthRevenue,
        activeAtEndOfMonth: activeAtEnd,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error('Error getting subscription evolution:', error);
    return [];
  }
}

/**
 * Get recent validated payments
 */
export async function getRecentValidatedPayments(
  limit: number = 10
): Promise<ValidatedPayment[]> {
  try {
    const { data: payments, error } = await supabase
      .from('subscription_payments')
      .select(`
        id,
        amount,
        payment_method,
        validation_date,
        subscription:subscriptions(
          id,
          organization:organizations(name),
          plan:subscription_plans(name)
        )
      `)
      .eq('status', 'validated')
      .order('validation_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!payments || payments.length === 0) return [];

    return payments.map((payment) => ({
      id: payment.id,
      organizationName: payment.subscription?.organization?.name || 'Unknown',
      planName: payment.subscription?.plan?.name || 'Unknown',
      amount: payment.amount || 0,
      paymentMethod: payment.payment_method || 'unknown',
      validatedAt: new Date(payment.validation_date),
    }));
  } catch (error) {
    console.error('Error getting recent validated payments:', error);
    return [];
  }
}

/**
 * Get comprehensive subscription statistics
 */
export async function getSubscriptionStats(year: number): Promise<SubscriptionStats> {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get all subscriptions
    const { data: allSubscriptions, error: allSubError } = await supabase
      .from('subscriptions')
      .select('id, status, amount_due');

    if (allSubError) throw allSubError;

    // Count by status
    const activeSubscriptions = allSubscriptions?.filter((s) => s.status === 'active').length || 0;
    const trialSubscriptions = allSubscriptions?.filter((s) => s.status === 'trial').length || 0;
    const suspendedSubscriptions = allSubscriptions?.filter((s) => s.status === 'suspended').length || 0;
    const pendingPaymentSubscriptions = allSubscriptions?.filter((s) => s.status === 'pending_payment').length || 0;

    // Get validated payments for the year
    const { data: validatedPayments, error: payError } = await supabase
      .from('subscription_payments')
      .select('amount, validation_date')
      .eq('status', 'validated')
      .gte('validation_date', startDate.toISOString())
      .lte('validation_date', endDate.toISOString());

    if (payError) throw payError;

    const totalRevenue = validatedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Get pending payments
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('subscription_payments')
      .select('amount')
      .eq('status', 'pending_validation');

    if (pendingError) throw pendingError;

    const pendingPaymentsAmount = pendingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingPaymentsCount = pendingPayments?.length || 0;

    // Calculate MRR
    const mrr = await calculateMRR();
    const arr = mrr * 12;

    // Calculate average revenue per user
    const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

    // Calculate conversion rate
    const conversionRate = await getTrialConversionRate();

    // Calculate churn rate (simplified - cancelled this month / active at start of month)
    const currentMonth = new Date().getMonth();
    const monthStart = new Date(year, currentMonth, 1);
    
    const { data: cancelledThisMonth } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'cancelled')
      .gte('cancelled_at', monthStart.toISOString());

    const churnedCount = cancelledThisMonth?.length || 0;
    const churnRate = activeSubscriptions > 0 ? (churnedCount / (activeSubscriptions + churnedCount)) * 100 : 0;

    return {
      totalSubscriptions: allSubscriptions?.length || 0,
      activeSubscriptions,
      trialSubscriptions,
      suspendedSubscriptions,
      pendingPaymentSubscriptions,
      totalRevenue,
      monthlyRecurringRevenue: mrr,
      mrr,
      arr,
      averageRevenuePerUser,
      churnRate,
      conversionRate,
      pendingPaymentsAmount,
      pendingPaymentsCount,
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    // Return default values
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      trialSubscriptions: 0,
      suspendedSubscriptions: 0,
      pendingPaymentSubscriptions: 0,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      mrr: 0,
      arr: 0,
      averageRevenuePerUser: 0,
      churnRate: 0,
      conversionRate: 0,
      pendingPaymentsAmount: 0,
      pendingPaymentsCount: 0,
    };
  }
}
