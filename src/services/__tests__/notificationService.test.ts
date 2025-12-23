import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService, NotificationPreferences } from '../notificationService';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return user notification preferences', async () => {
      const mockPrefs: NotificationPreferences = {
        user_id: 'test-user-id',
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

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPrefs, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const result = await notificationService.getPreferences('test-user-id');

      expect(result).toEqual(mockPrefs);
      expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
    });

    it('should return default preferences when none exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const result = await notificationService.getPreferences('test-user-id');

      expect(result).toBeDefined();
      expect(result?.push_enabled).toBe(true);
      expect(result?.email_enabled).toBe(true);
      expect(result?.sms_enabled).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert
      });

      await notificationService.updatePreferences('test-user-id', {
        push_enabled: false
      });

      expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          push_enabled: false
        }),
        expect.any(Object)
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const count = await notificationService.getUnreadCount('test-user-id');

      expect(count).toBe(5);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should return 0 on error', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: new Error('DB error') })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const count = await notificationService.getUnreadCount('test-user-id');

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate
      });

      await notificationService.markAsRead('notification-id');

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate
      });

      await notificationService.markAllAsRead('test-user-id');

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete
      });

      await notificationService.deleteNotification('notification-id');

      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('subscribeToPush', () => {
    it('should save a push subscription', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert
      });

      const subscription = {
        user_id: 'test-user-id',
        endpoint: 'https://push.example.com/endpoint',
        p256dh_key: 'test-key',
        auth_key: 'test-auth',
        device_name: 'Test Device'
      };

      await notificationService.subscribeToPush('test-user-id', subscription);

      expect(supabase.from).toHaveBeenCalledWith('push_subscriptions');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: subscription.endpoint,
          p256dh_key: subscription.p256dh_key,
          auth_key: subscription.auth_key
        }),
        expect.any(Object)
      );
    });
  });

  describe('unsubscribeFromPush', () => {
    it('should remove a push subscription', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete
      });

      await notificationService.unsubscribeFromPush(
        'test-user-id',
        'https://push.example.com/endpoint'
      );

      expect(supabase.from).toHaveBeenCalledWith('push_subscriptions');
    });
  });
});
