import { useState, useEffect, useCallback } from 'react';
import { DeliveryOrder, DeliveryStats, DeliveryFilter } from '../types/delivery';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { getOrdersBySupplier, updateOrderStatus as updateOrderStatusService } from '../services/orderService';
import { supabase } from '../lib/supabase';

interface UseDeliveryModeReturn {
  // Data
  deliveries: DeliveryOrder[];
  todayStats: DeliveryStats;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filter: DeliveryFilter;
  setFilter: (filter: DeliveryFilter) => void;
  
  // Actions
  startDelivery: (orderId: string) => Promise<void>;
  markAsArrived: (orderId: string) => Promise<void>;
  confirmDelivery: (orderId: string, confirmationCode: string) => Promise<boolean>;
  
  // Real-time updates
  refetch: () => Promise<void>;
}

/**
 * Hook for managing delivery mode operations
 * Provides simplified interface for delivery personnel
 */
export function useDeliveryMode(): UseDeliveryModeReturn {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [todayStats, setTodayStats] = useState<DeliveryStats>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [filter, setFilter] = useState<DeliveryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert Order to DeliveryOrder
   */
  const mapOrderToDelivery = async (order: Order): Promise<DeliveryOrder | null> => {
    try {
      // Fetch client info
      const { data: clientData, error: clientError } = await supabase
        .rpc('get_client_info_for_order', { p_order_id: order.id });

      if (clientError) {
        console.error('Error fetching client info:', clientError);
        return null;
      }

      // Determine delivery status based on order status
      let deliveryStatus: 'ready_for_delivery' | 'out_for_delivery' | 'arrived' | 'delivered';
      if (order.status === 'delivered') {
        deliveryStatus = 'delivered';
      } else if (order.status === 'delivering') {
        deliveryStatus = 'out_for_delivery';
      } else if (order.status === 'preparing' || order.status === 'accepted' || order.status === 'paid') {
        deliveryStatus = 'ready_for_delivery';
      } else {
        return null; // Skip orders not in delivery phase
      }

      // Create items summary
      const itemsSummary = order.items
        .map(item => `${item.quantity}x ${item.product.name}`)
        .join(', ');

      return {
        id: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        status: deliveryStatus,
        clientName: clientData?.business_name || clientData?.name || 'Client',
        clientPhone: clientData?.phone || '',
        clientAddress: order.deliveryAddress,
        clientLat: order.coordinates?.lat,
        clientLng: order.coordinates?.lng,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'pending',
        paymentMethod: order.paymentMethod,
        assignedAt: order.acceptedAt?.toString() || order.createdAt.toString(),
        startedAt: order.status === 'delivering' ? new Date().toISOString() : undefined,
        deliveredAt: order.deliveredAt?.toString(),
        confirmationCode: order.delivery_confirmation_code || order.deliveryConfirmationCode || '',
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        itemsSummary,
      };
    } catch (err) {
      console.error('Error mapping order to delivery:', err);
      return null;
    }
  };

  /**
   * Load deliveries for the current user
   */
  const loadDeliveries = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all orders for the supplier
      const orders = await getOrdersBySupplier(user.id);
      
      // Filter to delivery-relevant orders only
      const deliveryOrders = orders.filter(o => 
        ['paid', 'accepted', 'preparing', 'delivering', 'delivered'].includes(o.status)
      );

      // Map to delivery format
      const mappedDeliveries = await Promise.all(
        deliveryOrders.map(order => mapOrderToDelivery(order))
      );
      
      // Filter out null values
      const validDeliveries = mappedDeliveries.filter((d): d is DeliveryOrder => d !== null);

      setDeliveries(validDeliveries);

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayDeliveries = validDeliveries.filter(d => {
        const assignedDate = new Date(d.assignedAt);
        return assignedDate >= today;
      });

      const stats: DeliveryStats = {
        pending: todayDeliveries.filter(d => d.status === 'ready_for_delivery').length,
        inProgress: todayDeliveries.filter(d => d.status === 'out_for_delivery' || d.status === 'arrived').length,
        completed: todayDeliveries.filter(d => d.status === 'delivered').length,
        totalEarnings: todayDeliveries
          .filter(d => d.status === 'delivered')
          .reduce((sum, d) => sum + d.totalAmount, 0),
      };

      setTodayStats(stats);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      setError('Erreur lors du chargement des livraisons');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Start a delivery
   */
  const startDelivery = async (orderId: string) => {
    try {
      await updateOrderStatusService(orderId, 'delivering');
      await loadDeliveries();
    } catch (err) {
      console.error('Error starting delivery:', err);
      throw new Error('Erreur lors du démarrage de la livraison');
    }
  };

  /**
   * Mark as arrived at location
   */
  const markAsArrived = async (orderId: string) => {
    try {
      // Update the delivery with arrived timestamp
      const { error } = await supabase
        .from('orders')
        .update({ 
          // We track "arrived" state in our local state
          // The actual order status remains 'delivering'
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state to show arrived
      setDeliveries(prev => 
        prev.map(d => 
          d.id === orderId 
            ? { ...d, status: 'arrived' as const, arrivedAt: new Date().toISOString() }
            : d
        )
      );
    } catch (err) {
      console.error('Error marking as arrived:', err);
      throw new Error('Erreur lors de la mise à jour du statut');
    }
  };

  /**
   * Confirm delivery with code validation
   */
  const confirmDelivery = async (orderId: string, confirmationCode: string): Promise<boolean> => {
    try {
      const delivery = deliveries.find(d => d.id === orderId);
      if (!delivery) {
        throw new Error('Livraison non trouvée');
      }

      // Validate confirmation code
      if (delivery.confirmationCode.toUpperCase() !== confirmationCode.toUpperCase()) {
        return false; // Invalid code
      }

      // Update order status to delivered
      await updateOrderStatusService(orderId, 'delivered');
      await loadDeliveries();
      
      return true;
    } catch (err) {
      console.error('Error confirming delivery:', err);
      throw new Error('Erreur lors de la confirmation de la livraison');
    }
  };

  /**
   * Refetch deliveries
   */
  const refetch = useCallback(async () => {
    await loadDeliveries();
  }, [loadDeliveries]);

  // Initial load
  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Get filtered deliveries
  const filteredDeliveries = deliveries.filter(d => {
    if (filter === 'pending') return d.status === 'ready_for_delivery';
    if (filter === 'in_progress') return d.status === 'out_for_delivery' || d.status === 'arrived';
    if (filter === 'completed') return d.status === 'delivered';
    return true;
  });

  return {
    deliveries: filteredDeliveries,
    todayStats,
    isLoading,
    error,
    filter,
    setFilter,
    startDelivery,
    markAsArrived,
    confirmDelivery,
    refetch,
  };
}
