import React, { useState } from 'react';
import { Package, Clock, Star, MapPin, Filter, Search, CheckCircle, XCircle, Truck, Calendar, Eye, Download, Phone, Archive, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useRating } from '../../context/RatingContext';
import { Order, OrderStatus, CrateType } from '../../types';
import { ClientRatingForm } from './ClientRatingForm';
import { OrderDetailsWithOffers } from './OrderDetailsWithOffers';
import { PaymentInterface } from './PaymentInterface';

interface OrderHistoryProps {
  onNavigate: (section: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { cart } = useCart();
  const { clientCurrentOrder, allOrders, updateOrderStatus } = useOrder();
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

  // Filtrer les commandes de l'utilisateur connecté
  const userOrders = allOrders.filter(order => 
    order.clientId === user?.id
  );

  // Combiner la commande en cours avec l'historique
  const allUserOrders = clientCurrentOrder 
    ? [clientCurrentOrder, ...userOrders] 
    : userOrders;

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
        return { label: 'En attente de validation', color: 'bg-orange-100 text-orange-700', icon: Clock, textColor: 'text-orange-600' };
      case 'accepted':
        return { label: 'Acceptée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle, textColor: 'text-blue-600' };
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
    const suppliers = {
      'supplier-1': 'Dépôt du Plateau',
      'supplier-2': 'Dépôt Cocody Express',
      'supplier-3': 'Dépôt Marcory Sud'
    };
    return suppliers[supplierId as keyof typeof suppliers] || 'Fournisseur inconnu';
  };

  // Calculer les statistiques réelles
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
  const totalSpent = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

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

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      updateOrderStatus(orderId, 'cancelled');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    if (order.status === 'offers-received' || order.status === 'awaiting-payment') {
      setShowOffersModal(true);
    } else {
      setShowOrderDetails(true);
    }
  };

  const handleRateSupplier = (order: Order) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (rating: number, comment: string) => {
    if (selectedOrderForRating) {
      const ratingData = {
        punctuality: rating,
        quality: rating,
        communication: rating,
        overall: rating,
        comment: comment
      };
      
      submitRating(selectedOrderForRating.id, ratingData, 'client', 'supplier');
      setShowRatingModal(false);
      setSelectedOrderForRating(null);
    }
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Information */}
              <div className="space-y-6">
                {/* Order Status */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Statut de la commande</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Statut actuel:</span>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
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
                          {order.acceptedAt && (() => {
                            const deliveredDate = order.deliveredAt instanceof Date ? order.deliveredAt : new Date(order.deliveredAt);
                            const acceptedDate = order.acceptedAt instanceof Date ? order.acceptedAt : new Date(order.acceptedAt);
                            return (
                              <p className="text-xs text-green-600">
                                Durée totale: {Math.round((deliveredDate.getTime() - acceptedDate.getTime()) / 60000)} minutes
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Informations de livraison
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block mb-1">Adresse:</span>
                      <span className="font-medium text-gray-900">{order.deliveryAddress}</span>
                    </div>
                    {order.supplierId && (
                      <div>
                        <span className="text-gray-600 block mb-1">Fournisseur:</span>
                        <span className="font-medium text-gray-900">{getSupplierName(order.supplierId)}</span>
                      </div>
                    )}
                    {order.estimatedDeliveryTime && (
                      <div>
                        <span className="text-gray-600 block mb-1">Temps estimé:</span>
                        <span className="font-medium text-gray-900">{order.estimatedDeliveryTime} minutes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                    Informations de paiement
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut paiement:</span>
                      <span className={`font-medium ${
                        order.status === 'cancelled' ? 'text-red-600' :
                        order.paymentStatus === 'paid' ? 'text-green-600' :
                        'text-orange-600'
                      }`}>
                        {order.status === 'cancelled' ? 'Annulé' :
                         order.paymentStatus === 'paid' ? 'Payé' :
                         'En attente'}
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
                      <p className="text-sm font-medium text-blue-800 mb-3">Casiers vides rendus :</p>
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
                        <span className="text-orange-700">Consignes payées (casiers gardés)</span>
                        <span className="font-bold text-orange-800">{formatPrice(totalConsigneAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  {totalCratesToReturn === 0 && totalConsigneAmount === 0 && (
                    <p className="text-sm text-blue-700">Aucun casier géré pour cette commande</p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {order.status === 'delivered' && (
                    <button className="w-full flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                      <Download className="h-4 w-4" />
                      <span>Télécharger le reçu</span>
                    </button>
                  )}
                  
                  {order.supplierId && order.status === 'delivered' && (
                    <button 
                      onClick={() => handleRateSupplier(order)}
                      className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <Star className="h-4 w-4" />
                      <span>Évaluer le fournisseur</span>
                    </button>
                  )}
                  
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <button 
                      onClick={() => {
                        handleCancelOrder(order.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Annuler la commande</span>
                    </button>
                  )}
                </div>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des Commandes</h1>
          <p className="text-gray-600">Consultez l'historique complet de vos commandes et leur statut</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Annulées</p>
                <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total dépensé</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(totalSpent)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Panier moyen</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(averageOrderValue)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Current Order Alert */}
        {clientCurrentOrder && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-bold text-orange-900">Commande en cours</h3>
                    <p className="text-orange-700">Commande #{clientCurrentOrder.id} - {getStatusInfo(clientCurrentOrder.status).label}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('tracking')}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Suivre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions, Personal Stats, and Frequent Suppliers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-bold text-white text-lg">Nouvelle commande</span>
                  <p className="text-orange-100 text-sm">Parcourez notre catalogue</p>
                </div>
                <div className="text-white opacity-75">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <button
                onClick={() => onNavigate('cart')}
                className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center relative">
                  <Package className="h-5 w-5 text-white" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-bold text-white text-lg">Voir mon panier</span>
                  <p className="text-blue-100 text-sm">
                    {cart.length > 0 ? `${cart.length} article(s) en attente` : 'Panier vide'}
                  </p>
                </div>
                <div className="text-white opacity-75">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques personnelles</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Commandes cette semaine:</span>
                <span className="font-bold text-gray-900">{ordersThisWeek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fournisseur préféré:</span>
                <span className="font-bold text-gray-900">{getFavoriteSupplier()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temps moyen livraison:</span>
                <span className="font-bold text-gray-900">{getAverageDeliveryTime()} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Note moyenne reçue:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-bold text-gray-900">{user?.rating || 4.5}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Fournisseurs fréquents</h3>
            <div className="space-y-3">
              {(() => {
                // Calculer les fournisseurs les plus fréquents
                const supplierCounts: { [key: string]: number } = {};
                
                filteredOrders.forEach(order => {
                  if (order.supplierId) {
                    supplierCounts[order.supplierId] = (supplierCounts[order.supplierId] || 0) + 1;
                  }
                });
                
                const topSuppliers = Object.entries(supplierCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([supplierId, count]) => ({
                    name: getSupplierName(supplierId),
                    orders: count,
                    rating: 4.5 // Note par défaut, à remplacer par les vraies notes si disponibles
                  }));
                
                return topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-sm text-gray-600">{supplier.orders} commande(s)</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{supplier.rating}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="awaiting-client-validation">Offre reçue</option>
                <option value="accepted">Acceptées</option>
                <option value="preparing">En préparation</option>
                <option value="delivering">En livraison</option>
                <option value="delivered">Livrées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
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
              <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche ou passez votre première commande</p>
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Parcourir le catalogue
              </button>
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
                          {order === clientCurrentOrder && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                              En cours
                            </span>
                          )}
                          {order.status === 'delivered' && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-semibold">4.5</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
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
                            <span>{formatDateShort(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.quantity}x {item.product.name} ({item.product.crateType})
                                {item.withConsigne && <span className="text-orange-600 ml-1">+ Consigne</span>}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                          {order.consigneTotal > 0 && (
                            <span className="text-sm text-orange-600 font-medium">
                              Consigne: {formatPrice(order.consigneTotal)}
                            </span>
                          )}
                          {order.supplierId && (
                            <span className="text-sm text-gray-500">
                              par {getSupplierName(order.supplierId)}
                            </span>
                          )}
                          {order.deliveredAt && (
                            <span className="text-sm text-green-600 font-medium">
                              Livrée le {formatDate(order.deliveredAt)}
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

                        {order.status === 'awaiting-payment' && (
                          <button
                            onClick={() => {
                              setOrderForPayment(order);
                              setShowPaymentModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Payer maintenant</span>
                          </button>
                        )}

                        {order === clientCurrentOrder && (
                          <button 
                            onClick={() => onNavigate('tracking')}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                          >
                            Suivre
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>Reçu</span>
                          </button>
                        )}
                        
                        {order.status === 'delivered' && order.supplierId && (() => {
                          const { clientRating, supplierRating } = getOrderRatings(order.id);
                          const bothRated = !!(clientRating && supplierRating);
                          const needsClientRating = needsRating(order.id, 'client');
                          
                          if (needsClientRating) {
                            return (
                              <button 
                                onClick={() => handleRateSupplier(order)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <Star className="h-4 w-4" />
                                <span>Évaluer</span>
                              </button>
                            );
                          }
                          
                          if (bothRated) {
                            return (
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Évalué</span>
                              </button>
                            );
                          }
                          
                          return (
                            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium cursor-not-allowed opacity-75 text-xs">
                              Attente éval. fournisseur
                            </button>
                          );
                        })()}
                        
                        {(order.status === 'pending' || order.status === 'accepted') && order !== clientCurrentOrder && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
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

      {/* Rating Modal */}
      {showRatingModal && selectedOrderForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Évaluez votre fournisseur</h2>
                <p className="text-gray-600">Comment s'est passée votre livraison avec <strong>{getSupplierName(selectedOrderForRating.supplierId)}</strong> ?</p>
              </div>

              <ClientRatingForm
                onSubmit={(ratingData) => {
                  if (selectedOrderForRating) {
                    submitRating(selectedOrderForRating.id, ratingData, 'client', 'supplier');
                    setShowRatingModal(false);
                    setSelectedOrderForRating(null);
                  }
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
            setShowOffersModal(false);
            setSelectedOrder(null);
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
            setShowPaymentModal(false);
            setOrderForPayment(null);
            setShowOffersModal(false);
            setSelectedOrder(null);
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