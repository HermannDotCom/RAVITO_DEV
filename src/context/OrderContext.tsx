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

// Fonction utilitaire pour générer un code à 4 chiffres
const generateConfirmationCode = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
    zoneId?: string
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
        const pendingOrders = await getPendingOrders(undefined, true); // Client search for available orders
        setAvailableOrders(pendingOrders);
      } else if (user.role === 'supplier') {
        const [pending, active, completed] = await Promise.all([
          getPendingOrders(user.id, false), // Supplier search
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
          getPendingOrders(undefined, true), // Admin search for all pending orders (potentially filtered by night guard)
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
            console.log('📦 Client order change detected:', payload);
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
            console.log('📦 Supplier order change detected:', payload);
            loadOrders();
          }
        )
        .subscribe();
    }

    // Also listen for custom refresh events from realtime hooks
    const handleRefreshEvent = () => {
      console.log('🔄 Manual refresh triggered');
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
    zoneId?: string
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
      zoneId
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
    } else if (status === 'delivering') {
      updates.delivery_confirmation_code = generateConfirmationCode();
    } else if (status === 'delivered') {
      updates.deliveredAt = new Date();
      updates.delivery_confirmation_code = null; // Optionnel: effacer le code après livraison
    }

    const success = await updateOrderStatusService(orderId, status, updates);

    if (success) {
      await loadOrders();
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
