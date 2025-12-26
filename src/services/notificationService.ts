import { supabase } from '../lib/supabase';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  notify_new_order: boolean;
  notify_order_status: boolean;
  notify_delivery_assigned: boolean;
  notify_delivery_status: boolean;
  notify_payment: boolean;
  notify_team: boolean;
  notify_support: boolean;
  notify_promotions: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PushSubscriptionData {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name?: string;
  created_at?: string;
  last_used_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false
      }]);

    if (error) throw error;

    console.log('Notification created successfully:', params.title);
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createAccountApprovedNotification = async (userId: string, userName: string, userRole: 'client' | 'supplier') => {
  const roleLabel = userRole === 'client' ? 'client' : 'fournisseur';

  await createNotification({
    userId,
    type: 'account_approved',
    title: 'Compte approuvé !',
    message: `Félicitations ${userName} ! Votre compte ${roleLabel} a été approuvé. Vous avez maintenant accès à toutes les fonctionnalités de RAVITO.`,
    data: { role: userRole }
  });
};

export const createAccountRejectedNotification = async (userId: string, userName: string, reason: string) => {
  await createNotification({
    userId,
    type: 'account_rejected',
    title: 'Compte non approuvé',
    message: `Bonjour ${userName}, votre demande de compte n'a pas été approuvée. Raison: ${reason}. Veuillez contacter RAVITO au +225 27 20 30 40 50 ou support@ravito.ci pour plus d'informations.`,
    data: { reason }
  });
};

export const createZoneApprovedNotification = async (userId: string, zoneName: string) => {
  await createNotification({
    userId,
    type: 'zone_approved',
    title: 'Demande de zone approuvée !',
    message: `Votre demande pour couvrir la zone "${zoneName}" a été approuvée. Vous pouvez maintenant accepter des commandes dans cette zone.`,
    data: { zoneName }
  });
};

export const createZoneRejectedNotification = async (userId: string, zoneName: string, reason?: string) => {
  const messageBase = `Votre demande pour couvrir la zone "${zoneName}" n'a pas été approuvée.`;
  const messageReason = reason ? ` Raison: ${reason}.` : '';
  const messageContact = ' Veuillez contacter RAVITO au +225 27 20 30 40 50 ou partenaires@ravito.ci pour plus d\'informations.';

  await createNotification({
    userId,
    type: 'zone_rejected',
    title: 'Demande de zone refusée',
    message: messageBase + messageReason + messageContact,
    data: { zoneName, reason }
  });
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId: string, limit: number = 50): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get notification preferences for a user
 */
export const getPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, return default preferences
      if (error.code === 'PGRST116') {
        return {
          user_id: userId,
          push_enabled: true,
          email_enabled: true,
          sms_enabled: false,
          notify_new_order: true,
          notify_order_status: true,
          notify_delivery_assigned: true,
          notify_delivery_status: true,
          notify_payment: true,
          notify_team: true,
          notify_support: true,
          notify_promotions: false
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async (
  userId: string,
  subscription: PushSubscriptionData
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.p256dh_key,
        auth_key: subscription.auth_key,
        device_name: subscription.device_name,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async (userId: string, endpoint: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) throw error;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
};

/**
 * Get all push subscriptions for a user
 */
export const getPushSubscriptions = async (userId: string): Promise<PushSubscriptionData[]> => {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return [];
  }
};

// Export all functions as a service object
export const notificationService = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptions
};
