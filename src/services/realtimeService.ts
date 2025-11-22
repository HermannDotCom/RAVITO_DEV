import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

type ConnectionStatusCallback = (status: RealtimeConnectionStatus) => void;

class RealtimeService {
  private connectionStatus: RealtimeConnectionStatus = 'disconnected';
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: number | null = null;

  constructor() {
    // Connection monitoring will be set up when subscriptions are created
  }

  public getConnectionStatus(): RealtimeConnectionStatus {
    return this.connectionStatus;
  }

  public onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private setConnectionStatus(status: RealtimeConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      console.log('Realtime connection status changed:', status);
      
      // Notify all listeners
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in connection status callback:', error);
        }
      });
    }
  }

  private handleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setConnectionStatus('error');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.setConnectionStatus('connecting');
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      // Connection status will be updated by subscription callbacks
      // when reconnection succeeds
    }, delay);
  }

  /**
   * Subscribe to new orders for a supplier in their zones
   */
  public subscribeToSupplierOrders(
    supplierId: string,
    onNewOrder: (order: Record<string, unknown>) => void,
    onOrderUpdate: (order: Record<string, unknown>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`supplier-orders-${supplierId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `status=eq.pending`
        },
        async (payload) => {
          console.log('New order detected:', payload);
          
          // Check if order is in supplier's zones
          const { data: supplierZones } = await supabase
            .from('supplier_zones')
            .select('zone_id')
            .eq('supplier_id', supplierId)
            .eq('is_active', true);

          const { data: order } = await supabase
            .from('orders')
            .select('*, client:profiles!client_id(name, phone, address)')
            .eq('id', payload.new.id)
            .single();

          if (order && supplierZones?.some(sz => sz.zone_id === order.zone_id)) {
            onNewOrder(order);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `supplier_id=eq.${supplierId}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          onOrderUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Supplier orders subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionStatus('error');
          this.handleReconnect();
        } else if (status === 'TIMED_OUT') {
          this.setConnectionStatus('disconnected');
          this.handleReconnect();
        }
      });

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to supplier offers for a client's orders
   */
  public subscribeToClientOffers(
    clientId: string,
    onNewOffer: (offer: Record<string, unknown>) => void,
    onOfferUpdate: (offer: Record<string, unknown>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`client-offers-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_offers',
        },
        async (payload) => {
          console.log('New offer detected:', payload);
          
          // Check if offer is for client's order
          const { data: order } = await supabase
            .from('orders')
            .select('client_id')
            .eq('id', payload.new.order_id)
            .single();

          if (order?.client_id === clientId) {
            const { data: offer } = await supabase
              .from('supplier_offers')
              .select('*, supplier:profiles!supplier_id(name, business_name, phone), order:orders(id, status)')
              .eq('id', payload.new.id)
              .single();

            if (offer) {
              onNewOffer(offer);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_offers',
        },
        async (payload) => {
          console.log('Offer updated:', payload);
          
          const { data: order } = await supabase
            .from('orders')
            .select('client_id')
            .eq('id', payload.new.order_id)
            .single();

          if (order?.client_id === clientId) {
            onOfferUpdate(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('Client offers subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionStatus('error');
          this.handleReconnect();
        } else if (status === 'TIMED_OUT') {
          this.setConnectionStatus('disconnected');
          this.handleReconnect();
        }
      });

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to delivery status updates for an order
   */
  public subscribeToDeliveryStatus(
    orderId: string,
    onStatusUpdate: (order: Record<string, unknown>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Delivery status updated:', payload);
          onStatusUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Delivery status subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionStatus('error');
          this.handleReconnect();
        } else if (status === 'TIMED_OUT') {
          this.setConnectionStatus('disconnected');
          this.handleReconnect();
        }
      });

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to all order status changes for a user
   */
  public subscribeToUserOrders(
    userId: string,
    role: 'client' | 'supplier',
    onOrderChange: (order: Record<string, unknown>, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  ): RealtimeSubscription {
    const filterField = role === 'client' ? 'client_id' : 'supplier_id';
    
    const channel = supabase
      .channel(`user-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `${filterField}=eq.${userId}`
        },
        (payload) => {
          console.log('Order change detected:', payload);
          onOrderChange(payload.new || payload.old, payload.eventType);
        }
      )
      .subscribe((status) => {
        console.log('User orders subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionStatus('error');
          this.handleReconnect();
        } else if (status === 'TIMED_OUT') {
          this.setConnectionStatus('disconnected');
          this.handleReconnect();
        }
      });

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Reset reconnection attempts (call when manually reconnecting)
   */
  public resetReconnection() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clean up all resources
   */
  public cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.statusCallbacks.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
