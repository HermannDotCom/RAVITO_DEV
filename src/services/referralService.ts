import { supabase } from '../lib/supabase';
import type { ReferralCode, Referral, ReferralCredit, CreditTransaction, UserRole } from '../types';

/**
 * REFERRAL SERVICE
 * Manages referral codes, tracking, and credit distribution
 */

class ReferralService {
  /**
   * Generate and create a unique referral code for a user
   */
  async generateReferralCode(userId: string, userName: string, userRole: UserRole): Promise<ReferralCode | null> {
    try {
      // Check if user already has an active code
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existing) {
        return this.mapToReferralCode(existing);
      }

      // Generate code using database function
      const { data, error } = await supabase.rpc('generate_referral_code', {
        user_name: userName,
        user_role: userRole
      });

      if (error) throw error;

      // Insert the new code
      const { data: newCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: data,
          role: userRole,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return this.mapToReferralCode(newCode);
    } catch (error) {
      console.error('Error generating referral code:', error);
      return null;
    }
  }

  /**
   * Get referral code for a user
   */
  async getUserReferralCode(userId: string): Promise<ReferralCode | null> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data ? this.mapToReferralCode(data) : null;
    } catch (error) {
      console.error('Error fetching referral code:', error);
      return null;
    }
  }

  /**
   * Validate and retrieve referral code details
   */
  async validateReferralCode(code: string): Promise<ReferralCode | null> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data ? this.mapToReferralCode(data) : null;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return null;
    }
  }

  /**
   * Create a referral relationship
   */
  async createReferral(
    referrerId: string,
    referredId: string,
    referralCode: string,
    referrerRole: UserRole,
    referredRole: UserRole
  ): Promise<Referral | null> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: referredId,
          referral_code: referralCode,
          referrer_role: referrerRole,
          referred_role: referredRole,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data ? this.mapToReferral(data) : null;
    } catch (error) {
      console.error('Error creating referral:', error);
      return null;
    }
  }

  /**
   * Get referrals made by a user
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ? data.map(r => this.mapToReferral(r)) : [];
    } catch (error) {
      console.error('Error fetching user referrals:', error);
      return [];
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    convertedReferrals: number;
    pendingReferrals: number;
    totalRewardsEarned: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, referrer_reward_amount')
        .eq('referrer_id', userId);

      if (error) throw error;

      const stats = {
        totalReferrals: data?.length || 0,
        convertedReferrals: data?.filter(r => r.status === 'converted').length || 0,
        pendingReferrals: data?.filter(r => r.status === 'pending').length || 0,
        totalRewardsEarned: data?.reduce((sum, r) => sum + (r.referrer_reward_amount || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return {
        totalReferrals: 0,
        convertedReferrals: 0,
        pendingReferrals: 0,
        totalRewardsEarned: 0
      };
    }
  }

  /**
   * Get user's credit balance
   */
  async getUserCredits(userId: string): Promise<ReferralCredit | null> {
    try {
      const { data, error } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no credits exist, create default entry
      if (!data) {
        const { data: newCredit, error: insertError } = await supabase
          .from('referral_credits')
          .insert({
            user_id: userId,
            balance: 0,
            total_earned: 0,
            total_spent: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newCredit ? this.mapToReferralCredit(newCredit) : null;
      }

      return this.mapToReferralCredit(data);
    } catch (error) {
      console.error('Error fetching user credits:', error);
      return null;
    }
  }

  /**
   * Spend credits (e.g., apply to order)
   */
  async spendCredits(userId: string, amount: number, orderId?: string): Promise<boolean> {
    try {
      const credits = await this.getUserCredits(userId);
      if (!credits || credits.balance < amount) {
        return false;
      }

      // Update credit balance
      const { error: updateError } = await supabase
        .from('referral_credits')
        .update({
          balance: credits.balance - amount,
          total_spent: credits.totalSpent + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        transaction_type: 'spent',
        amount: -amount,
        balance_after: credits.balance - amount,
        source_type: 'order',
        source_id: orderId,
        description: 'Credit applied to order'
      });

      return true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  }

  /**
   * Get credit transaction history
   */
  async getCreditTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ? data.map(t => this.mapToCreditTransaction(t)) : [];
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }
  }

  /**
   * Generate shareable referral link
   */
  generateShareableLink(code: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${code}`;
  }

  /**
   * Generate WhatsApp share message
   */
  generateWhatsAppMessage(userName: string, code: string): string {
    const link = this.generateShareableLink(code);
    return encodeURIComponent(
      `Salut! Je viens de découvrir DISTRI-NIGHT, la meilleure plateforme de livraison nocturne de boissons! 🍻🚚\n\n` +
      `Inscris-toi avec mon code ${code} et reçois 30,000 FCFA de crédit gratuit! ⚡\n\n` +
      `${link}`
    );
  }

  /**
   * Generate SMS share message
   */
  generateSMSMessage(userName: string, code: string): string {
    const link = this.generateShareableLink(code);
    return encodeURIComponent(
      `${userName} t'invite sur DISTRI-NIGHT! Utilise le code ${code} pour 30,000 FCFA gratuit: ${link}`
    );
  }

  // Mapping functions
  private mapToReferralCode(data: any): ReferralCode {
    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      role: data.role,
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }

  private mapToReferral(data: any): Referral {
    return {
      id: data.id,
      referrerId: data.referrer_id,
      referredId: data.referred_id,
      referralCode: data.referral_code,
      referrerRole: data.referrer_role,
      referredRole: data.referred_role,
      status: data.status,
      convertedAt: data.converted_at ? new Date(data.converted_at) : undefined,
      referrerRewardAmount: data.referrer_reward_amount || 0,
      referredRewardAmount: data.referred_reward_amount || 0,
      rewardsDistributedAt: data.rewards_distributed_at ? new Date(data.rewards_distributed_at) : undefined,
      createdAt: new Date(data.created_at)
    };
  }

  private mapToReferralCredit(data: any): ReferralCredit {
    return {
      id: data.id,
      userId: data.user_id,
      balance: data.balance || 0,
      totalEarned: data.total_earned || 0,
      totalSpent: data.total_spent || 0,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapToCreditTransaction(data: any): CreditTransaction {
    return {
      id: data.id,
      userId: data.user_id,
      transactionType: data.transaction_type,
      amount: data.amount,
      balanceAfter: data.balance_after,
      sourceType: data.source_type,
      sourceId: data.source_id,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }
}

export const referralService = new ReferralService();
