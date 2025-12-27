import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, CartItem, PaymentMethod } from '../types';
import { useAuth } from './AuthContext';
import {
  createOrder as createOrderService,
  getOrdersByClient,
  getOrdersBySupplier,
  getPendingOrders,
  getAllOrders,
  updateOrderStatus as updateOrderStatusService
} from '../services/orderService';
import { emailService } from '../services/emailService';

interface OrderContextType {
  currentOrder: Order | null;
  clientCurrentOrder: Order | null;
  availableOrders: Order[];
  supplierActiveDeliveries: Order[];
  supplierCompletedDeliveries: Order[];
  clientOrders: Order[];
  allOrders: Order[];
  isLoading: boolean;
  placeOrder: (
    items: CartItem[],
    deliveryAddress: string,
    coordinates: { lat: number; lng: number },
    paymentMethod: PaymentMethod,
    commissionSettings: { clientCommission: number; supplierCommission: number },
    zoneId?: string,
    deliveryInstructions?: string,
    usesProfileAddress?: boolean
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  acceptSupplierOffer: (orderId: string) => Promise<boolean>;
  rejectSupplierOffer: (orderId: string) => Promise<boolean>;
  processPayment: (orderId: string, paymentMethod: PaymentMethod, transactionId: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [supplierActiveDeliveries, setSupplierActiveDeliveries] = useState<Order[]>([]);
  const [supplierCompletedDeliveries, setSupplierCompletedDeliveries] = useState<Order[]>([]);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [adminAllOrders, setAdminAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (user.role === 'client') {
        const orders = await getOrdersByClient(user.id);
        setClientOrders(orders);
      } else if (user.role === 'supplier') {
        const [pending, active, completed] = await Promise.all([
          getPendingOrders(user.id),
          getOrdersBySupplier(user.id),
          getOrdersBySupplier(user.id)
        ]);

        setAvailableOrders(pending);
        setSupplierActiveDeliveries(active.filter(o =>
          ['paid', 'accepted', 'preparing', 'delivering'].includes(o.status)
        ));
        setSupplierCompletedDeliveries(completed.filter(o => o.status === 'delivered'));
      } else if (user.role === 'admin') {
        const [pending, all] = await Promise.all([
          getPendingOrders(),
          getAllOrders()
        ]);
        setAvailableOrders(pending);
        setAdminAllOrders(all);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let channel;

    if (user.role === 'client') {
      channel = supabase
        .channel('orders-changes-client')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `client_id=eq.${user.id}`
          },
          (payload) => {
            loadOrders();
          }
        )
        .subscribe();
    } else if (user.role === 'supplier') {
      channel = supabase
        .channel('orders-changes-supplier')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `supplier_id=eq.${user.id}`
          },
          (payload) => {
            loadOrders();
          }
        )
        .subscribe();
    }

    // Also listen for custom refresh events from realtime hooks
    const handleRefreshEvent = () => {
      loadOrders();
    };

    window.addEventListener('refresh-orders', handleRefreshEvent);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('refresh-orders', handleRefreshEvent);
    };
  }, [user]);

  const placeOrder = async (
    items: CartItem[],
    deliveryAddress: string,
    coordinates: { lat: number; lng: number },
    paymentMethod: PaymentMethod,
    commissionSettings: { clientCommission: number; supplierCommission: number },
    zoneId?: string,
    deliveryInstructions?: string,
    usesProfileAddress?: boolean
  ) => {
    if (!user || user.role !== 'client') {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await createOrderService(
      user.id,
      items,
      deliveryAddress,
      coordinates,
      paymentMethod,
      commissionSettings,
      zoneId,
      deliveryInstructions,
      usesProfileAddress
    );

    if (result.success) {
      await loadOrders();
    }

    return result;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const updates: any = {};

    if (status === 'accepted') {
      updates.acceptedAt = new Date();
    }
    // Note: Le code de confirmation est généré automatiquement par le trigger SQL
    // 'trigger_set_delivery_confirmation_code' quand le statut passe à 'delivering'.
    // NE PAS générer de code côté frontend pour éviter d'écraser le trigger.
    else if (status === 'delivered') {
      updates.deliveredAt = new Date();
      // Note: Le code de confirmation reste en base pour l'historique/audit
    }

    const success = await updateOrderStatusService(orderId, status, updates);

    if (success) {
      await loadOrders();

      // Send delivery code email when order moves to delivering status
      if (status === 'delivering') {
        try {
          // Fetch the order to get the code generated by the SQL trigger
          const { data: order } = await supabase
            .from('orders')
            .select(`
              id,
              delivery_confirmation_code,
              client_id,
              supplier_id,
              profiles!orders_client_id_fkey(full_name, email),
              supplier:profiles!orders_supplier_id_fkey(business_name)
            `)
            .eq('id', orderId)
            .single();

          if (order && order.profiles?.email && order.delivery_confirmation_code) {
            await emailService.sendDeliveryCodeEmail({
              to: order.profiles.email,
              clientName: order.profiles.full_name || 'Client',
              clientEmail: order.profiles.email,
              orderId: order.id,
              deliveryCode: order.delivery_confirmation_code,  // Code from SQL trigger
              supplierName: order.supplier?.business_name || 'Fournisseur',
            });
          }
        } catch (emailError) {
          console.error('Failed to send delivery code email:', emailError);
          // Non-blocking - order status update succeeded
        }
      }
    }

    return success;
  };

  const acceptSupplierOffer = async (orderId: string): Promise<boolean> => {
    try {
      const success = await updateOrderStatusService(orderId, 'accepted', { acceptedAt: new Date() });
      if (success) {
        await loadOrders();
      }
      return success;
    } catch (error) {
      console.error('Error accepting offer:', error);
      return false;
    }
  };

  const rejectSupplierOffer = async (orderId: string): Promise<boolean> => {
    try {
      const success = await updateOrderStatusService(orderId, 'pending', {});
      if (success) {
        await loadOrders();
      }
      return success;
    } catch (error) {
      console.error('Error rejecting offer:', error);
      return false;
    }
  };

  const processPayment = async (orderId: string, paymentMethod: PaymentMethod, transactionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'preparing',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      // Send order paid email
      try {
        // Fetch order details with items
        const { data: order } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            delivery_address,
            client_id,
            supplier_id,
            profiles!orders_client_id_fkey(full_name, email),
            supplier:profiles!orders_supplier_id_fkey(business_name, phone),
            order_items(
              quantity,
              product:products(name, crate_type)
            )
          `)
          .eq('id', orderId)
          .single();

        if (order && order.profiles?.email) {
          const items = (order.order_items || []).map((item: any) => ({
            name: item.product?.name || 'Produit',
            quantity: item.quantity,
            unit: item.product?.crate_type || 'unité',
          }));

          await emailService.sendOrderPaidEmail({
            to: order.profiles.email,
            clientName: order.profiles.full_name || 'Client',
            clientEmail: order.profiles.email,
            orderId: order.id,
            supplierName: order.supplier?.business_name || 'Fournisseur',
            supplierPhone: order.supplier?.phone,
            totalAmount: order.total_amount,
            items,
            deliveryAddress: order.delivery_address,
          });
        }
      } catch (emailError) {
        console.error('Failed to send order paid email:', emailError);
        // Non-blocking - payment processing succeeded
      }

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      return false;
    }
  };

  const refreshOrders = async () => {
    await loadOrders();
  };

  const allOrders = [...clientOrders, ...availableOrders, ...supplierActiveDeliveries, ...supplierCompletedDeliveries, ...adminAllOrders];
  
  const clientCurrentOrder = clientOrders.find(order => 
    ['pending', 'awaiting-client-validation', 'accepted', 'preparing', 'delivering'].includes(order.status)
  ) || null;

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        clientCurrentOrder,
        availableOrders,
        supplierActiveDeliveries,
        supplierCompletedDeliveries,
        clientOrders,
        allOrders,
        isLoading,
        placeOrder,
        updateOrderStatus,
        acceptSupplierOffer,
        rejectSupplierOffer,
        processPayment,
        refreshOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
