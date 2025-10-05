import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, SupplierOffer } from '../types';

type OrderStep = 'cart' | 'checkout' | 'pending' | 'offer-received' | 'payment' | 'preparing' | 'delivering' | 'delivered';

interface OrderContextType {
  currentOrder: Order | null;
  clientCurrentOrder: Order | null;
  orderStep: OrderStep;
  supplierOffer: SupplierOffer | null;
  acceptSupplierOffer: () => Promise<void>;
  rejectSupplierOffer: () => Promise<void>;
  cancelOrder: () => Promise<void>;
  confirmPayment: () => Promise<void>;
  setOrderStep: (step: OrderStep) => void;
  updateDeliveryTime: (orderId: string, time: number) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider');
  return context;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [clientCurrentOrder, setClientCurrentOrder] = useState<Order | null>(null);
  const [orderStep, setOrderStep] = useState<OrderStep>('cart');
  const [supplierOffer, setSupplierOffer] = useState<SupplierOffer | null>(null);

  const acceptSupplierOffer = async () => {};
  const rejectSupplierOffer = async () => {};
  const cancelOrder = async () => {};
  const confirmPayment = async () => {};
  const updateDeliveryTime = async () => true;

  return (
    <OrderContext.Provider value={{
      currentOrder,
      clientCurrentOrder,
      orderStep,
      supplierOffer,
      acceptSupplierOffer,
      rejectSupplierOffer,
      cancelOrder,
      confirmPayment,
      setOrderStep,
      updateDeliveryTime
    }}>
      {children}
    </OrderContext.Provider>
  );
};
