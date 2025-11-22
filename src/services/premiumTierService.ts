import { supabase } from '../lib/supabase';
import { PremiumTier, SupplierSubscription, ActiveSubscription, TierName, PaymentMethod } from '../types';

/**
 * Premium Tier Service
 * Manages premium tier subscriptions for suppliers
 */

// Get all available premium tiers
export async function getAllTiers(): Promise<PremiumTier[]> {
  const { data, error } = await supabase
    .from('premium_tiers')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching premium tiers:', error);
    throw error;
  }

  return (data || []).map(mapDatabaseTierToApp);
}

// Get a specific tier by name
export async function getTierByName(tierName: TierName): Promise<PremiumTier | null> {
  const { data, error } = await supabase
    .from('premium_tiers')
    .select('*')
    .eq('name', tierName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching tier:', error);
    return null;
  }

  return data ? mapDatabaseTierToApp(data) : null;
}

// Get active subscription for a supplier
export async function getActiveSubscription(supplierId: string): Promise<ActiveSubscription | null> {
  try {
    const { data, error } = await supabase.rpc('get_active_subscription', {
      supplier_uuid: supplierId
    });

    if (error) {
      console.error('Error fetching active subscription:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const sub = data[0];
    return {
      subscriptionId: sub.subscription_id,
      tierName: sub.tier_name,
      tierDisplayName: sub.tier_display_name,
      hasPriorityPlacement: sub.has_priority_placement,
      hasAdvancedAnalytics: sub.has_advanced_analytics,
      hasPrioritySupport: sub.has_priority_support,
      hasUnlimitedZones: sub.has_unlimited_zones,
      maxZones: sub.max_zones
    };
  } catch (err) {
    console.error('Error in getActiveSubscription:', err);
    return null;
  }
}

// Check if supplier has a specific feature
export async function hasTierFeature(supplierId: string, featureName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_tier_feature', {
      supplier_uuid: supplierId,
      feature_name: featureName
    });

    if (error) {
      console.error('Error checking tier feature:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Error in hasTierFeature:', err);
    return false;
  }
}

// Get supplier's subscription history
export async function getSubscriptionHistory(supplierId: string): Promise<SupplierSubscription[]> {
  const { data, error } = await supabase
    .from('supplier_subscriptions')
    .select(`
      *,
      tier:premium_tiers(*)
    `)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscription history:', error);
    throw error;
  }

  return (data || []).map(mapDatabaseSubscriptionToApp);
}

// Create or upgrade subscription
export async function createOrUpgradeSubscription(
  supplierId: string,
  tierName: TierName,
  paymentMethod?: PaymentMethod
): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'Non authentifié' };
    }

    // Verify the user is a supplier
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', supplierId)
      .single();

    if (!profile || profile.role !== 'supplier' || !profile.is_approved) {
      return { success: false, error: 'Seuls les fournisseurs approuvés peuvent souscrire' };
    }

    // Get the target tier
    const { data: tier } = await supabase
      .from('premium_tiers')
      .select('id')
      .eq('name', tierName)
      .single();

    if (!tier) {
      return { success: false, error: 'Tier introuvable' };
    }

    // Deactivate current subscriptions (if any)
    await supabase
      .from('supplier_subscriptions')
      .update({ 
        status: 'inactive',
        ends_at: new Date().toISOString()
      })
      .eq('supplier_id', supplierId)
      .eq('status', 'active');

    // Create new subscription
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { data: subscription, error: createError } = await supabase
      .from('supplier_subscriptions')
      .insert({
        supplier_id: supplierId,
        tier_id: tier.id,
        status: tierName === 'basic' ? 'active' : 'pending',
        starts_at: new Date().toISOString(),
        activated_at: tierName === 'basic' ? new Date().toISOString() : null,
        payment_method: paymentMethod,
        next_payment_date: tierName === 'basic' ? null : nextMonth.toISOString(),
        auto_renew: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating subscription:', createError);
      return { success: false, error: createError.message };
    }

    return { success: true, subscriptionId: subscription.id };
  } catch (err: any) {
    console.error('Error in createOrUpgradeSubscription:', err);
    return { success: false, error: err.message || 'Erreur lors de la création de l\'abonnement' };
  }
}

// Activate a pending subscription (admin action after payment)
export async function activateSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'Non authentifié' };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' };
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { error } = await supabase
      .from('supplier_subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        last_payment_date: new Date().toISOString(),
        next_payment_date: nextMonth.toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error activating subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in activateSubscription:', err);
    return { success: false, error: err.message || 'Erreur lors de l\'activation' };
  }
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('supplier_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in cancelSubscription:', err);
    return { success: false, error: err.message || 'Erreur lors de l\'annulation' };
  }
}

// Get all subscriptions (admin view)
export async function getAllSubscriptions(): Promise<SupplierSubscription[]> {
  const { data, error } = await supabase
    .from('supplier_subscriptions')
    .select(`
      *,
      supplier:profiles!supplier_id(name, business_name, email),
      tier:premium_tiers(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }

  return (data || []).map(mapDatabaseSubscriptionToApp);
}

// Get subscription statistics (admin view)
export async function getSubscriptionStats(): Promise<{
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  byTier: { [key: string]: number };
}> {
  const { data, error } = await supabase
    .from('supplier_subscriptions')
    .select(`
      id,
      status,
      tier:premium_tiers(name, price_monthly)
    `)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching subscription stats:', error);
    throw error;
  }

  const stats = {
    totalSubscriptions: data?.length || 0,
    activeSubscriptions: data?.length || 0,
    monthlyRecurringRevenue: 0,
    byTier: {
      basic: 0,
      silver: 0,
      gold: 0
    }
  };

  data?.forEach((sub: Record<string, unknown>) => {
    const tier = sub.tier as Record<string, unknown> | undefined;
    const tierName = tier?.name as string || 'basic';
    const tierPrice = tier?.price_monthly as number || 0;
    stats.monthlyRecurringRevenue += tierPrice;
    stats.byTier[tierName] = (stats.byTier[tierName] || 0) + 1;
  });

  return stats;
}

// Helper function to map database tier to app model
function mapDatabaseTierToApp(dbTier: Record<string, unknown>): PremiumTier {
  return {
    id: dbTier.id as string,
    name: dbTier.name as TierName,
    displayName: dbTier.display_name as string,
    priceMonthly: dbTier.price_monthly as number,
    features: dbTier.features as { description: string; features: string[] },
    maxZones: dbTier.max_zones as number | null,
    hasPriorityPlacement: dbTier.has_priority_placement as boolean,
    hasAdvancedAnalytics: dbTier.has_advanced_analytics as boolean,
    hasPrioritySupport: dbTier.has_priority_support as boolean,
    hasUnlimitedZones: dbTier.has_unlimited_zones as boolean,
    displayOrder: dbTier.display_order as number,
    isActive: dbTier.is_active as boolean,
    createdAt: new Date(dbTier.created_at as string),
    updatedAt: new Date(dbTier.updated_at as string)
  };
}

// Helper function to map database subscription to app model
function mapDatabaseSubscriptionToApp(dbSub: Record<string, unknown>): SupplierSubscription {
  return {
    id: dbSub.id as string,
    supplierId: dbSub.supplier_id as string,
    tierId: dbSub.tier_id as string,
    status: dbSub.status as 'active' | 'inactive' | 'pending' | 'cancelled' | 'expired',
    startsAt: new Date(dbSub.starts_at as string),
    endsAt: dbSub.ends_at ? new Date(dbSub.ends_at as string) : undefined,
    autoRenew: dbSub.auto_renew as boolean,
    paymentMethod: dbSub.payment_method as PaymentMethod | undefined,
    lastPaymentDate: dbSub.last_payment_date ? new Date(dbSub.last_payment_date as string) : undefined,
    nextPaymentDate: dbSub.next_payment_date ? new Date(dbSub.next_payment_date as string) : undefined,
    totalPaid: dbSub.total_paid as number,
    createdAt: new Date(dbSub.created_at as string),
    updatedAt: new Date(dbSub.updated_at as string),
    activatedAt: dbSub.activated_at ? new Date(dbSub.activated_at as string) : undefined,
    cancelledAt: dbSub.cancelled_at ? new Date(dbSub.cancelled_at as string) : undefined,
    cancellationReason: dbSub.cancellation_reason as string | undefined
  };
}
