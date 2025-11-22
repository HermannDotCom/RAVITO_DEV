import { supabase } from '../lib/supabase';
import type {
  UserLevel,
  UserProgression,
  Achievement,
  UserAchievement,
  Leaderboard,
  UserVIPStatus,
  VIPTier,
  UserRole
} from '../types';

/**
 * GAMIFICATION SERVICE
 * Manages user progression, achievements, leaderboards, and VIP tiers
 */

class GamificationService {
  /**
   * Get user's current progression
   */
  async getUserProgression(userId: string): Promise<UserProgression | null> {
    try {
      const { data, error } = await supabase
        .from('user_progression')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no progression exists, return default
      if (!data) {
        return {
          id: '',
          userId,
          role: 'client',
          currentLevel: 1,
          totalOrders: 0,
          totalCompletedOffers: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return this.mapToUserProgression(data);
    } catch (error) {
      console.error('Error fetching user progression:', error);
      return null;
    }
  }

  /**
   * Get level details for a specific level and role
   */
  async getLevel(role: UserRole, levelNumber: number): Promise<UserLevel | null> {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('role', role)
        .eq('level_number', levelNumber)
        .single();

      if (error) throw error;
      return data ? this.mapToUserLevel(data) : null;
    } catch (error) {
      console.error('Error fetching level:', error);
      return null;
    }
  }

  /**
   * Get all levels for a role
   */
  async getLevelsForRole(role: UserRole): Promise<UserLevel[]> {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('role', role)
        .order('level_number', { ascending: true });

      if (error) throw error;
      return data ? data.map(l => this.mapToUserLevel(l)) : [];
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }

  /**
   * Get user's VIP status
   */
  async getUserVIPStatus(userId: string): Promise<{ status: UserVIPStatus | null; tier: VIPTier | null }> {
    try {
      const { data, error } = await supabase
        .from('user_vip_status')
        .select(`
          *,
          current_tier:vip_tiers(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default VIP status
        const { data: newStatus, error: insertError } = await supabase
          .from('user_vip_status')
          .insert({
            user_id: userId,
            tier_level: 1,
            successful_referrals: 0
          })
          .select(`
            *,
            current_tier:vip_tiers(*)
          `)
          .single();

        if (insertError) throw insertError;
        
        return {
          status: newStatus ? this.mapToUserVIPStatus(newStatus) : null,
          tier: newStatus?.current_tier ? this.mapToVIPTier(newStatus.current_tier) : null
        };
      }

      return {
        status: this.mapToUserVIPStatus(data),
        tier: data.current_tier ? this.mapToVIPTier(data.current_tier) : null
      };
    } catch (error) {
      console.error('Error fetching VIP status:', error);
      return { status: null, tier: null };
    }
  }

  /**
   * Get all VIP tiers
   */
  async getVIPTiers(): Promise<VIPTier[]> {
    try {
      const { data, error } = await supabase
        .from('vip_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (error) throw error;
      return data ? data.map(t => this.mapToVIPTier(t)) : [];
    } catch (error) {
      console.error('Error fetching VIP tiers:', error);
      return [];
    }
  }

  /**
   * Get all available achievements
   */
  async getAchievements(role?: UserRole): Promise<Achievement[]> {
    try {
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      if (role) {
        query = query.or(`role.eq.${role},role.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ? data.map(a => this.mapToAchievement(a)) : [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string): Promise<Array<UserAchievement & { achievement: Achievement }>> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      
      return data ? data.map(ua => ({
        ...this.mapToUserAchievement(ua),
        achievement: this.mapToAchievement(ua.achievement)
      })) : [];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(userId: string, achievementKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_achievement_unlock', {
        p_user_id: userId,
        p_achievement_key: achievementKey
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }

  /**
   * Record achievement share
   */
  async recordAchievementShare(userId: string, achievementId: string): Promise<void> {
    try {
      // First get current count
      const { data: current } = await supabase
        .from('user_achievements')
        .select('shared_count')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (current) {
        await supabase
          .from('user_achievements')
          .update({
            shared_count: current.shared_count + 1,
            last_shared_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('achievement_id', achievementId);
      }
    } catch (error) {
      console.error('Error recording achievement share:', error);
    }
  }

  /**
   * Get leaderboard for a category
   */
  async getLeaderboard(category: string, role?: UserRole): Promise<Leaderboard | null> {
    try {
      let query = supabase
        .from('leaderboards')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(1);

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data ? this.mapToLeaderboard(data) : null;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return null;
    }
  }

  /**
   * Get top referrers leaderboard
   */
  async getTopReferrersLeaderboard(limit = 10): Promise<Array<{
    userId: string;
    name: string;
    totalReferrals: number;
    convertedReferrals: number;
    rank: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_vip_status')
        .select(`
          user_id,
          successful_referrals,
          profiles!inner(name)
        `)
        .order('successful_referrals', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data ? data.map((item, index) => ({
        userId: item.user_id,
        name: item.profiles.name,
        totalReferrals: item.successful_referrals,
        convertedReferrals: item.successful_referrals,
        rank: index + 1
      })) : [];
    } catch (error) {
      console.error('Error fetching top referrers:', error);
      return [];
    }
  }

  /**
   * Check if user should unlock "Night Owl" achievement (order after 2am)
   */
  checkNightOwlAchievement(orderTime: Date): boolean {
    const hour = orderTime.getHours();
    return hour >= 2 && hour < 6;
  }

  /**
   * Check if user should unlock "Speed Champion" achievement (paid within 30 seconds)
   */
  checkSpeedChampionAchievement(orderCreatedAt: Date, paidAt: Date): boolean {
    const diffInSeconds = (paidAt.getTime() - orderCreatedAt.getTime()) / 1000;
    return diffInSeconds <= 30;
  }

  // Mapping functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToUserProgression(data: any): UserProgression {
    return {
      id: data.id,
      userId: data.user_id,
      role: data.role,
      currentLevel: data.current_level,
      totalOrders: data.total_orders || 0,
      totalCompletedOffers: data.total_completed_offers || 0,
      levelUpgradedAt: data.level_upgraded_at ? new Date(data.level_upgraded_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToUserLevel(data: any): UserLevel {
    return {
      id: data.id,
      levelName: data.level_name,
      levelNumber: data.level_number,
      role: data.role,
      minOrders: data.min_orders || 0,
      minCompletedOffers: data.min_completed_offers || 0,
      perks: Array.isArray(data.perks) ? data.perks : [],
      description: data.description,
      badgeEmoji: data.badge_emoji,
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToVIPTier(data: any): VIPTier {
    return {
      id: data.id,
      tierName: data.tier_name,
      tierLevel: data.tier_level,
      minReferrals: data.min_referrals,
      commissionDiscountPercentage: data.commission_discount_percentage || 0,
      priorityMatching: data.priority_matching || false,
      customPricing: data.custom_pricing || false,
      boardMembership: data.board_membership || false,
      description: data.description,
      badgeEmoji: data.badge_emoji,
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToUserVIPStatus(data: any): UserVIPStatus {
    return {
      id: data.id,
      userId: data.user_id,
      currentTierId: data.current_tier_id,
      tierLevel: data.tier_level,
      successfulReferrals: data.successful_referrals || 0,
      upgradedAt: data.upgraded_at ? new Date(data.upgraded_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAchievement(data: any): Achievement {
    return {
      id: data.id,
      achievementKey: data.achievement_key,
      name: data.name,
      description: data.description,
      badgeEmoji: data.badge_emoji,
      role: data.role,
      unlockCriteria: data.unlock_criteria || {},
      shareMessage: data.share_message,
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToUserAchievement(data: any): UserAchievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      unlockedAt: new Date(data.unlocked_at),
      sharedCount: data.shared_count || 0,
      lastSharedAt: data.last_shared_at ? new Date(data.last_shared_at) : undefined
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLeaderboard(data: any): Leaderboard {
    return {
      id: data.id,
      category: data.category,
      role: data.role,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      rankings: data.rankings || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const gamificationService = new GamificationService();
