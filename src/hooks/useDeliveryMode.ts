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
      // Fetch client info using RPC if available, fallback to direct query
      let clientData: any = null;
      
      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_client_info_for_order', { p_order_id: order.id });
        
        if (!rpcError && data) {
          // RPC returns an array of rows, get the first one
          clientData = Array.isArray(data) ? data[0] : data;
        }
      } catch (rpcErr) {
        console.warn('RPC not available, using fallback query:', rpcErr);
      }

      // Fallback: Query profiles directly if RPC fails
      if (!clientData) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, business_name, phone, rating')
          .eq('id', order.clientId)
          .single();
        
        if (profileError) {
          console.error('Error fetching client profile:', profileError);
        } else {
          clientData = data;
        }
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

      // Calculate packaging to collect (consigne items)
      const consigneItems = order.items.filter(item => item.withConsigne);
      const packagingToCollect = consigneItems.reduce((sum, item) => sum + item.quantity, 0);
      const packagingDetails = consigneItems.length > 0
        ? consigneItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ')
        : '';

      // Use consistent field name for confirmation code
      const confirmationCode = order.delivery_confirmation_code || order.deliveryConfirmationCode || '';

      // Calculate packagingSnapshot if absent (fallback for orders pre-PR#150)
      let packagingSnapshot = order.packagingSnapshot;

      if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
        // Calculate from items with consigne, EXCLUDING CARTON types (disposable)
        const consignableItems = order.items.filter(item => 
          item.withConsigne && 
          item.product.consignPrice > 0 &&  // Prix consigne > 0
          item.product.crateType &&
          !item.product.crateType.startsWith('CARTON')  // Exclure cartons
        );
        
        if (consignableItems.length > 0) {
          const snapshotMap: Record<string, number> = {};
          consignableItems.forEach(item => {
            const crateType = item.product.crateType;
            if (crateType) {
              snapshotMap[crateType] = (snapshotMap[crateType] || 0) + item.quantity;
            }
          });
          if (Object.keys(snapshotMap).length > 0) {
            packagingSnapshot = snapshotMap;
          }
        }
      }

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
        // Don't set startedAt here - it should come from the database
        startedAt: order.status === 'delivering' && order.acceptedAt ? order.acceptedAt.toString() : undefined,
        deliveredAt: order.deliveredAt?.toString(),
        confirmationCode,
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        itemsSummary,
        packagingToCollect,
        packagingDetails,
        packagingSnapshot,
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
      let orders: Order[] = [];
      
      // Check if user is a driver by checking if there are orders assigned to them
      const { data: driverOrdersData, error: driverError } = await supabase
        .from('orders_with_coords')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          ),
          zone:zones (name)
        `)
        .eq('assigned_delivery_user_id', user.id)
        .in('status', ['paid', 'accepted', 'preparing', 'delivering', 'delivered'])
        .order('created_at', { ascending: false });
      
      if (!driverError && driverOrdersData && driverOrdersData.length > 0) {
        // User has orders assigned as driver - show only those
        orders = driverOrdersData.map((order: any) => {
          const items: CartItem[] = order.order_items.map((item: any) => ({
            product: {
              id: item.product.id,
              reference: item.product.reference,
              name: item.product.name,
              category: item.product.category,
              brand: item.product.brand,
              crateType: item.product.crate_type,
              unitPrice: item.product.unit_price,
              cratePrice: item.product.crate_price,
              consignPrice: item.product.consign_price,
              volume: item.product.volume,
              isActive: item.product.is_active,
              imageUrl: item.product.image_url,
              createdAt: new Date(item.product.created_at),
              updatedAt: new Date(item.product.updated_at)
            },
            quantity: item.quantity,
            withConsigne: item.with_consigne
          }));

          return {
            id: order.id,
            clientId: order.client_id,
            supplierId: order.supplier_id,
            items,
            totalAmount: order.total_amount,
            status: order.status,
            consigneTotal: order.consigne_total,
            deliveryAddress: order.delivery_address,
            deliveryZone: order.zone?.name,
            coordinates: {
              lat: order.lat,
              lng: order.lng
            },
            zoneId: order.zone_id,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            // Include both field names for backward compatibility with legacy code
            deliveryConfirmationCode: order.delivery_confirmation_code,
            delivery_confirmation_code: order.delivery_confirmation_code,
            packagingSnapshot: order.packaging_snapshot,
            createdAt: new Date(order.created_at),
            acceptedAt: order.accepted_at ? new Date(order.accepted_at) : undefined,
            deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
            paidAt: order.paid_at ? new Date(order.paid_at) : undefined
          };
        });
      } else {
        // Check if user is owner or manager who can see all orders
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        // If user is a regular driver with no assigned orders, show empty list
        // Only owners/managers should see all orders
        if (memberData && memberData.role === 'driver') {
          // Driver with no assigned orders - show empty list
          orders = [];
        } else {
          // Owner or manager - fallback to supplier orders (for suppliers managing their own deliveries)
          orders = await getOrdersBySupplier(user.id);
        }
      }
      
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
   * Note: This updates local state only. The actual order status remains 'delivering'
   * until the delivery is confirmed. This provides visual feedback without changing
   * the order state in the database.
   */
  const markAsArrived = async (orderId: string) => {
    try {
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
