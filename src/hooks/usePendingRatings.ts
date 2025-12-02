import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingOrder {
  orderId: string;
  orderNumber?: string;
  otherPartyName: string;
  deliveredAt: Date;
}

export interface PendingRatingsResult {
  hasPendingRatings: boolean;
  pendingOrders: PendingOrder[];
  loading: boolean;
  refresh: () => void;
}

export function usePendingRatings(userId: string | null, userRole?: 'client' | 'supplier'): PendingRatingsResult {
  const [hasPendingRatings, setHasPendingRatings] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRatings = useCallback(async () => {
    if (!userId || !userRole) {
      setHasPendingRatings(false);
      setPendingOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch orders with status 'delivered' where the user hasn't rated yet
      const userIdField = userRole === 'client' ? 'client_id' : 'supplier_id';
      const otherIdField = userRole === 'client' ? 'supplier_id' : 'client_id';

      // Get delivered orders for this user
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, delivered_at, client_id, supplier_id')
        .eq(userIdField, userId)
        .eq('status', 'delivered')
        .not(otherIdField, 'is', null);

      if (ordersError) {
        console.error('Error fetching orders for pending ratings:', ordersError);
        setHasPendingRatings(false);
        setPendingOrders([]);
        setLoading(false);
        return;
      }

      if (!orders || orders.length === 0) {
        setHasPendingRatings(false);
        setPendingOrders([]);
        setLoading(false);
        return;
      }

      // Get ratings that this user has already submitted
      const orderIds = orders.map(o => o.id);
      const { data: existingRatings, error: ratingsError } = await supabase
        .from('ratings')
        .select('order_id')
        .eq('from_user_id', userId)
        .in('order_id', orderIds);

      if (ratingsError) {
        console.error('Error fetching existing ratings:', ratingsError);
        setHasPendingRatings(false);
        setPendingOrders([]);
        setLoading(false);
        return;
      }

      const ratedOrderIds = new Set(existingRatings?.map(r => r.order_id) || []);
      const unratedOrders = orders.filter(o => !ratedOrderIds.has(o.id));

      if (unratedOrders.length === 0) {
        setHasPendingRatings(false);
        setPendingOrders([]);
        setLoading(false);
        return;
      }

      // Get other party names
      const otherPartyIds = unratedOrders.map(o => 
        userRole === 'client' ? o.supplier_id : o.client_id
      ).filter(Boolean);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', otherPartyIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, p.business_name || p.name || 'Utilisateur'])
      );

      const pending: PendingOrder[] = unratedOrders.map(order => ({
        orderId: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        otherPartyName: profilesMap.get(
          userRole === 'client' ? order.supplier_id : order.client_id
        ) || 'Utilisateur',
        deliveredAt: new Date(order.delivered_at)
      }));

      setHasPendingRatings(pending.length > 0);
      setPendingOrders(pending);
    } catch (error) {
      console.error('Error in usePendingRatings:', error);
      setHasPendingRatings(false);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchPendingRatings();
  }, [fetchPendingRatings]);

  const refresh = useCallback(() => {
    fetchPendingRatings();
  }, [fetchPendingRatings]);

  return { hasPendingRatings, pendingOrders, loading, refresh };
}
