import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { browserNotificationService } from '../services/browserNotificationService';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isLoading: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  hasNotificationPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if (browserNotificationService.isSupported()) {
      const permission = browserNotificationService.getPermission();
      setHasNotificationPermission(permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    loadNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new as Notification;
          setNotifications(prev => [notification, ...prev]);
          
          // Show browser notification for important events
          if (hasNotificationPermission) {
            showBrowserNotification(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hasNotificationPermission]);

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showBrowserNotification = async (notification: Notification) => {
    try {
      // Show browser notification based on type
      switch (notification.type) {
        case 'new_order':
          if (notification.data?.orderNumber && notification.data?.clientName && notification.data?.amount) {
            await browserNotificationService.showNewOrderNotification(
              notification.data.orderNumber,
              notification.data.clientName,
              notification.data.amount
            );
          }
          break;
        case 'new_offer':
          if (notification.data?.supplierName && notification.data?.orderNumber) {
            await browserNotificationService.showNewOfferNotification(
              notification.data.supplierName,
              notification.data.orderNumber
            );
          }
          break;
        case 'order_status':
          if (notification.data?.orderNumber && notification.data?.status) {
            await browserNotificationService.showOrderStatusNotification(
              notification.data.orderNumber,
              notification.data.status,
              notification.title
            );
          }
          break;
        case 'delivery_update':
          if (notification.data?.orderNumber) {
            await browserNotificationService.showDeliveryNotification(
              notification.data.orderNumber,
              notification.message
            );
          }
          break;
        case 'order_accepted':
          if (notification.data?.orderNumber && notification.data?.supplierName) {
            await browserNotificationService.showOrderAcceptedNotification(
              notification.data.orderNumber,
              notification.data.supplierName
            );
          }
          break;
        case 'order_rejected':
          if (notification.data?.orderNumber) {
            await browserNotificationService.showOrderRejectedNotification(
              notification.data.orderNumber,
              notification.data?.reason
            );
          }
          break;
        default:
          // Generic notification
          await browserNotificationService.show({
            title: notification.title,
            body: notification.message,
            tag: notification.id,
            data: notification.data
          });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    const permission = await browserNotificationService.requestPermission();
    const granted = permission === 'granted';
    setHasNotificationPermission(granted);
    
    if (granted) {
      // Show test notification
      await browserNotificationService.testNotification();
    }
    
    return granted;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isLoading,
        requestNotificationPermission,
        hasNotificationPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
