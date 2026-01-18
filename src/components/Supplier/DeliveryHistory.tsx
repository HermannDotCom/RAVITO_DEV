import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Package, Star, MapPin, Clock, Filter, Search, X, Navigation, Archive, CheckCircle, MessageSquare } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { useRating } from '../../context/RatingContext';
import { useAuth } from '../../context/AuthContext';
import { Order, CrateType } from '../../types';
import { UnifiedRatingForm } from '../Shared/UnifiedRatingForm';
import { MutualRatingsDisplay } from '../Shared/MutualRatingsDisplay';
import { supabase } from '../../lib/supabase';

interface DeliveryHistoryProps {
  onNavigate?: (section: string) => void;
  onClaimRequest?: (claimData: ClaimData) => void;
  initialOrderIdToRate?: string | null;
  onOrderRated?: () => void;
}

export interface ClaimData {
  subject: string;
  category: 'complaint';
  message: string;
  priority: 'medium';
}

interface DeliveryRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  address: string;
  items: number;
  total: number;
  deliveredAt: Date;
  rating: number | null;
  distance: string;
  duration: number;
  paymentMethod: string;
  order: Order;
}

interface ClientProfile {
  id: string;
  name: string;
  business_name?: string;
  email?: string;
  phone?: string;
  rating?: number;
}

export const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({ onNavigate, onClaimRequest, initialOrderIdToRate, onOrderRated }) => {
  const { allOrders } = useOrder();
  const { getOrderRatings, needsRating, submitRating } = useRating();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [clientProfiles, setClientProfiles] = useState<Record<string, ClientProfile>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [orderRatings, setOrderRatings] = useState<Record<string, number | null>>({});

  // Memoize completed deliveries to prevent unnecessary re-renders
  const supplierCompletedDeliveries = useMemo(() => 
    allOrders.filter(order => 
      order.status === 'delivered' && 
      order.supplierId === user?.id
    ),
    [allOrders, user?.id]
  );

  // Extract loadClientProfilesAndRatings as a reusable function
  const loadClientProfilesAndRatings = useCallback(async () => {
    if (!user) return;

    // Load client profiles
    const { data: profiles, error: profilesError } = await supabase
      .rpc('get_client_profiles_for_supplier', { supplier_user_id: user.id });

    if (profilesError) {
      console.error('Error loading client profiles:', profilesError);
    } else {
      const profilesMap: Record<string, ClientProfile> = {};

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

      setClientProfiles(profilesMap);
    }

    // Load order-specific ratings where the supplier is the recipient
    if (supplierCompletedDeliveries.length > 0) {
      const orderIds = supplierCompletedDeliveries.map(o => o.id);

      const { data, error } = await supabase
        .from('ratings')
        .select('order_id, overall')
        .in('order_id', orderIds)
        .eq('to_user_id', user.id);

      if (error) {
        console.error('Error loading order ratings:', error);
      } else {
        const ratingsMap: Record<string, number | null> = {};
        data?.forEach(r => {
          ratingsMap[r.order_id] = r.overall;
        });
        setOrderRatings(ratingsMap);
      }
    }
  }, [user, supplierCompletedDeliveries]);

  // Load client profiles and order ratings ONLY for paid deliveries (respects anonymity rules)
  useEffect(() => {
    loadClientProfilesAndRatings();
  }, [loadClientProfilesAndRatings]);

  // Auto-open rating modal when initialOrderIdToRate is provided
  useEffect(() => {
    if (initialOrderIdToRate) {
      const order = supplierCompletedDeliveries.find(o => o.id === initialOrderIdToRate);
      if (order && order.clientId) {
        setSelectedOrderForRating(order);
        setShowRatingModal(true);
        // Clear the initialOrderIdToRate after opening
        if (onOrderRated) {
          onOrderRated();
        }
      }
    }
  }, [initialOrderIdToRate, supplierCompletedDeliveries, onOrderRated]);

  // Helper function to get client display name
  const getClientName = (clientId: string): string => {
    const profile = clientProfiles[clientId];
    return profile?.business_name || profile?.name || 'Client';
  };

  // Convert orders to delivery records format
  const deliveries: DeliveryRecord[] = supplierCompletedDeliveries.map(order => ({
    id: order.id,
    clientId: order.clientId,
    clientName: getClientName(order.clientId),
    clientEmail: clientProfiles[order.clientId]?.email,
    address: order.deliveryAddress,
    items: order.items.length,
    total: order.baseAmount || order.totalAmount,
    deliveredAt: order.deliveredAt || new Date(),
    rating: orderRatings[order.id] ?? null, // Use order-specific rating or null if not rated
    distance: '2.3 km', // Mock distance
    duration: order.estimatedDeliveryTime || 25,
    paymentMethod: order.paymentMethod === 'orange' ? 'Orange Money' : 
                   order.paymentMethod === 'mtn' ? 'MTN Mobile Money' :
                   order.paymentMethod === 'moov' ? 'Moov Money' :
                   order.paymentMethod === 'wave' ? 'Wave' : 'Carte bancaire',
    order: order
  }));

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterPeriod === 'today') {
      const today = new Date();
      const deliveryDate = delivery.deliveredAt;
      return matchesSearch && deliveryDate.toDateString() === today.toDateString();
    }
    
    if (filterPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && delivery.deliveredAt >= weekAgo;
    }
    
    return matchesSearch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const totalEarnings = filteredDeliveries.reduce((sum, delivery) => sum + delivery.total, 0);
  const deliveriesWithRatings = filteredDeliveries.filter(delivery => delivery.rating !== null);
  const averageRating = deliveriesWithRatings.length > 0
    ? deliveriesWithRatings.reduce((sum, delivery) => sum + delivery.rating!, 0) / deliveriesWithRatings.length
    : 0;

  const handleRateClient = async (order: Order) => {
    if (!order.clientId) {
      console.error('No client ID for this order');
      return;
    }

    // Vérifier si le fournisseur a déjà évalué cette commande
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
  };

  const handleSubmitRating = async (ratings: any) => {
    if (!selectedOrderForRating || !user || !selectedOrderForRating.clientId) return;

    const success = await submitRating(
      selectedOrderForRating.id,
      ratings,
      selectedOrderForRating.clientId,
      'client'
    );

    if (success) {
      setShowRatingModal(false);
      setSelectedOrderForRating(null);
    }
  };

  const handleShowDetails = (delivery: DeliveryRecord) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleOpenMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleMakeClaim = () => {
    if (!selectedDelivery) return;

    const shortOrderId = selectedDelivery.id.substring(0, 8).toUpperCase();
    const claimData: ClaimData = {
      subject: `Réclamation - Commande #${shortOrderId}`,
      category: 'complaint',
      message: `Client : ${selectedDelivery.clientName}
Date livraison : ${formatDate(selectedDelivery.deliveredAt)}
Montant : ${formatPrice(selectedDelivery.total)}
────────────────────────────────

Décrivez votre problème en détail...`,
      priority: 'medium'
    };

    setShowDetailsModal(false);
    setSelectedDelivery(null);

    if (onClaimRequest) {
      onClaimRequest(claimData);
    }
    if (onNavigate) {
      onNavigate('support');
    }
  };

  // Helper function to calculate crate summary for an order
  const getCrateSummary = (order: Order) => {
    const crateSummary: { [key: string]: { withConsigne: number; toReturn: number } } = {
      B33: { withConsigne: 0, toReturn: 0 },
      B65: { withConsigne: 0, toReturn: 0 },
      B100: { withConsigne: 0, toReturn: 0 },
      B50V: { withConsigne: 0, toReturn: 0 },
      B100V: { withConsigne: 0, toReturn: 0 }
    };

    order.items.forEach(item => {
      // Only count traditional crate types that use consigne system
      // CARTON types are disposable and excluded
      const crateType = item.product.crateType;
      const isConsignable = item.product.consignPrice > 0 && !crateType.startsWith('CARTON');
      
      if (!(crateType in crateSummary) || !isConsignable) return;

      if (item.withConsigne) {
        crateSummary[crateType].withConsigne += item.quantity;
      } else {
        crateSummary[crateType].toReturn += item.quantity;
      }
    });

    return crateSummary;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Historique des Livraisons</h1>
            <p className="text-slate-600 text-lg">Analysez vos performances et vos revenus</p>
          </div>

          {/* Summary Stats - Modern Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-30" />
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 mb-1">Livraisons totales</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{filteredDeliveries.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-30" />
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 mb-1">Revenus totaux</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{formatPrice(totalEarnings)}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-30" />
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 mb-1">Note moyenne</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
                    <span className="text-xs sm:text-sm text-slate-600">/5</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 fill-current" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters - Modern Design */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par client ou adresse..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="w-full sm:w-56">
                <div className="relative">
                  <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none text-sm transition-all bg-white"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                  </select>
                </div>
            </div>
          </div>
        </div>

        {/* Delivery List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Aucune livraison trouvée</h3>
            <p className="text-sm sm:text-base text-slate-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col space-y-3 sm:space-y-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate mr-2">{delivery.clientName}</h3>
                      {delivery.rating !== null ? (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">{delivery.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Star className="h-4 w-4" />
                          <span className="text-sm">—</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{delivery.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{delivery.items} article(s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{delivery.distance} • {delivery.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{formatDate(delivery.deliveredAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="text-lg sm:text-xl font-bold text-green-600">
                        {formatPrice(delivery.total)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        via {delivery.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button 
                      onClick={() => handleShowDetails(delivery)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
                    >
                      Détails
                    </button>
                    {(() => {
                      const order = supplierCompletedDeliveries.find(o => o.id === delivery.id);
                      if (!order) return null;

                      const needsSupplierRating = needsRating(order.id, 'supplier');

                      if (needsSupplierRating) {
                        return (
                          <button
                            onClick={() => handleRateClient(order)}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Star className="h-4 w-4" />
                            <span>Évaluer client</span>
                          </button>
                        );
                      }

                      return (
                        <button className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium flex items-center justify-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>Évalué</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Delivery Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 mr-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">Commande #{selectedDelivery.id.substring(0, 8).toUpperCase()}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 w-fit">
                        Livrée
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Total: {formatPrice(selectedDelivery.total)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Client Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                    Informations client
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Établissement</span>
                      <span className="font-medium">{selectedDelivery.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact</span>
                      <span className="font-medium">{selectedDelivery.clientEmail || 'Non disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Note reçue pour cette commande</span>
                      {selectedDelivery.rating !== null ? (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="font-medium">{selectedDelivery.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Star className="h-3 w-3" />
                          <span className="font-medium">Non évalué</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Adresse de livraison</h4>
                  <p className="text-gray-700 text-sm mb-3">{selectedDelivery.address}</p>
                  <button
                    onClick={() => handleOpenMaps(selectedDelivery.address)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    <span className="text-sm font-medium">Ouvrir dans Maps</span>
                  </button>
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Détails de la commande</h4>
                <div className="space-y-2">
                  {selectedDelivery.order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.product.name} ({item.product.crateType})
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.product.cratePrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {selectedDelivery.order.consigneTotal > 0 && (
                    <div className="flex justify-between items-center text-sm text-orange-600 border-t border-gray-200 pt-2">
                      <span>Consignes incluses</span>
                      <span className="font-medium">{formatPrice(selectedDelivery.order.consigneTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>{formatPrice(selectedDelivery.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crate Management */}
              {(() => {
                const crateSummary = getCrateSummary(selectedDelivery.order);
                const totalCratesRecovered = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
                const cratesWithReturns = Object.entries(crateSummary).filter(([, counts]) => counts.toReturn > 0);

                return (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Archive className="h-4 w-4 mr-2 text-blue-600" />
                      Gestion des casiers
                    </h4>
                    
                    {totalCratesRecovered > 0 ? (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-blue-800 mb-2">Casiers récupérés :</p>
                        <div className="grid grid-cols-2 gap-2">
                          {cratesWithReturns.map(([crateType, counts]) => (
                            <div key={crateType} className="bg-white rounded p-2 text-center">
                              <div className="font-bold text-blue-700">{counts.toReturn}</div>
                              <div className="text-blue-600 text-xs">{crateType}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-700">Aucun casier récupéré</p>
                    )}
                  </div>
                );
              })()}

              {/* Payment */}
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Paiement</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Paiement confirmé : {selectedDelivery.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">
                    Livré le {formatDate(selectedDelivery.deliveredAt)}
                  </p>
                </div>
              </div>

              {/* Mutual Ratings Display */}
              <div className="mt-6">
                <MutualRatingsDisplay
                  orderId={selectedDelivery.id}
                  currentUserRole="supplier"
                />
              </div>

              {/* Claim Button */}
              <div className="mt-4 sm:mt-6 flex justify-center">
                <button
                  onClick={handleMakeClaim}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Faire une réclamation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrderForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Évaluez votre client</h2>
                <p className="text-sm sm:text-base text-gray-600">Comment s'est passée la livraison pour <strong>{getClientName(selectedOrderForRating.clientId)}</strong> ?</p>
              </div>

              <UnifiedRatingForm
                orderId={selectedOrderForRating.id}
                toUserId={selectedOrderForRating.clientId}
                toUserRole="client"
                otherPartyName={getClientName(selectedOrderForRating.clientId)}
                onSubmit={async () => {
                  setShowRatingModal(false);
                  setSelectedOrderForRating(null);
                  // Refresh client profiles to get updated ratings
                  await loadClientProfilesAndRatings();
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
    </>
  );
};