import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UsePaymentNotificationsReturn {
  pendingPaymentsCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePaymentNotifications = (): UsePaymentNotificationsReturn => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isAdmin = user?.role === 'admin' || user?.isSuperAdmin;

  const fetchPendingCount = useCallback(async () => {
    if (!isAdmin) {
      setPendingPaymentsCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { count, error: countError } = await supabase
        .from('subscription_payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_validation');

      if (countError) throw countError;

      setPendingPaymentsCount(count || 0);
    } catch (err) {
      console.error('Error fetching pending payments count:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !user) {
      setPendingPaymentsCount(0);
      setLoading(false);
      return;
    }

    fetchPendingCount();

    const channel = supabase
      .channel('admin-payment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_payments',
          filter: 'status=eq.pending_validation'
        },
        async (payload) => {
          console.log('[PaymentNotifications] New payment claim:', payload);
          setPendingPaymentsCount(prev => prev + 1);

          const { data: paymentData } = await supabase
            .from('subscription_payments')
            .select(`
              amount,
              subscriptions!subscription_payments_subscription_id_fkey (
                organizations!subscriptions_organization_id_fkey (name)
              )
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          const orgName = (paymentData as any)?.subscriptions?.organizations?.name || 'Organisation';

          showToast({
            type: 'info',
            title: '💰 Nouveau paiement a valider',
            message: orgName,
            duration: 8000
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscription_payments'
        },
        (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;

          if (oldStatus === 'pending_validation' && newStatus !== 'pending_validation') {
            console.log('[PaymentNotifications] Payment validated/rejected:', payload);
            setPendingPaymentsCount(prev => Math.max(0, prev - 1));
          } else if (oldStatus !== 'pending_validation' && newStatus === 'pending_validation') {
            setPendingPaymentsCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log('[PaymentNotifications] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, user, fetchPendingCount, showToast]);

  const refresh = useCallback(async () => {
    await fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    pendingPaymentsCount,
    loading,
    error,
    refresh
  };
};
