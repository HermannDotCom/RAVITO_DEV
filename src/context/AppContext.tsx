import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, Order, OrderStatus, PaymentMethod, CrateType, Rating, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { verifyDataIntegrity } from '../utils/dataManager';

type OrderStep = 'pending' | 'offer-received' | 'payment' | 'contact-exchange' | 'tracking' | 'completed';

interface SupplierOffer {
  estimatedTime: number;
  supplierId: string;
  supplierName: string;
  supplierCommune: string;
}

interface AppContextType {
  cart: CartItem[];
  currentOrder: Order | null;
  clientCurrentOrder: Order | null;
  orderStep: OrderStep;
  supplierOffer: SupplierOffer | null;
  allOrders: Order[];
  availableOrders: Order[];
  supplierActiveDeliveries: Order[];
  supplierCompletedDeliveries: Order[];
  allRatings: Rating[];
  addToCart: (product: Product, quantity: number, withConsigne: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number, withConsigne?: boolean) => void;
  clearCart: () => void;
  placeOrder: (deliveryAddress: string, coordinates: { lat: number; lng: number }, paymentMethod: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  acceptSupplierOffer: () => void;
  rejectSupplierOffer: () => void;
  cancelOrder: () => void;
  confirmPayment: () => void;
  setOrderStep: (step: OrderStep) => void;
  updateDeliveryTime: (newTime: number) => void;
  getCartTotal: () => { subtotal: number; consigneTotal: number; total: number; cart: CartItem[] };
  acceptOrderAsSupplier: (orderId: string, estimatedTime: number) => void;
  completeDelivery: (orderId: string) => void;
  submitRating: (orderId: string, ratings: any, fromRole: UserRole, toRole: UserRole) => void;
  processSupplierPayment: (orderId: string) => void;
  getOrderRatings: (orderId: string) => { clientRating?: Rating; supplierRating?: Rating };
  canShowRatings: (orderId: string) => boolean;
  needsRating: (orderId: string, userRole: UserRole) => boolean;
  commissionSettings: { clientCommission: number; supplierCommission: number };
  getCartTotalWithCommission: () => { subtotal: number; consigneTotal: number; clientCommission: number; total: number; cart: CartItem[] };
  getSupplierNetAmount: (orderAmount: number) => { grossAmount: number; commission: number; netAmount: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [clientCurrentOrder, setClientCurrentOrder] = useState<Order | null>(null);
  const [orderStep, setOrderStep] = useState<OrderStep>('pending');
  const [supplierOffer, setSupplierOffer] = useState<SupplierOffer | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [supplierActiveDeliveries, setSupplierActiveDeliveries] = useState<Order[]>([]);
  const [supplierCompletedDeliveries, setSupplierCompletedDeliveries] = useState<Order[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const { user } = useAuth();

  // Commission settings state - initialized with default values
  const [commissionSettings, setCommissionSettings] = useState({
    clientCommission: 8, // percentage
    supplierCommission: 2 // percentage
  });

  // Load commission settings from localStorage
  useEffect(() => {
    const storedCommissionSettings = localStorage.getItem('distri-night-commission-settings');
    if (storedCommissionSettings) {
      const settings = JSON.parse(storedCommissionSettings);
      setCommissionSettings(settings);
    }
  }, []);

  // Listen for commission settings updates
  useEffect(() => {
    const handleCommissionUpdate = (event: any) => {
      const newSettings = event.detail;
      setCommissionSettings(newSettings);
      // Also save to localStorage to ensure persistence
      localStorage.setItem('distri-night-commission-settings', JSON.stringify(newSettings));
    };

    window.addEventListener('commissionSettingsUpdated', handleCommissionUpdate as EventListener);
    return () => {
      window.removeEventListener('commissionSettingsUpdated', handleCommissionUpdate as EventListener);
    };
  }, []);

  // Load orders from localStorage on mount
  useEffect(() => {
    const storedOrders = localStorage.getItem('distri-night-orders');
    if (storedOrders) {
      const orders = JSON.parse(storedOrders).map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        acceptedAt: order.acceptedAt ? new Date(order.acceptedAt) : undefined,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined
      }));
      setAllOrders(orders);
      
      // Set available orders (pending status)
      setAvailableOrders(orders.filter((order: Order) => order.status === 'pending'));
      
      // Set supplier active deliveries (accepted, preparing, delivering)
      setSupplierActiveDeliveries(orders.filter((order: Order) => 
        ['accepted', 'preparing', 'delivering'].includes(order.status)
      ));
    }
    
    // Vérifier l'intégrité des données au chargement
    const { isValid, errors } = verifyDataIntegrity();
    if (!isValid) {
      console.warn('🚨 Problèmes d\'intégrité détectés:', errors);
    }
    
    // Check for supplier offers for current order
    if (currentOrder) {
      const storedOffer = localStorage.getItem(`supplier-offer-${currentOrder.id}`);
      if (storedOffer && !supplierOffer) {
        const offer = JSON.parse(storedOffer);
        setSupplierOffer(offer);
        setOrderStep('offer-received');
        // Remove the offer from storage once displayed
        localStorage.removeItem(`supplier-offer-${currentOrder.id}`);
      }
    }
  }, []);

  // Check for new supplier offers when currentOrder changes
  useEffect(() => {
    if (clientCurrentOrder && clientCurrentOrder.status === 'pending') {
      const checkForOffer = () => {
        const storedOffer = localStorage.getItem(`supplier-offer-${clientCurrentOrder.id}`);
        if (storedOffer && !supplierOffer) {
          const offer = JSON.parse(storedOffer);
          setSupplierOffer(offer);
          setOrderStep('offer-received');
          // Remove the offer from storage once displayed
          localStorage.removeItem(`supplier-offer-${clientCurrentOrder.id}`);
        }
      };

      // Check immediately
      checkForOffer();

      // Check periodically for new offers
      const interval = setInterval(checkForOffer, 1000);
      return () => clearInterval(interval);
    }
  }, [clientCurrentOrder, supplierOffer]);

  // Save orders to localStorage whenever allOrders changes
  useEffect(() => {
    if (allOrders.length > 0) {
      localStorage.setItem('distri-night-orders', JSON.stringify(allOrders));
    }
    
    // Update derived states
    setAvailableOrders(allOrders.filter(order => order.status === 'pending' || order.status === 'awaiting-client-validation'));
    setSupplierActiveDeliveries(allOrders.filter(order => 
      ['accepted', 'preparing', 'delivering'].includes(order.status)
    ));
    setSupplierCompletedDeliveries(allOrders.filter(order => 
      order.status === 'delivered'
    ));
  }, [allOrders]);

  const addToCart = (product: Product, quantity: number, withConsigne: boolean) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, withConsigne }
            : item
        );
      }
      
      return [...prev, { product, quantity, withConsigne }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartItem = (productId: string, quantity: number, withConsigne?: boolean) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity, ...(withConsigne !== undefined && { withConsigne }) }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.pricePerUnit * item.quantity), 0);
    const consigneTotal = cart.reduce((sum, item) => 
      sum + (item.withConsigne ? item.product.consigneAmount * item.quantity : 0), 0
    );
    return { subtotal, consigneTotal, total: subtotal + consigneTotal, cart };
  };

  const getCartTotalWithCommission = () => {
    const { subtotal, consigneTotal } = getCartTotal();
    const orderTotal = subtotal + consigneTotal;
    const clientCommission = Math.round(orderTotal * (commissionSettings.clientCommission / 100));
    const total = orderTotal + clientCommission;
    return { subtotal, consigneTotal, clientCommission, total, cart };
  };

  const getSupplierNetAmount = (orderAmount: number) => {
    // Le montant fournisseur est calculé SANS la commission client
    const baseAmount = orderAmount / (1 + commissionSettings.clientCommission / 100);
    const commission = Math.round(baseAmount * (commissionSettings.supplierCommission / 100));
    const netAmount = orderAmount - commission;
    return { grossAmount: baseAmount, commission, netAmount };
  };

  const placeOrder = async (deliveryAddress: string, coordinates: { lat: number; lng: number }, paymentMethod: string): Promise<string> => {
    // Vérification de sécurité - seuls les clients approuvés peuvent passer commande
    if (!user || user.role !== 'client' || !user.isApproved) {
      throw new Error('Accès non autorisé pour passer une commande');
    }
    
    const { total, consigneTotal } = getCartTotalWithCommission();
    
    const order: Order = {
      id: `CMD-${Date.now()}`,
      clientId: user.id, // Utiliser l'ID réel de l'utilisateur connecté
      items: [...cart],
      totalAmount: total,
      status: 'pending',
      consigneTotal,
      deliveryAddress,
      coordinates,
      paymentMethod: paymentMethod as PaymentMethod,
      createdAt: new Date()
    };

    setClientCurrentOrder(order);
    setAllOrders(prev => [...prev, order]);
    clearCart();
    setOrderStep('pending');
    
    return order.id;
  };

  const acceptOrderAsSupplier = (orderId: string, estimatedTime: number) => {
    // Vérification de sécurité - seuls les fournisseurs approuvés peuvent accepter
    if (!user || user.role !== 'supplier' || !user.isApproved) {
      throw new Error('Accès non autorisé pour accepter une commande');
    }
    
    const offer: SupplierOffer = {
      estimatedTime,
      supplierId: user.id, // Utiliser l'ID réel du fournisseur
      supplierName: (user as any)?.businessName || user.name,
      supplierCommune: (user as any)?.address?.split(',')[1]?.trim() || 'Abidjan'
    };
    
    // Update order status to awaiting client validation
    setAllOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'awaiting-client-validation',
            supplierId: offer.supplierId,
            estimatedDeliveryTime: estimatedTime
          }
        : order
    ));

    // Store the offer globally for the specific order
    localStorage.setItem(`supplier-offer-${orderId}`, JSON.stringify(offer));
    
    // Trigger notification for client if this is their current order
    if (clientCurrentOrder?.id === orderId) {
      setSupplierOffer(offer);
      setOrderStep('offer-received');
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setAllOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status,
            ...(status === 'delivered' && { deliveredAt: new Date() })
          }
        : order
    ));

    if (clientCurrentOrder?.id === orderId) {
      setClientCurrentOrder(prev => prev ? { 
        ...prev, 
        status,
        ...(status === 'delivered' && { deliveredAt: new Date() })
      } : null);
    }
  };

  const acceptSupplierOffer = () => {
    setOrderStep('payment');
  };

  const rejectSupplierOffer = () => {
    setSupplierOffer(null);
    setOrderStep('pending');
    
    // Simulate finding another supplier
    setTimeout(() => {
      if (clientCurrentOrder) {
        const newOffer: SupplierOffer = {
          estimatedTime: Math.floor(Math.random() * 15) + 20,
          supplierId: 'supplier-2',
          supplierName: 'Dépôt Cocody Express',
          supplierCommune: 'Cocody'
        };
        
        setSupplierOffer(newOffer);
        setClientCurrentOrder(prev => prev ? { 
          ...prev, 
          supplierId: newOffer.supplierId,
          estimatedDeliveryTime: newOffer.estimatedTime 
        } : null);
        setOrderStep('offer-received');
      }
    }, 2000);
  };

  const cancelOrder = () => {
    if (clientCurrentOrder) {
      setAllOrders(prev => prev.map(order => 
        order.id === clientCurrentOrder.id 
          ? { ...order, status: 'cancelled' }
          : order
      ));
    }
    setClientCurrentOrder(null);
    setSupplierOffer(null);
    setOrderStep('pending');
  };

  const confirmPayment = () => {
    if (clientCurrentOrder && supplierOffer) {
      // Update the order status to accepted and move it from available to active deliveries
      setAllOrders(prev => prev.map(order => 
        order.id === clientCurrentOrder.id 
          ? { 
              ...order, 
              status: 'accepted', 
              supplierId: supplierOffer.supplierId,
              estimatedDeliveryTime: supplierOffer.estimatedTime,
              acceptedAt: new Date()
            }
          : order
      ));
      
      setClientCurrentOrder(prev => prev ? { 
        ...prev, 
        status: 'accepted', 
        supplierId: supplierOffer.supplierId,
        estimatedDeliveryTime: supplierOffer.estimatedTime,
        acceptedAt: new Date()
      } : null);
      setOrderStep('contact-exchange');
    }
  };

  const updateDeliveryTime = (newTime: number) => {
    if (supplierOffer) {
      setSupplierOffer(prev => prev ? { ...prev, estimatedTime: newTime } : null);
    }
    if (clientCurrentOrder) {
      setClientCurrentOrder(prev => prev ? { ...prev, estimatedDeliveryTime: newTime } : null);
    }
  };

  const completeDelivery = (orderId: string) => {
    // Update order status to delivered with timestamp
    setAllOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'delivered' as OrderStatus,
            deliveredAt: new Date()
          }
        : order
    ));
    
    // If this is the current order, move to rating step
    if (clientCurrentOrder?.id === orderId) {
      setClientCurrentOrder(prev => prev ? { 
        ...prev, 
        status: 'delivered' as OrderStatus,
        deliveredAt: new Date()
      } : null);
      setOrderStep('completed');
    }
  };

  const submitRating = (orderId: string, ratings: any, fromRole: UserRole, toRole: UserRole) => {
    if (!user) return;
    
    // Create rating data
    const ratingData: Rating = {
      id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      fromUserId: user.id,
      toUserId: fromRole === 'client' ? 'supplier-temp' : 'client-temp',
      fromUserRole: fromRole,
      toUserRole: toRole,
      punctuality: ratings.punctuality,
      quality: ratings.quality,
      communication: ratings.communication,
      overall: ratings.overall,
      comment: ratings.comment,
      createdAt: new Date()
    };
    
    // Add rating to local state
    setAllRatings(prev => [...prev, ratingData]);
    
    // Save to localStorage immediately
    const updatedRatings = [...allRatings, ratingData];
    localStorage.setItem('distri-night-ratings', JSON.stringify(updatedRatings));
    
    // Check if both parties have now rated
    const { clientRating, supplierRating } = getOrderRatings(orderId);
    const hasClientRating = clientRating || (fromRole === 'client');
    const hasSupplierRating = supplierRating || (fromRole === 'supplier');
    
    // Only reset current order flow if client is rating and this completes the rating process
    if (fromRole === 'client' && hasSupplierRating) {
      setClientCurrentOrder(null);
      setSupplierOffer(null);
      setOrderStep('pending');
    }
  };
  
  const getOrderRatings = (orderId: string) => {
    const orderRatings = allRatings.filter(rating => rating.orderId === orderId);
    return {
      clientRating: orderRatings.find(rating => rating.fromUserRole === 'client'),
      supplierRating: orderRatings.find(rating => rating.fromUserRole === 'supplier')
    };
  };
  
  const canShowRatings = (orderId: string) => {
    const { clientRating, supplierRating } = getOrderRatings(orderId);
    return !!(clientRating && supplierRating); // Both ratings must exist
  };
  
  const needsRating = (orderId: string, userRole: UserRole) => {
    const { clientRating, supplierRating } = getOrderRatings(orderId);
    
    if (userRole === 'client') {
      return !clientRating; // Client needs to rate if no client rating exists
    } else if (userRole === 'supplier') {
      return !supplierRating; // Supplier needs to rate if no supplier rating exists
    }
    
    return false;
  };

  const processSupplierPayment = (orderId: string) => {
    setAllOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            paymentStatus: 'transferred' as const,
            transferredAt: new Date()
          }
        : order
    ));
  };
  // Load and save ratings
  useEffect(() => {
    // Load ratings from localStorage on mount
    const storedRatings = localStorage.getItem('distri-night-ratings');
    if (storedRatings && allRatings.length === 0) {
      const ratings = JSON.parse(storedRatings).map((rating: any) => ({
        ...rating,
        createdAt: new Date(rating.createdAt)
      }));
      setAllRatings(ratings);
    }
  }, [allRatings]);

  // Save ratings to localStorage whenever allRatings changes
  useEffect(() => {
    if (allRatings.length > 0) {
      localStorage.setItem('distri-night-ratings', JSON.stringify(allRatings));
    }
  }, [allRatings]);

  return (
    <AppContext.Provider value={{
      cart,
      currentOrder,
      clientCurrentOrder,
      orderStep,
      supplierOffer,
      allOrders,
      availableOrders,
      supplierActiveDeliveries,
      supplierCompletedDeliveries,
      allRatings,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      placeOrder,
      updateOrderStatus,
      acceptSupplierOffer,
      rejectSupplierOffer,
      cancelOrder,
      confirmPayment,
      setOrderStep,
      updateDeliveryTime,
      getCartTotal,
      acceptOrderAsSupplier,
      completeDelivery,
      submitRating,
      processSupplierPayment,
      getOrderRatings,
      canShowRatings,
      needsRating,
      commissionSettings,
      getCartTotalWithCommission,
      getSupplierNetAmount
    }}>
      {children}
    </AppContext.Provider>
  );
};