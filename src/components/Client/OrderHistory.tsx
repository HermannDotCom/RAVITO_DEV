import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Clock, MapPin, Filter, Search, CheckCircle, XCircle, Truck, Calendar, Eye, Download, Phone, Archive, CreditCard, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useRating } from '../../context/RatingContext';
import { Order, OrderStatus, CrateType } from '../../types';
import { UnifiedRatingForm } from '../Shared/UnifiedRatingForm';
import { MutualRatingsDisplay } from '../Shared/MutualRatingsDisplay';
import { OrderDetailsWithOffers } from './OrderDetailsWithOffers';
import { PaymentInterface } from './PaymentInterface';
import { OrderDetailsModal } from './OrderDetailsModal';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../ui/StatCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RatingBadge } from '../Shared/RatingBadge';

interface OrderHistoryProps {
  onNavigate: (section: string) => void;
  initialOrderIdToRate?: string | null;
  onOrderRated?: () => void;
}

interface SupplierProfile {
  id: string;
  name: string;
  business_name?: string;
  phone?: string;
  rating?: number;
}

// Helper to get delivery confirmation code (handles both camelCase and snake_case)
const getDeliveryConfirmationCode = (order: Order): string | undefined => {
  return order.deliveryConfirmationCode || order.delivery_confirmation_code;
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onNavigate, initialOrderIdToRate, onOrderRated }) => {
  const { user } = useAuth();
  const { cart } = useCart();
  const { currentOrder: clientCurrentOrder, allOrders, updateOrderStatus, refreshOrders } = useOrder();
  const { getOrderRatings, needsRating, submitRating } = useRating();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, SupplierProfile>>({});
  const [orderRatings, setOrderRatings] = useState<Record<string, number | null>>({});

  // Statuts post-paiement où l'identité du fournisseur est révélée
  const REVEALED_STATUSES: OrderStatus[] = ['paid', 'preparing', 'delivering', 'delivered', 'awaiting-rating'];

  // Extract loadSupplierProfiles as a reusable function
  const loadSupplierProfiles = useCallback(async () => {
    if (!user) return;

    // Use the new function that filters by payment status
    const { data: profiles, error } = await supabase
      .rpc('get_supplier_profiles_for_client', { client_user_id: user.id });

    if (error) {
      console.error('Error loading supplier profiles:', error);
      return;
    }

    const profilesMap: Record<string, SupplierProfile> = {};

    if (profiles) {
      for (const profile of profiles) {
        profilesMap[profile.id] = {
          id: profile.id,
          name: profile.name,
          business_name: profile.business_name,
          phone: profile.phone,
          rating: profile.rating
        };
      }
    }

    setSupplierProfiles(profilesMap);
  }, [user]);

  // Load supplier profiles ONLY for paid orders (respects anonymity rules)
  useEffect(() => {
    loadSupplierProfiles();
  }, [loadSupplierProfiles, allOrders]);

  // Synchroniser les commandes sélectionnées avec les mises à jour du contexte
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = allOrders.find(o => o.id === selectedOrder.id);
      // Only update if the order exists and status has actually changed
      if (updatedOrder && updatedOrder.status !== selectedOrder.status) {
        setSelectedOrder(updatedOrder);
      }
    }
    if (orderForPayment) {
      const updatedOrder = allOrders.find(o => o.id === orderForPayment.id);
      // Only update if the order exists and status has actually changed
      if (updatedOrder && updatedOrder.status !== orderForPayment.status) {
        setOrderForPayment(updatedOrder);
      }
    }
    // Depends on allOrders (triggers when orders update) and IDs (stable, prevent infinite loops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOrders, selectedOrder?.id, orderForPayment?.id]);

  // Reload order details including confirmation code when modal opens for delivering orders
  useEffect(() => {
    const reloadOrderDetails = async () => {
      // Guard: only reload if all conditions are met and code doesn't already exist
      if (!showOrderDetails || !selectedOrder || selectedOrder.status !== 'delivering' || selectedOrder.deliveryConfirmationCode) {
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('delivery_confirmation_code')
        .eq('id', selectedOrder.id)
        .single();

      if (!error && data?.delivery_confirmation_code) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          deliveryConfirmationCode: data.delivery_confirmation_code
        } : null);
      }
    };

    reloadOrderDetails();
    // Dependencies: modal open state and order ID (status/code checked in guard)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrderDetails, selectedOrder?.id]);

  // Auto-open rating modal when initialOrderIdToRate is provided
  useEffect(() => {
    if (initialOrderIdToRate) {
      // Combine all orders to search from
      const searchOrders = clientCurrentOrder 
        ? [clientCurrentOrder, ...allOrders.filter(o => o.clientId === user?.id)]
        : allOrders.filter(o => o.clientId === user?.id);
      
      const order = searchOrders.find(o => o.id === initialOrderIdToRate);
      if (order && order.supplierId && order.status === 'delivered') {
        setSelectedOrderForRating(order);
        setShowRatingModal(true);
        // Clear the initialOrderIdToRate after opening
        if (onOrderRated) {
          onOrderRated();
        }
      }
    }
  }, [initialOrderIdToRate, allOrders, clientCurrentOrder, user?.id, onOrderRated]);

  // Filtrer les commandes de l'utilisateur connecté
  const userOrders = allOrders.filter(order =>
    order.clientId === user?.id
  );

  // Combiner la commande en cours avec l'historique (éviter les doublons)
  // Utiliser un Map pour garantir l'unicité par ID
  const allUserOrders = useMemo(() => {
    const ordersMap = new Map<string, Order>();

    // Ajouter d'abord toutes les commandes de l'historique
    userOrders.forEach(order => {
      ordersMap.set(order.id, order);
    });

    // Écraser avec la commande en cours si elle existe (version la plus récente)
    if (clientCurrentOrder) {
      ordersMap.set(clientCurrentOrder.id, clientCurrentOrder);
    }

    return Array.from(ordersMap.values());
  }, [clientCurrentOrder, userOrders]);

  // Memoize order IDs to prevent unnecessary re-renders
  const orderIds = useMemo(() => allUserOrders.map(o => o.id), [allUserOrders]);

  // Load order-specific ratings where the client is the recipient
  useEffect(() => {
    const loadOrderRatings = async () => {
      if (!user || orderIds.length === 0) return;

      // Fetch ratings where the client is the recipient (to_user_id)
      const { data, error } = await supabase
        .from('ratings')
        .select('order_id, overall')
        .in('order_id', orderIds)
        .eq('to_user_id', user.id);

      if (error) {
        console.error('Error loading order ratings:', error);
        return;
      }

      const ratingsMap: Record<string, number | null> = {};
      data?.forEach(r => {
        ratingsMap[r.order_id] = r.overall;
      });
      setOrderRatings(ratingsMap);
    };

    loadOrderRatings();
  }, [orderIds, user]);

  // Appliquer les filtres
  const filteredOrders = allUserOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);

      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusInfo = (status: OrderStatus) => {
    const configs = {
      'pending': { label: 'En attente', variant: 'warning' as const, icon: Clock, textColor: 'text-yellow-600' },
      'pending-offers': { label: 'En attente d\'offres', variant: 'warning' as const, icon: Clock, textColor: 'text-yellow-600' },
      'offers-received': { label: 'Offres reçues', variant: 'info' as const, icon: Package, textColor: 'text-blue-600' },
      'awaiting-payment': { label: 'En attente de paiement', variant: 'warning' as const, icon: CreditCard, textColor: 'text-orange-600' },
      'paid': { label: 'Payée', variant: 'success' as const, icon: CheckCircle, textColor: 'text-green-600' },
      'awaiting-client-validation': { label: 'En attente de validation', variant: 'warning' as const, icon: Clock, textColor: 'text-orange-600' },
      'accepted': { label: 'Acceptée', variant: 'info' as const, icon: CheckCircle, textColor: 'text-blue-600' },
      'preparing': { label: 'En préparation', variant: 'info' as const, icon: Package, textColor: 'text-purple-600' },
      'delivering': { label: 'En livraison', variant: 'warning' as const, icon: Truck, textColor: 'text-orange-600' },
      'delivered': { label: 'Livrée', variant: 'success' as const, icon: CheckCircle, textColor: 'text-green-600' },
      'awaiting-rating': { label: 'En attente d\'évaluation', variant: 'warning' as const, icon: Star, textColor: 'text-yellow-600' },
      'cancelled': { label: 'Annulée', variant: 'danger' as const, icon: XCircle, textColor: 'text-red-600' },
    };
    return configs[status] || { label: 'Inconnu', variant: 'default' as const, icon: Package, textColor: 'text-gray-600' };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      maximumFractionDigits: 0 
    }).format(price) + ' FCFA';
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatDateShort = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      orange: 'Orange Money',
      mtn: 'MTN Mobile Money',
      moov: 'Moov Money',
      wave: 'Wave',
      card: 'Carte bancaire'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return 'Fournisseur inconnu';
    const profile = supplierProfiles[supplierId];
    if (profile) {
      return profile.business_name || profile.name || 'Fournisseur inconnu';
    }
    return 'Fournisseur inconnu';
  };

  const getSupplierProfile = (supplierId?: string): SupplierProfile | null => {
    if (!supplierId) return null;
    return supplierProfiles[supplierId] || null;
  };

  const isSupplierRevealed = (orderStatus: OrderStatus): boolean => {
    return REVEALED_STATUSES.includes(orderStatus);
  };

  // Calculer les statistiques réelles
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  // Calculer les statistiques de la semaine
  const ordersThisWeek = filteredOrders.filter(order => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    return orderDate >= weekAgo;
  }).length;

  // Trouver le fournisseur préféré (le plus utilisé)
  const getFavoriteSupplier = () => {
    const supplierCounts: { [key: string]: number } = {};
    
    filteredOrders.forEach(order => {
      if (order.supplierId) {
        supplierCounts[order.supplierId] = (supplierCounts[order.supplierId] || 0) + 1;
      }
    });
    
    const favoriteSupplierId = Object.keys(supplierCounts).reduce((max, supplierId) => 
      supplierCounts[supplierId] > (supplierCounts[max] || 0) ? supplierId : max, ''
    );
    
    return favoriteSupplierId ? getSupplierName(favoriteSupplierId) : 'Aucun';
  };

  // Calculer le temps moyen de livraison
  const getAverageDeliveryTime = () => {
    const deliveredOrders = filteredOrders.filter(order =>
      order.status === 'delivered' && order.acceptedAt && order.deliveredAt
    );

    if (deliveredOrders.length === 0) return 0;

    const totalMinutes = deliveredOrders.reduce((sum, order) => {
      const deliveredAt = order.deliveredAt instanceof Date ? order.deliveredAt : new Date(order.deliveredAt!);
      const acceptedAt = order.acceptedAt instanceof Date ? order.acceptedAt : new Date(order.acceptedAt!);
      const deliveryTime = (deliveredAt.getTime() - acceptedAt.getTime()) / 60000;
      return sum + deliveryTime;
    }, 0);

    return Math.round(totalMinutes / deliveredOrders.length);
  };

  const handleCancelOrder = useCallback((orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      updateOrderStatus(orderId, 'cancelled');
    }
  }, [updateOrderStatus]);

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    if (order.status === 'offers-received' || order.status === 'awaiting-payment') {
      setShowOffersModal(true);
    } else {
      setShowOrderDetails(true);
    }
  }, []);

  const handleRateSupplier = useCallback(async (order: Order) => {
    if (!order.supplierId) {
      console.error('No supplier ID for this order');
      return;
    }

    // Vérifier si le client a déjà évalué cette commande
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('order_id', order.id)
      .eq('from_user_id', user?.id)
      .maybeSingle();

    if (existingRating) {
      alert('Vous avez déjà évalué cette commande');
      return;
    }

    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  }, [user?.id]);

  const handleSubmitRating = useCallback((rating: number, comment: string) => {
    if (selectedOrderForRating && selectedOrderForRating.supplierId) {
      const ratingData = {
        punctuality: rating,
        quality: rating,
        communication: rating,
        overall: rating,
        comment: comment
      };

      submitRating(selectedOrderForRating.id, ratingData, selectedOrderForRating.supplierId, 'supplier');
      setShowRatingModal(false);
      setSelectedOrderForRating(null);
    }
  }, [selectedOrderForRating, submitRating]);

  // Memoize top suppliers calculation to avoid recalculating on every render
  const topSuppliers = useMemo(() => {
    const supplierCounts: { [key: string]: number } = {};
    
    filteredOrders.forEach(order => {
      if (order.supplierId) {
        supplierCounts[order.supplierId] = (supplierCounts[order.supplierId] || 0) + 1;
      }
    });
    
    return Object.entries(supplierCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([supplierId, count]) => {
        const profile = supplierProfiles[supplierId];
        return {
          id: supplierId,
          name: getSupplierName(supplierId),
          orders: count,
          rating: profile?.rating ?? null
        };
      });
  }, [filteredOrders, supplierProfiles, getSupplierName]);

  // Memoize order rating checks to avoid calling needsRating on every render
  const orderRatingStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    filteredOrders.forEach(order => {
      if (order.status === 'delivered' && order.supplierId) {
        status[order.id] = needsRating(order.id, 'client');
      }
    });
    return status;
  }, [filteredOrders, needsRating]);


  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Mes Commandes</h1>
            <p className="text-slate-600 text-lg">Analysez vos commandes et suivez vos statistiques</p>
          </div>

          {/* Summary Stats - Modern Design */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Total commandes</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalOrders}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Livrées</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{completedOrders}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Annulées</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{cancelledOrders}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Total dépensé</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">{formatPrice(totalSpent)}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Panier moyen</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">{formatPrice(averageOrderValue)}</p>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Statistiques</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs sm:text-sm text-slate-600">Cette semaine</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-900">{ordersThisWeek} commandes</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs sm:text-sm text-slate-600">Fournisseur principal</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{getFavoriteSupplier()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs sm:text-sm text-slate-600">Temps moyen livraison</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-900">{getAverageDeliveryTime()} min</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs sm:text-sm text-slate-600">Votre note moyenne</span>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 fill-current" />
                    <span className="text-sm sm:text-base font-semibold text-slate-900">{user?.rating || 4.5}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Fournisseurs fréquents</h3>
              <div className="space-y-2 sm:space-y-3">
                {topSuppliers.length > 0 ? topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">{supplier.name}</p>
                      <p className="text-xs text-slate-600">{supplier.orders} commande{supplier.orders > 1 ? 's' : ''}</p>
                    </div>
                    {supplier.rating !== null && supplier.rating > 0 && (
                      <RatingBadge
                        rating={supplier.rating}
                        reviewCount={1}
                        userId={supplier.id}
                        userType="supplier"
                        size="sm"
                      />
                    )}
                  </div>
                )) : (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-4">Aucun fournisseur pour le moment</p>
                )}
              </div>
            </div>
          </div>

        {/* Filters - Modern Design */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par ID ou adresse..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs sm:text-sm transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none text-xs sm:text-sm transition-all bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="pending-offers">En attente d'offres</option>
                <option value="offers-received">Offres reçues</option>
                <option value="awaiting-payment">En attente de paiement</option>
                <option value="paid">Payée</option>
                <option value="accepted">Acceptée</option>
                <option value="preparing">En préparation</option>
                <option value="delivering">En livraison</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none text-xs sm:text-sm transition-all bg-white"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List - Modern Design */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col space-y-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">#{order.id}</h3>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          {order === clientCurrentOrder && (
                            <Badge variant="warning" size="sm">
                              En cours
                            </Badge>
                          )}
                          {order.status === 'delivered' && (() => {
                            const rating = orderRatings[order.id];
                            return rating !== null && rating !== undefined ? (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                                <span className="text-xs sm:text-sm font-semibold">{rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-gray-400">
                                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">—</span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{order.deliveryAddress.split(',')[0]}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span>{order.items.length} article(s)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span>{formatDateShort(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{getPaymentMethodLabel(order.paymentMethod)}</span>
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {order.items.map((item, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.quantity}x {item.product.name} ({item.product.crateType})
                                {item.withConsigne && <span className="text-orange-600 ml-1">+ Consigne</span>}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                          {order.consigneTotal > 0 && (
                            <span className="text-xs sm:text-sm text-orange-600 font-medium">
                              Consigne: {formatPrice(order.consigneTotal)}
                            </span>
                          )}
                          {order.supplierId && isSupplierRevealed(order.status) && (
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                              par {getSupplierName(order.supplierId)}
                            </span>
                          )}
                          {order.deliveredAt && (
                            <span className="text-xs sm:text-sm text-green-600 font-medium">
                              Livrée le {formatDate(order.deliveredAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Détails</span>
                        </button>

                        {order.status === 'awaiting-payment' && (
                          <button
                            onClick={() => {
                              setOrderForPayment(order);
                              setShowPaymentModal(true);
                            }}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Payer maintenant</span>
                          </button>
                        )}

                        {order === clientCurrentOrder && (
                          <button 
                            onClick={() => onNavigate('tracking')}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                          >
                            Suivre
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <button className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Reçu</span>
                          </button>
                        )}
                        
                        {order.status === 'delivered' && order.supplierId && (() => {
                          const needsClientRating = orderRatingStatus[order.id];

                          if (needsClientRating) {
                            return (
                              <button
                                onClick={() => handleRateSupplier(order)}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>Évaluer</span>
                              </button>
                            );
                          }

                          return (
                            <button className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2">
                              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span>Évalué</span>
                            </button>
                          );
                        })()}
                        
                        {(order.status === 'pending' || order.status === 'accepted') && order !== clientCurrentOrder && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getPaymentMethodLabel={getPaymentMethodLabel}
          getStatusInfo={getStatusInfo}
          getSupplierName={getSupplierName}
          getSupplierProfile={getSupplierProfile}
          isSupplierRevealed={isSupplierRevealed}
          handleRateSupplier={handleRateSupplier}
          handleCancelOrder={handleCancelOrder}
          getDeliveryConfirmationCode={getDeliveryConfirmationCode}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrderForRating && selectedOrderForRating.supplierId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[90vh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Évaluez votre fournisseur</h2>
                <p className="text-sm sm:text-base text-gray-600">Comment s'est passée votre livraison avec <strong>{getSupplierName(selectedOrderForRating.supplierId)}</strong> ?</p>
              </div>

              <UnifiedRatingForm
                orderId={selectedOrderForRating.id}
                toUserId={selectedOrderForRating.supplierId}
                toUserRole="supplier"
                otherPartyName={getSupplierName(selectedOrderForRating.supplierId)}
                onSubmit={async () => {
                  setShowRatingModal(false);
                  setSelectedOrderForRating(null);
                  await refreshOrders();
                  // Refresh supplier profiles to get updated ratings
                  await loadSupplierProfiles();
                }}
                onCancel={() => {
                  setShowRatingModal(false);
                  setSelectedOrderForRating(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showOffersModal && selectedOrder && !showPaymentModal && (
        <OrderDetailsWithOffers
          order={selectedOrder}
          onOfferAccepted={async () => {
            await refreshOrders();
          }}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedOrder(null);
          }}
          onPaymentRequest={() => {
            setOrderForPayment(selectedOrder);
            setShowPaymentModal(true);
          }}
        />
      )}

      {showPaymentModal && orderForPayment && (
        <PaymentInterface
          order={orderForPayment}
          onPaymentSuccess={async () => {
            setShowOffersModal(false);
            setSelectedOrder(null);
            setShowPaymentModal(false);
            setOrderForPayment(null);
            await refreshOrders();
          }}
          onCancel={() => {
            setShowPaymentModal(false);
            setOrderForPayment(null);
          }}
        />
      )}
    </>
  );
};