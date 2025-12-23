import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  error: string | null;
}

// VAPID public key should be configured in environment
// For MVP, we'll use a placeholder - needs to be replaced with actual VAPID key
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Hook for managing web push notifications
 * Handles subscription, unsubscription, and permission management
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported && Notification.permission) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Check current subscription status
  useEffect(() => {
    if (!isSupported || !user) {
      setIsSubscribed(false);
      return;
    }

    checkSubscription();
  }, [isSupported, user]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setIsSubscribed(false);
    }
  };

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    if (!user) {
      setError('User must be logged in to subscribe');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not configured. Push notifications will not work until configured.');
      setError('Push notifications not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      // Save subscription to database
      if (subscription) {
        const subscriptionJSON = subscription.toJSON();
        
        const { error: dbError } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh_key: subscriptionJSON.keys?.p256dh || '',
            auth_key: subscriptionJSON.keys?.auth || '',
            device_name: navigator.userAgent.substring(0, 100),
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,endpoint'
          });

        if (dbError) {
          console.error('Error saving subscription to database:', dbError);
          setError('Failed to save subscription');
          return false;
        }

        setIsSubscribed(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // Unsubscribe from push manager
        const success = await subscription.unsubscribe();

        if (success) {
          // Remove from database
          const { error: dbError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', endpoint);

          if (dbError) {
            console.error('Error removing subscription from database:', dbError);
          }

          setIsSubscribed(false);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error
  };
}
