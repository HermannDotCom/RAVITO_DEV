import { supabase } from '../lib/supabase';

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export const activityService = {
  async logActivity(
    userId: string,
    activityType: string,
    activityDescription: string,
    options?: {
      relatedEntityType?: string;
      relatedEntityId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_description: activityDescription,
          related_entity_type: options?.relatedEntityType || null,
          related_entity_id: options?.relatedEntityId || null,
          metadata: options?.metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  async getUserRecentActivity(userId: string, limit: number = 4): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  },

  async getActivityStats(userId: string): Promise<{
    totalActivities: number;
    lastActivityDate: string | null;
    activityTypes: { type: string; count: number }[];
  }> {
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('activity_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalActivities: 0,
          lastActivityDate: null,
          activityTypes: [],
        };
      }

      const activityTypesMap = new Map<string, number>();
      data.forEach((activity) => {
        const count = activityTypesMap.get(activity.activity_type) || 0;
        activityTypesMap.set(activity.activity_type, count + 1);
      });

      const activityTypes = Array.from(activityTypesMap.entries()).map(([type, count]) => ({
        type,
        count,
      }));

      return {
        totalActivities: data.length,
        lastActivityDate: data[0]?.created_at || null,
        activityTypes,
      };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        totalActivities: 0,
        lastActivityDate: null,
        activityTypes: [],
      };
    }
  },

  getActivityTypeLabel(activityType: string): string {
    const labels: Record<string, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      profile_updated: 'Profil mis à jour',
      order_created: 'Commande créée',
      order_accepted: 'Commande acceptée',
      order_delivered: 'Commande livrée',
      order_cancelled: 'Commande annulée',
      payment_made: 'Paiement effectué',
      rating_given: 'Note donnée',
      rating_received: 'Note reçue',
      zone_registered: 'Zone enregistrée',
      zone_approved: 'Zone approuvée',
      account_approved: 'Compte approuvé',
      account_rejected: 'Compte rejeté',
    };

    return labels[activityType] || activityType;
  },

  getActivityIcon(activityType: string): string {
    const icons: Record<string, string> = {
      login: '🔐',
      logout: '👋',
      profile_updated: '✏️',
      order_created: '🛒',
      order_accepted: '✅',
      order_delivered: '📦',
      order_cancelled: '❌',
      payment_made: '💳',
      rating_given: '⭐',
      rating_received: '🌟',
      zone_registered: '📍',
      zone_approved: '✔️',
      account_approved: '👍',
      account_rejected: '👎',
    };

    return icons[activityType] || '📝';
  },
};
