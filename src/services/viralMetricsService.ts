import { supabase } from '../lib/supabase';
import type {
  ViralMetrics,
  MarketplaceHealthMetrics,
  LiveActivityFeed,
  ZoneNetworkBonus,
  SupplierCompetitionPool
} from '../types';

/**
 * VIRAL METRICS SERVICE
 * Tracks and calculates viral growth metrics, network effects, and social proof
 */

class ViralMetricsService {
  /**
   * Get live activity feed (last 30 minutes)
   */
  async getLiveActivityFeed(limit = 20): Promise<LiveActivityFeed[]> {
    try {
      const { data, error } = await supabase
        .from('live_activity_feed')
        .select('*')
        .gt('display_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ? data.map(a => this.mapToLiveActivityFeed(a)) : [];
    } catch (error) {
      console.error('Error fetching live activity feed:', error);
      return [];
    }
  }

  /**
   * Get current marketplace health score
   */
  async getMarketplaceHealth(): Promise<MarketplaceHealthMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_health_metrics')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapToMarketplaceHealth(data) : null;
    } catch (error) {
      console.error('Error fetching marketplace health:', error);
      return null;
    }
  }

  /**
   * Calculate and update marketplace health score
   */
  async calculateMarketplaceHealth(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_marketplace_health');

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating marketplace health:', error);
      return 0;
    }
  }

  /**
   * Get viral metrics for a period
   */
  async getViralMetrics(startDate: Date, endDate: Date): Promise<ViralMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('viral_metrics')
        .select('*')
        .gte('period_start', startDate.toISOString())
        .lte('period_end', endDate.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapToViralMetrics(data) : null;
    } catch (error) {
      console.error('Error fetching viral metrics:', error);
      return null;
    }
  }

  /**
   * Calculate viral metrics for a period
   */
  async calculateViralMetrics(startDate: Date, endDate: Date): Promise<void> {
    try {
      await supabase.rpc('calculate_viral_metrics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
    } catch (error) {
      console.error('Error calculating viral metrics:', error);
    }
  }

  /**
   * Record a social share
   */
  async recordSocialShare(
    userId: string,
    shareType: 'order_completion' | 'achievement' | 'referral',
    shareChannel: 'whatsapp' | 'instagram' | 'sms',
    contentType?: string,
    contentId?: string
  ): Promise<void> {
    try {
      await supabase.from('social_shares').insert({
        user_id: userId,
        share_type: shareType,
        share_channel: shareChannel,
        content_type: contentType,
        content_id: contentId,
        clicks_received: 0,
        conversions: 0
      });
    } catch (error) {
      console.error('Error recording social share:', error);
    }
  }

  /**
   * Get zone network bonuses
   */
  async getZoneNetworkBonuses(zoneId?: string): Promise<ZoneNetworkBonus[]> {
    try {
      let query = supabase
        .from('zone_network_bonuses')
        .select('*')
        .eq('is_active', true);

      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ? data.map(b => this.mapToZoneNetworkBonus(b)) : [];
    } catch (error) {
      console.error('Error fetching zone network bonuses:', error);
      return [];
    }
  }

  /**
   * Get active supplier competition pools
   */
  async getSupplierCompetitionPools(zoneId?: string): Promise<SupplierCompetitionPool[]> {
    try {
      let query = supabase
        .from('supplier_competition_pools')
        .select('*')
        .eq('status', 'active');

      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ? data.map(p => this.mapToSupplierCompetitionPool(p)) : [];
    } catch (error) {
      console.error('Error fetching competition pools:', error);
      return [];
    }
  }

  /**
   * Get order velocity (orders in last hour)
   */
  async getOrderVelocity(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching order velocity:', error);
      return 0;
    }
  }

  /**
   * Get trending product in a zone
   * Note: This would require a database view or edge function for efficient implementation
   */
  async getTrendingProduct(zoneId?: string): Promise<{ name: string; count: number } | null> {
    try {
      // For now, return null - would need proper implementation with Supabase query builder
      // TODO: Implement with proper Supabase query builder or edge function
      console.log('getTrendingProduct not yet implemented for zone:', zoneId);
      return null;
    } catch (error) {
      console.error('Error fetching trending product:', error);
      return null;
    }
  }

  /**
   * Generate order completion share message
   */
  generateOrderShareMessage(supplierName: string, referralCode: string): string {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    return encodeURIComponent(
      `Je viens de recevoir ma commande de ${supplierName} via DISTRI-NIGHT! 🚚⚡\n\n` +
      `Rejoins-moi avec le code ${referralCode} et reçois 30,000 FCFA gratuit: ${link}`
    );
  }

  /**
   * Generate achievement share message
   */
  generateAchievementShareMessage(userName: string, achievementName: string, achievementEmoji: string): string {
    return encodeURIComponent(
      `${userName} vient de débloquer "${achievementName}" ${achievementEmoji} sur DISTRI-NIGHT! 🎉\n\n` +
      `Rejoins la communauté: ${window.location.origin}`
    );
  }

  /**
   * Get growth statistics summary
   */
  async getGrowthSummary(): Promise<{
    totalUsers: number;
    newUsersThisMonth: number;
    viralCoefficient: number;
    averageReferralsPerUser: number;
    topReferralChannel: string;
  }> {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // New users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get latest viral metrics
      const { data: latestMetrics } = await supabase
        .from('viral_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        viralCoefficient: latestMetrics?.viral_coefficient || 0,
        averageReferralsPerUser: latestMetrics?.avg_referrals_per_user || 0,
        topReferralChannel: latestMetrics?.top_referral_channel || 'whatsapp'
      };
    } catch (error) {
      console.error('Error fetching growth summary:', error);
      return {
        totalUsers: 0,
        newUsersThisMonth: 0,
        viralCoefficient: 0,
        averageReferralsPerUser: 0,
        topReferralChannel: 'whatsapp'
      };
    }
  }

  // Mapping functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLiveActivityFeed(data: any): LiveActivityFeed {
    return {
      id: data.id,
      activityType: data.activity_type,
      zoneName: data.zone_name,
      anonymizedMessage: data.anonymized_message,
      metadata: data.metadata,
      displayUntil: new Date(data.display_until),
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToMarketplaceHealth(data: any): MarketplaceHealthMetrics {
    return {
      id: data.id,
      calculatedAt: new Date(data.calculated_at),
      healthScore: data.health_score,
      avgResponseTime: data.avg_response_time || 0,
      deliveryReliability: data.delivery_reliability || 0,
      customerSatisfaction: data.customer_satisfaction || 0,
      activeSuppliers: data.active_suppliers || 0,
      activeClients: data.active_clients || 0,
      totalOrders24h: data.total_orders_24h || 0,
      bonusTriggered: data.bonus_triggered || false,
      bonusPercentage: data.bonus_percentage || 0,
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToViralMetrics(data: any): ViralMetrics {
    return {
      id: data.id,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      totalNewUsers: data.total_new_users || 0,
      organicSignups: data.organic_signups || 0,
      referredSignups: data.referred_signups || 0,
      viralCoefficient: data.viral_coefficient || 0,
      conversionRate: data.conversion_rate || 0,
      avgReferralsPerUser: data.avg_referrals_per_user || 0,
      topReferralChannel: data.top_referral_channel,
      channelBreakdown: data.channel_breakdown,
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToZoneNetworkBonus(data: any): ZoneNetworkBonus {
    return {
      id: data.id,
      zoneId: data.zone_id,
      bonusType: data.bonus_type,
      thresholdMet: data.threshold_met,
      bonusPercentage: data.bonus_percentage,
      activeFrom: new Date(data.active_from),
      activeUntil: data.active_until ? new Date(data.active_until) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSupplierCompetitionPool(data: any): SupplierCompetitionPool {
    return {
      id: data.id,
      zoneId: data.zone_id,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      prizePool: data.prize_pool,
      winners: data.winners,
      status: data.status,
      distributedAt: data.distributed_at ? new Date(data.distributed_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const viralMetricsService = new ViralMetricsService();
