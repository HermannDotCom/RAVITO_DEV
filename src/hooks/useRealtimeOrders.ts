import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { realtimeService, RealtimeSubscription } from '../services/realtimeService';
import { useToastNotifications } from '../context/ToastContext';

export const useRealtimeOrders = () => {
  const { user } = useAuth();
  const toastNotifications = useToastNotifications();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Supplier: Listen for new orders in their zones
    if (user.role === 'supplier') {
      subscriptionRef.current = realtimeService.subscribeToSupplierOrders(
        user.id,
        (order) => {
          console.log('New order notification for supplier:', order);
          
          // Show toast notification
          toastNotifications.newOrder(
            (order.order_number as string) || (order.id as string)?.substring(0, 8) || 'N/A',
            (order.client as any)?.name || 'Client',
            (order.total_amount as number) || 0,
            () => {
              // Navigate to available orders
              window.location.hash = '#available-orders';
            }
          );
        },
        (order) => {
          console.log('Order updated for supplier:', order);
          
          // Show toast for status changes
          const statusLabels: Record<string, string> = {
            'accepted': 'Acceptée',
            'preparing': 'En préparation',
            'delivering': 'En livraison',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
          };
          
          const status = order.status as string;
          const statusLabel = statusLabels[status] || status;
          toastNotifications.orderStatusUpdate(
            (order.order_number as string) || (order.id as string)?.substring(0, 8) || 'N/A',
            statusLabel
          );
        }
      );
    }

    // Client: Listen for new offers and order updates
    if (user.role === 'client') {
      subscriptionRef.current = realtimeService.subscribeToClientOffers(
        user.id,
        (offer) => {
          console.log('New offer notification for client:', offer);
          
          // Show toast notification
          const supplier = offer.supplier as any;
          const order = offer.order as any;
          toastNotifications.newOffer(
            supplier?.business_name || supplier?.name || 'Fournisseur',
            order?.id?.substring(0, 8) || 'N/A',
            () => {
              // Navigate to orders
              window.location.hash = '#orders';
            }
          );
        },
        (offer) => {
          console.log('Offer updated for client:', offer);
        }
      );
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, user?.role, toastNotifications]);
};

export const useRealtimeDeliveryStatus = (orderId: string | null) => {
  const toastNotifications = useToastNotifications();
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    subscriptionRef.current = realtimeService.subscribeToDeliveryStatus(
      orderId,
      (order) => {
        console.log('Delivery status updated:', order);
        
        const statusLabels: Record<string, string> = {
          'accepted': 'Commande acceptée',
          'preparing': 'Préparation en cours',
          'delivering': 'En cours de livraison',
          'delivered': 'Livraison terminée',
          'cancelled': 'Commande annulée'
        };
        
        const status = order.status as string;
        const message = statusLabels[status] || status;
        toastNotifications.deliveryUpdate(
          (order.order_number as string) || (order.id as string)?.substring(0, 8) || 'N/A',
          message
        );
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [orderId, toastNotifications]);
};
