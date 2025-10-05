import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, CartItem, PaymentMethod } from '../types';
import { useAuth } from './AuthContext';
import {
  createOrder as createOrderService,
  getOrdersByClient,
  getOrdersBySupplier,
  getPendingOrders,
  updateOrderStatus as updateOrderStatusService
} from '../services/orderService';

type OrderStep = 'pending' | 'offer-received' | 'payment' | 'contact-exchange' | 'tracking' | 'completed';

interface SupplierOffer {
  estimatedTime: number;
  supplierId: string;
  supplierName: string;
  supplierCommune: string;
}

interface OrderContextType {
  currentOrder: Order | null;
  clientCurrentOrder: Order | null;
  orderStep: OrderStep;
  supplierOffer: SupplierOffer | null;
  availableOrders: Order[];
  supplierActiveDeliveries: Order[];
  supplierCompletedDeliveries: Order[];
  clientOrders: Order[];
  isLoading: boolean;
  placeOrder: (
    items: CartItem[],
    deliveryAddress: string,
    coordinates: { lat: number; lng: number },
    paymentMethod: PaymentMethod,
    commissionSettings: { clientCommission: number; supplierCommission: number }
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  acceptOrderAsSupplier: (orderId: string, estimatedTime: number) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  acceptSupplierOffer: () => void;
  rejectSupplierOffer: () => void;
  cancelOrder: () => Promise<boolean>;
  confirmPayment: () => void;
  setOrderStep: (step: OrderStep) => void;
  updateDeliveryTime: (newTime: number) => void;
  completeDelivery: (orderId: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  processSupplierPayment: (orderId: string) => Promise<boolean>;
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
  const [clientCurrentOrder, setClientCurrentOrder] = useState<Order | null>(null);
  const [orderStep, setOrderStep] = useState<OrderStep>('pending');
  const [supplierOffer, setSupplierOffer] = useState<SupplierOffer | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [supplierActiveDeliveries, setSupplierActiveDeliveries] = useState<Order[]>([]);
  const [supplierCompletedDeliveries, setSupplierCompletedDeliveries] = useState<Order[]>([]);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
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
          getPendingOrders(),
          getOrdersBySupplier(user.id),
          getOrdersBySupplier(user.id)
        ]);

        setAvailableOrders(pending);
        setSupplierActiveDeliveries(active.filter(o =>
          ['accepted', 'preparing', 'delivering'].includes(o.status)
        ));
        setSupplierCompletedDeliveries(completed.filter(o => o.status === 'delivered'));
      } else if (user.role === 'admin') {
        const pending = await getPendingOrders();
        setAvailableOrders(pending);
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
    if (!user || user.role !== 'client') return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            loadOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const placeOrder = async (
    items: CartItem[],
    deliveryAddress: string,
    coordinates: { lat: number; lng: number },
    paymentMethod: PaymentMethod,
    commissionSettings: { clientCommission: number; supplierCommission: number }
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
      commissionSettings
    );

    if (result.success && result.orderId) {
      await loadOrders();
      const newOrder = clientOrders.find(o => o.id === result.orderId);
      if (newOrder) {
        setClientCurrentOrder(newOrder);
        setOrderStep('pending');
      }
    }

    return result;
  };

  const acceptOrderAsSupplier = async (orderId: string, estimatedTime: number): Promise<boolean> => {
    if (!user || user.role !== 'supplier') {
      return false;
    }

    const success = await updateOrderStatusService(
      orderId,
      'awaiting-client-validation',
      {
        supplierId: user.id,
        estimatedDeliveryTime: estimatedTime
      }
    );

    if (success) {
      const offer: SupplierOffer = {
        estimatedTime,
        supplierId: user.id,
        supplierName: (user as any)?.businessName || user.name,
        supplierCommune: user.address.split(',')[1]?.trim() || 'Abidjan'
      };

      setSupplierOffer(offer);
      await loadOrders();
    }

    return success;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const updates: any = {};

    if (status === 'accepted') {
      updates.acceptedAt = new Date();
    } else if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }

    const success = await updateOrderStatusService(orderId, status, updates);

    if (success) {
      await loadOrders();

      if (clientCurrentOrder?.id === orderId) {
        const updatedOrder = clientOrders.find(o => o.id === orderId);
        if (updatedOrder) {
          setClientCurrentOrder(updatedOrder);
        }
      }
    }

    return success;
  };

  const acceptSupplierOffer = () => {
    setOrderStep('payment');
  };

  const rejectSupplierOffer = () => {
    setSupplierOffer(null);
    setOrderStep('pending');
  };

  const cancelOrder = async (): Promise<boolean> => {
    if (!clientCurrentOrder) return false;

    const success = await updateOrderStatus(clientCurrentOrder.id, 'cancelled');

    if (success) {
      setClientCurrentOrder(null);
      setSupplierOffer(null);
      setOrderStep('pending');
    }

    return success;
  };

  const confirmPayment = () => {
    if (clientCurrentOrder && supplierOffer) {
      updateOrderStatus(clientCurrentOrder.id, 'accepted');
      setOrderStep('contact-exchange');
    }
  };

  const updateDeliveryTime = (newTime: number) => {
    if (supplierOffer) {
      setSupplierOffer(prev => prev ? { ...prev, estimatedTime: newTime } : null);
    }
    if (clientCurrentOrder) {
      setClientCurrentOrder(prev =>
        prev ? { ...prev, estimatedDeliveryTime: newTime } : null
      );
    }
  };

  const completeDelivery = async (orderId: string): Promise<boolean> => {
    const success = await updateOrderStatus(orderId, 'delivered');

    if (success && clientCurrentOrder?.id === orderId) {
      setOrderStep('completed');
    }

    return success;
  };

  const processSupplierPayment = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'transferred',
          transferred_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error processing supplier payment:', error);
        return false;
      }

      await loadOrders();
      return true;
    } catch (error) {
      console.error('Exception processing supplier payment:', error);
      return false;
    }
  };

  const refreshOrders = async () => {
    await loadOrders();
  };

  return (
    <OrderContext.Provider value={{
      currentOrder,
      clientCurrentOrder,
      orderStep,
      supplierOffer,
      availableOrders,
      supplierActiveDeliveries,
      supplierCompletedDeliveries,
      clientOrders,
      isLoading,
      placeOrder,
      acceptOrderAsSupplier,
      updateOrderStatus,
      acceptSupplierOffer,
      rejectSupplierOffer,
      cancelOrder,
      confirmPayment,
      setOrderStep,
      updateDeliveryTime,
      completeDelivery,
      refreshOrders,
      processSupplierPayment
    }}>
      {children}
    </OrderContext.Provider>
  );
};
