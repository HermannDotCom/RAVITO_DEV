/**
 * Subscription Management Service
 * 
 * Handles subscription tier management and feature access control
 */

import { supabase } from '../lib/supabase';
import type { 
  SubscriptionTier, 
  SupplierSubscription,
  SubscriptionTierName,
  SubscriptionUpgradeRequest 
} from '../types/intelligence';

export class SubscriptionService {
  /**
   * Get all available subscription tiers
   */
  static async getAllTiers(): Promise<SubscriptionTier[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapTierFromDb);
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      throw error;
    }
  }

  /**
   * Get a specific subscription tier by name
   */
  static async getTierByName(tierName: SubscriptionTierName): Promise<SubscriptionTier | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('tier_name', tierName)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapTierFromDb(data);
    } catch (error) {
      console.error('Error fetching subscription tier:', error);
      return null;
    }
  }

  /**
   * Get supplier's current subscription
   */
  static async getSupplierSubscription(supplierId: string): Promise<SupplierSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('supplier_subscriptions')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapSubscriptionFromDb(data);
    } catch (error) {
      console.error('Error fetching supplier subscription:', error);
      return null;
    }
  }

  /**
   * Get supplier's subscription with tier details
   */
  static async getSupplierSubscriptionWithTier(supplierId: string) {
    try {
      const { data, error } = await supabase
        .from('supplier_subscriptions')
        .select('*, subscription_tiers(*)')
        .eq('supplier_id', supplierId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Return FREE tier as default
        const freeTier = await this.getTierByName('FREE');
        return {
          subscription: null,
          tier: freeTier
        };
      }

      return {
        subscription: this.mapSubscriptionFromDb(data),
        tier: this.mapTierFromDb(data.subscription_tiers)
      };
    } catch (error) {
      console.error('Error fetching supplier subscription with tier:', error);
      return null;
    }
  }

  /**
   * Create or upgrade a subscription
   */
  static async upgradeSubscription(
    supplierId: string,
    request: SubscriptionUpgradeRequest
  ): Promise<SupplierSubscription> {
    try {
      // Get the tier
      const tier = await this.getTierByName(request.tierName);
      if (!tier) {
        throw new Error(`Tier ${request.tierName} not found`);
      }

      // Check if supplier has an existing subscription
      const existing = await this.getSupplierSubscription(supplierId);

      if (existing) {
        // Cancel existing subscription
        await this.cancelSubscription(supplierId, 'Upgraded to new tier');
      }

      // Calculate expiry date (1 month from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Calculate next billing date
      const nextBillingDate = new Date(expiresAt);

      // Create new subscription
      const { data, error } = await supabase
        .from('supplier_subscriptions')
        .insert({
          supplier_id: supplierId,
          tier_id: tier.id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          auto_renew: request.autoRenew ?? true,
          payment_method: request.paymentMethod,
          last_payment_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapSubscriptionFromDb(data);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    supplierId: string,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('supplier_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('supplier_id', supplierId)
        .eq('status', 'active');

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check if supplier has access to a specific feature
   */
  static async hasFeatureAccess(
    supplierId: string,
    featureName: string
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .rpc('has_feature_access', {
          p_supplier_id: supplierId,
          p_feature: featureName
        });

      return data === true;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get feature access map for a supplier
   */
  static async getFeatureAccessMap(supplierId: string) {
    try {
      const subData = await this.getSupplierSubscriptionWithTier(supplierId);
      const tierName = subData?.tier?.tierName || 'FREE';

      return {
        basicDashboard: true,
        advancedAnalytics: ['SILVER', 'GOLD', 'PLATINUM'].includes(tierName),
        weeklyReports: ['SILVER', 'GOLD', 'PLATINUM'].includes(tierName),
        mlPredictions: ['GOLD', 'PLATINUM'].includes(tierName),
        priceOptimization: ['GOLD', 'PLATINUM'].includes(tierName),
        churnRiskAlerts: ['GOLD', 'PLATINUM'].includes(tierName),
        competitorBenchmarking: ['SILVER', 'GOLD', 'PLATINUM'].includes(tierName),
        apiAccess: tierName === 'PLATINUM',
        dedicatedManager: ['GOLD', 'PLATINUM'].includes(tierName),
        customReports: ['GOLD', 'PLATINUM'].includes(tierName)
      };
    } catch (error) {
      console.error('Error getting feature access map:', error);
      return {
        basicDashboard: true,
        advancedAnalytics: false,
        weeklyReports: false,
        mlPredictions: false,
        priceOptimization: false,
        churnRiskAlerts: false,
        competitorBenchmarking: false,
        apiAccess: false,
        dedicatedManager: false,
        customReports: false
      };
    }
  }

  /**
   * Process subscription renewals (typically called by a scheduled job)
   */
  static async processRenewals(): Promise<void> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get subscriptions expiring today with auto-renew enabled
      const { data: expiring, error } = await supabase
        .from('supplier_subscriptions')
        .select('*, subscription_tiers(*)')
        .eq('status', 'active')
        .eq('auto_renew', true)
        .lte('expires_at', todayStr);

      if (error) throw error;

      for (const sub of expiring || []) {
        try {
          // In a real implementation, this would process payment
          // For now, just extend the subscription
          const newExpiresAt = new Date(sub.expires_at);
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

          const newNextBillingDate = new Date(newExpiresAt);

          await supabase
            .from('supplier_subscriptions')
            .update({
              expires_at: newExpiresAt.toISOString(),
              next_billing_date: newNextBillingDate.toISOString(),
              last_payment_at: today.toISOString(),
              updated_at: today.toISOString()
            })
            .eq('id', sub.id);

          console.log(`Renewed subscription for supplier ${sub.supplier_id}`);
        } catch (renewError) {
          console.error(`Error renewing subscription ${sub.id}:`, renewError);
        }
      }
    } catch (error) {
      console.error('Error processing renewals:', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  static async getSubscriptionStats() {
    try {
      const { data, error } = await supabase
        .from('supplier_subscriptions')
        .select('tier_id, status, subscription_tiers(tier_name, monthly_price)')
        .eq('status', 'active');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byTier: {} as Record<string, number>,
        monthlyRecurringRevenue: 0
      };

      data?.forEach(sub => {
        const tierName = sub.subscription_tiers?.tier_name || 'FREE';
        stats.byTier[tierName] = (stats.byTier[tierName] || 0) + 1;
        stats.monthlyRecurringRevenue += sub.subscription_tiers?.monthly_price || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return null;
    }
  }

  /**
   * Helper: Map database row to TypeScript type
   */
  private static mapTierFromDb(data: any): SubscriptionTier {
    return {
      id: data.id,
      tierName: data.tier_name,
      monthlyPrice: data.monthly_price,
      features: data.features || [],
      limits: data.limits || {},
      isActive: data.is_active,
      displayOrder: data.display_order,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Helper: Map subscription from database
   */
  private static mapSubscriptionFromDb(data: any): SupplierSubscription {
    return {
      id: data.id,
      supplierId: data.supplier_id,
      tierId: data.tier_id,
      status: data.status,
      startedAt: new Date(data.started_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
      cancellationReason: data.cancellation_reason,
      autoRenew: data.auto_renew,
      paymentMethod: data.payment_method,
      lastPaymentAt: data.last_payment_at ? new Date(data.last_payment_at) : undefined,
      nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
