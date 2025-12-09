import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, MapPin, Clock, Star, AlertTriangle, CheckCircle, XCircle, Phone, User, CreditCard, Archive, Truck, X, MessageCircle } from 'lucide-react';
import { Order, OrderStatus, CrateType } from '../../types';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { supabase } from '../../lib/supabase';

export const OrderManagement: React.FC = () => {
  const { allOrders, updateOrderStatus, refreshOrders } = useOrder();
  const { commissionSettings } = useCommission();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionType, setInterventionType] = useState<'cancel' | 'reassign' | 'contact' | 'refund' | 'changeZone'>('cancel');
  const [interventionReason, setInterventionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [availableZones, setAvailableZones] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, { name: string; businessName?: string }>>({});

  // Charger les zones et profils disponibles
  useEffect(() => {
    loadZones();
    loadUserProfiles();
  }, [allOrders]);

  const loadUserProfiles = async () => {
    try {
      const userIds = new Set<string>();
      allOrders.forEach(order => {
        if (order.clientId) userIds.add(order.clientId);
        if (order.supplierId) userIds.add(order.supplierId);
      });

      if (userIds.size === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', Array.from(userIds));

      if (error) throw error;

      const profilesMap: Record<string, { name: string; businessName?: string }> = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = {
          name: profile.name,
          businessName: profile.business_name
        };
      });
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };

  const loadZones = async () => {
    setIsLoadingZones(true);
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableZones(data || []);
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setIsLoadingZones(false);
    }
  };

  const handleChangeZone = async () => {
    if (!selectedOrder || !selectedZoneId) return;

    setIsProcessing(true);
    try {
      // 1. Supprimer les offres existantes
      const { error: deleteOffersError } = await supabase
        .from('supplier_offers')
        .delete()
        .eq('order_id', selectedOrder.id);

      if (deleteOffersError) throw deleteOffersError;

      // 2. Mettre à jour la zone et réinitialiser le statut
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          zone_id: selectedZoneId,
          status: 'pending-offers',
          supplier_id: null
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      // 3. Rafraîchir les commandes
      await refreshOrders();

      alert(`✅ Zone modifiée avec succès!\n\nLa commande #${selectedOrder.id.slice(0, 8)} a été déplacée vers la nouvelle zone.\n\nStatut : En attente d'offres\nLes fournisseurs de cette zone peuvent maintenant voir la commande.`);
    } catch (error) {
      console.error('Error changing zone:', error);
      alert('❌ Erreur lors du changement de zone. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
      setShowZoneModal(false);
      setSelectedOrder(null);
      setSelectedZoneId('');
    }
  };

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock, textColor: 'text-yellow-600' };
      case 'pending-offers':
        return { label: 'En attente d\'offres', color: 'bg-yellow-100 text-yellow-700', icon: Clock, textColor: 'text-yellow-600' };
      case 'offers-received':
        return { label: 'Offres reçues', color: 'bg-blue-100 text-blue-700', icon: Package, textColor: 'text-blue-600' };
      case 'awaiting-payment':
        return { label: 'En attente de paiement', color: 'bg-orange-100 text-orange-700', icon: CreditCard, textColor: 'text-orange-600' };
      case 'paid':
        return { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle, textColor: 'text-green-600' };
      case 'awaiting-client-validation':
        return { label: 'Validation client', color: 'bg-orange-100 text-orange-700', icon: Clock, textColor: 'text-orange-600' };
      case 'accepted':
        return { label: 'Acceptée', color: 'bg-blue-100 text-blue-700', icon: Package, textColor: 'text-blue-600' };
      case 'preparing':
        return { label: 'En préparation', color: 'bg-purple-100 text-purple-700', icon: Package, textColor: 'text-purple-600' };
      case 'delivering':
        return { label: 'En livraison', color: 'bg-orange-100 text-orange-700', icon: Truck, textColor: 'text-orange-600' };
      case 'delivered':
        return { label: 'Livrée', color: 'bg-green-100 text-green-700', icon: CheckCircle, textColor: 'text-green-600' };
      case 'awaiting-rating':
        return { label: 'En attente d\'évaluation', color: 'bg-yellow-100 text-yellow-700', icon: Star, textColor: 'text-yellow-600' };
      case 'cancelled':
        return { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle, textColor: 'text-red-600' };
      default:
        return { label: 'Inconnu', color: 'bg-gray-100 text-gray-700', icon: Package, textColor: 'text-gray-600' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
    if (!supplierId) return 'Non assigné';
    const profile = userProfiles[supplierId];
    return profile?.businessName || profile?.name || 'Fournisseur inconnu';
  };

  const getClientName = (clientId: string) => {
    const profile = userProfiles[clientId];
    return profile?.businessName || profile?.name || 'Client inconnu';
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleIntervention = (order: Order, type: 'cancel' | 'reassign' | 'contact' | 'refund' | 'changeZone') => {
    setSelectedOrder(order);
    setInterventionType(type);
    if (type === 'changeZone') {
      setShowZoneModal(true);
    } else {
      setShowInterventionModal(true);
    }
  };

  const executeIntervention = async () => {
    if (!selectedOrder || !interventionReason.trim()) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (interventionType) {
      case 'cancel':
        updateOrderStatus(selectedOrder.id, 'cancelled');
        break;
      case 'reassign':
        // In real app, this would reassign to another supplier
        updateOrderStatus(selectedOrder.id, 'pending');
        break;
      case 'contact':
        // In real app, this would send notifications
        break;
      case 'refund':
        // In real app, this would process refund
        updateOrderStatus(selectedOrder.id, 'cancelled');
        break;
    }

    setIsProcessing(false);
    setShowInterventionModal(false);
    setSelectedOrder(null);
    setInterventionReason('');

    const actions = {
      cancel: 'annulée',
      reassign: 'réassignée',
      contact: 'contacté',
      refund: 'remboursée'
    };

    alert(`✅ Intervention réussie!\n\nCommande #${selectedOrder.id} ${actions[interventionType]} avec succès.\n\nRaison: ${interventionReason}`);
  };

  const getCrateSummary = (order: Order) => {
    const crateSummary: { [key in CrateType]: { withConsigne: number; toReturn: number } } = {
      C24: { withConsigne: 0, toReturn: 0 },
      C12: { withConsigne: 0, toReturn: 0 },
      C12V: { withConsigne: 0, toReturn: 0 },
      C6: { withConsigne: 0, toReturn: 0 }
    };

    order.items.forEach(item => {
      if (item.withConsigne) {
        crateSummary[item.product.crateType].withConsigne += item.quantity;
      } else {
        crateSummary[item.product.crateType].toReturn += item.quantity;
      }
    });

    return crateSummary;
  };

  // Calculate stats
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
  const averageOrderValue = filteredOrders.length > 0 ? 
    filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length : 0;

  const OrderDetailsModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;
    const crateSummary = getCrateSummary(order);
    const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
    const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
      const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
      return sum + (counts.withConsigne * consignePrice);
    }, 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-br from-${statusInfo.textColor.split('-')[1]}-400 to-${statusInfo.textColor.split('-')[1]}-500`}>
                  <StatusIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Commande #{order.id}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-gray-600">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Information */}
              <div className="space-y-6">
                {/* Client & Supplier Info */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Informations participants
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium text-gray-900">{getClientName(order.clientId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fournisseur:</span>
                      <span className="font-medium text-gray-900">{getSupplierName(order.supplierId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adresse:</span>
                      <span className="font-medium text-gray-900">{order.deliveryAddress}</span>
                    </div>
                    {order.estimatedDeliveryTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temps estimé:</span>
                        <span className="font-medium text-gray-900">{order.estimatedDeliveryTime} min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Chronologie</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Commande créée</p>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    {order.acceptedAt && (
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Acceptée par {getSupplierName(order.supplierId)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.acceptedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.deliveredAt && (
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Livraison terminée</p>
                          <p className="text-sm text-gray-600">{formatDate(order.deliveredAt)}</p>
                          {order.acceptedAt && (
                            <p className="text-xs text-green-600">
                              Durée: {Math.round((order.deliveredAt.getTime() - order.acceptedAt.getTime()) / 60000)} min
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                    Informations financières
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mode de paiement:</span>
                      <span className="font-medium text-gray-900">{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant total:</span>
                      <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                    </div>
                    {order.consigneTotal > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Consignes incluses:</span>
                        <span className="font-medium">{formatPrice(order.consigneTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-blue-600">
                      <span>Commission RAVITO:</span>
                      <span className="font-medium">
                        {formatPrice(Math.round(order.totalAmount * (commissionSettings.clientCommission + commissionSettings.supplierCommission) / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut paiement:</span>
                      <span className={`font-medium ${
                        order.status === 'cancelled' ? 'text-red-600' : 
                        order.status === 'delivered' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {order.status === 'cancelled' ? 'Annulé' : 
                         order.status === 'delivered' ? 'Payé' : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-6">
                {/* Items */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Articles commandés</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">{item.product.name}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              item.product.brand === 'Flag' || item.product.brand === 'Solibra' || item.product.brand === 'Beaufort' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.product.brand}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {item.product.crateType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              <span>Quantité: {item.quantity}</span>
                              {item.withConsigne && (
                                <span className="ml-3 text-orange-600 font-medium">+ Consigne incluse</span>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              {formatPrice(item.product.pricePerUnit * item.quantity + 
                                (item.withConsigne ? item.product.consigneAmount * item.quantity : 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crate Management */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Archive className="h-5 w-5 mr-2 text-blue-600" />
                    Gestion des casiers
                  </h3>
                  
                  {totalCratesToReturn > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-800 mb-3">Casiers vides à récupérer :</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(crateSummary).map(([crateType, counts]) => (
                          counts.toReturn > 0 && (
                            <div key={crateType} className="bg-white rounded p-3 text-center">
                              <div className="text-lg font-bold text-blue-700">{counts.toReturn}</div>
                              <div className="text-blue-600 text-sm">{crateType}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {totalConsigneAmount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-700">Consignes payées</span>
                        <span className="font-bold text-orange-800">{formatPrice(totalConsigneAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  {totalCratesToReturn === 0 && totalConsigneAmount === 0 && (
                    <p className="text-sm text-blue-700">Aucun casier géré pour cette commande</p>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Actions administratives</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => handleIntervention(order, 'cancel')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Annuler</span>
                      </button>
                    )}
                    
                    {(order.status === 'accepted' || order.status === 'preparing') && (
                      <button
                        onClick={() => handleIntervention(order, 'reassign')}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Truck className="h-4 w-4" />
                        <span>Réassigner</span>
                      </button>
                    )}

                    {(order.status === 'pending-offers' || order.status === 'offers-received') && (
                      <button
                        onClick={() => handleIntervention(order, 'changeZone')}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Modifier la zone</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleIntervention(order, 'contact')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Contacter</span>
                    </button>

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleIntervention(order, 'refund')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Rembourser</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ZoneChangeModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier la zone de livraison</h2>
              <p className="text-gray-600">Commande #{selectedOrder.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Zone actuelle : <span className="font-semibold">{selectedOrder.deliveryZone || 'Non spécifiée'}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sélectionnez la nouvelle zone :
              </label>

              {isLoadingZones ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Chargement des zones...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedZoneId === zone.id
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{zone.name}</p>
                          <p className="text-sm text-gray-600">{zone.description}</p>
                        </div>
                        {selectedZoneId === zone.id && (
                          <CheckCircle className="h-6 w-6 text-teal-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Les offres existantes seront supprimées</li>
                    <li>Seuls les fournisseurs de la nouvelle zone verront cette commande</li>
                    <li>Le statut repassera à "En attente d'offres"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowZoneModal(false);
                  setSelectedOrder(null);
                  setSelectedZoneId('');
                }}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeZone}
                disabled={isProcessing || !selectedZoneId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Modification...' : 'Confirmer le changement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InterventionModal = () => {
    if (!selectedOrder) return null;

    const interventionTypes = {
      cancel: {
        title: 'Annuler la commande',
        description: 'Annuler définitivement cette commande',
        color: 'red',
        icon: XCircle,
        reasons: [
          'Problème de paiement détecté',
          'Adresse de livraison incorrecte',
          'Produits non disponibles',
          'Demande du client',
          'Problème technique',
          'Fournisseur indisponible'
        ]
      },
      reassign: {
        title: 'Réassigner la commande',
        description: 'Assigner la commande à un autre fournisseur',
        color: 'orange',
        icon: Truck,
        reasons: [
          'Fournisseur actuel indisponible',
          'Problème de livraison',
          'Optimisation des délais',
          'Demande spéciale du client',
          'Problème de stock'
        ]
      },
      contact: {
        title: 'Contacter les parties',
        description: 'Envoyer une notification aux participants',
        color: 'blue',
        icon: MessageCircle,
        reasons: [
          'Clarification nécessaire',
          'Mise à jour du statut',
          'Problème signalé',
          'Vérification d\'informations',
          'Suivi personnalisé'
        ]
      },
      refund: {
        title: 'Traiter un remboursement',
        description: 'Initier un remboursement pour cette commande',
        color: 'purple',
        icon: CreditCard,
        reasons: [
          'Livraison non conforme',
          'Produits défectueux',
          'Retard excessif',
          'Demande légitime du client',
          'Erreur de facturation'
        ]
      }
    };

    const currentIntervention = interventionTypes[interventionType];
    const InterventionIcon = currentIntervention.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className={`h-16 w-16 bg-gradient-to-br from-${currentIntervention.color}-500 to-${currentIntervention.color}-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <InterventionIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentIntervention.title}</h2>
              <p className="text-gray-600">Commande #{selectedOrder.id}</p>
              <p className="text-sm text-gray-500">{currentIntervention.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sélectionnez une raison :
              </label>
              <div className="space-y-2">
                {currentIntervention.reasons.map((reason) => (
                  <label key={reason} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="interventionReason"
                      value={reason}
                      checked={interventionReason === reason}
                      onChange={(e) => setInterventionReason(e.target.value)}
                      className={`h-4 w-4 text-${currentIntervention.color}-600`}
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire détaillé (optionnel)
              </label>
              <textarea
                rows={3}
                value={interventionReason.startsWith('Autre') ? interventionReason : ''}
                onChange={(e) => {
                  if (interventionReason.startsWith('Autre')) {
                    setInterventionReason(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Ajoutez des détails sur l'intervention..."
              />
            </div>

            <div className={`bg-${currentIntervention.color}-50 border border-${currentIntervention.color}-200 rounded-lg p-4 mb-6`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`h-5 w-5 text-${currentIntervention.color}-600 mt-0.5`} />
                <div className={`text-sm text-${currentIntervention.color}-800`}>
                  <p className="font-medium mb-2">Conséquences de cette action :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    {interventionType === 'cancel' && (
                      <>
                        <li>La commande sera définitivement annulée</li>
                        <li>Le client et le fournisseur seront notifiés</li>
                        <li>Le remboursement sera traité automatiquement</li>
                      </>
                    )}
                    {interventionType === 'reassign' && (
                      <>
                        <li>La commande sera remise en recherche de fournisseur</li>
                        <li>Le fournisseur actuel sera notifié</li>
                        <li>Le client recevra une mise à jour</li>
                      </>
                    )}
                    {interventionType === 'contact' && (
                      <>
                        <li>Une notification sera envoyée aux parties concernées</li>
                        <li>L'intervention sera enregistrée dans l'historique</li>
                        <li>Un suivi sera programmé</li>
                      </>
                    )}
                    {interventionType === 'refund' && (
                      <>
                        <li>Le remboursement sera traité sous 24h</li>
                        <li>La commande passera en statut "Remboursée"</li>
                        <li>Toutes les parties seront notifiées</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowInterventionModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={executeIntervention}
                disabled={!interventionReason.trim() || isProcessing}
                className={`flex-1 px-6 py-3 bg-${currentIntervention.color}-600 text-white rounded-lg font-semibold hover:bg-${currentIntervention.color}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    <InterventionIcon className="h-4 w-4" />
                    <span>Confirmer l'intervention</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Commandes</h1>
          <p className="text-gray-600">Supervisez et intervenez sur toutes les commandes de la plateforme</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Livrées</p>
                <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Annulées</p>
                <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Panier moyen</p>
                <p className="text-xl font-bold text-purple-600">{formatPrice(averageOrderValue)}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par ID ou adresse..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="awaiting-client-validation">Offre envoyée</option>
                <option value="accepted">Acceptées</option>
                <option value="preparing">En préparation</option>
                <option value="delivering">En livraison</option>
                <option value="delivered">Livrées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">#{order.id}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {order.status === 'pending' && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium animate-pulse">
                              Intervention possible
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{getClientName(order.clientId)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{order.deliveryAddress.split(',')[0]}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{order.items.length} article(s)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span className="text-sm text-gray-500">
                            via {getPaymentMethodLabel(order.paymentMethod)}
                          </span>
                          {order.supplierId && (
                            <span className="text-sm text-green-600 font-medium">
                              {getSupplierName(order.supplierId)}
                            </span>
                          )}
                          {order.consigneTotal > 0 && (
                            <span className="text-sm text-orange-600 font-medium">
                              Consigne: {formatPrice(order.consigneTotal)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(order)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Détails</span>
                        </button>
                        
                        {(order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing') && (
                          <button 
                            onClick={() => handleIntervention(order, 'cancel')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span>Intervenir</span>
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <button 
                            onClick={() => handleIntervention(order, 'refund')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Rembourser</span>
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

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Intervention Modal */}
      {showInterventionModal && <InterventionModal />}

      {/* Zone Change Modal */}
      {showZoneModal && <ZoneChangeModal />}
    </>
  );
};