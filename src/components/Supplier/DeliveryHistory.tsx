import React, { useState } from 'react';
import { Calendar, Package, Star, MapPin, Clock, Filter, Search } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { useRating } from '../../context/RatingContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { SupplierRatingForm } from './SupplierRatingForm';

interface DeliveryRecord {
  id: string;
  clientName: string;
  address: string;
  items: number;
  total: number;
  deliveredAt: Date;
  rating: number;
  distance: string;
  duration: number;
  paymentMethod: string;
}

export const DeliveryHistory: React.FC = () => {
  const { allOrders } = useOrder();
  const { getOrderRatings, needsRating, submitRating } = useRating();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);

  // Filter completed deliveries for current supplier
  const supplierCompletedDeliveries = allOrders.filter(order => 
    order.status === 'delivered' && 
    order.supplierId === user?.id // In real app, match with actual supplier ID
  );

  // Convert orders to delivery records format
  const deliveries: DeliveryRecord[] = supplierCompletedDeliveries.map(order => ({
    id: order.id,
    clientName: 'Maquis Belle Vue', // In real app, get from order.clientId
    address: order.deliveryAddress,
    items: order.items.length,
    total: order.totalAmount,
    deliveredAt: order.deliveredAt || new Date(),
    rating: 4.5, // Default rating, will be replaced by actual rating when both parties have rated
    distance: '2.3 km', // Mock distance
    duration: order.estimatedDeliveryTime || 25,
    paymentMethod: order.paymentMethod === 'orange' ? 'Orange Money' : 
                   order.paymentMethod === 'mtn' ? 'MTN Mobile Money' :
                   order.paymentMethod === 'moov' ? 'Moov Money' :
                   order.paymentMethod === 'wave' ? 'Wave' : 'Carte bancaire'
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
  const averageRating = filteredDeliveries.reduce((sum, delivery) => sum + delivery.rating, 0) / filteredDeliveries.length;

  const handleRateClient = (order: Order) => {
    setSelectedOrderForRating(order);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (ratings: any) => {
    if (!selectedOrderForRating || !user) return;
    
    submitRating(selectedOrderForRating.id, ratings, 'supplier', 'client');
    setShowRatingModal(false);
    setSelectedOrderForRating(null);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des Livraisons</h1>
        <p className="text-gray-600">Consultez vos performances et revenus</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Livraisons totales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredDeliveries.length}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Revenus totaux</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalEarnings)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}/5</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par client ou adresse..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune livraison trouvée</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{delivery.clientName}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{delivery.rating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{delivery.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{delivery.items} article(s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{delivery.distance} • {delivery.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(delivery.deliveredAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(delivery.total)}
                      </span>
                      <span className="text-sm text-gray-500">
                        via {delivery.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Détails
                    </button>
                    {(() => {
                      const order = supplierCompletedDeliveries.find(o => o.id === delivery.id);
                      if (!order) return null;
                      
                      const { clientRating, supplierRating } = getOrderRatings(order.id);
                      const needsSupplierRating = needsRating(order.id, 'supplier');
                      const bothRated = !!(clientRating && supplierRating);
                      
                      if (needsSupplierRating) {
                        return (
                          <button 
                            onClick={() => handleRateClient(order)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <Star className="h-4 w-4" />
                            <span>Évaluer client</span>
                          </button>
                        );
                      }
                      
                      if (bothRated) {
                        return (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center space-x-2">
                            <Star className="h-4 w-4" />
                            <span>Évaluations complètes</span>
                          </button>
                        );
                      }
                      
                      return (
                        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium cursor-not-allowed opacity-75 text-xs">
                          En attente évaluation client
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

      {/* Rating Modal */}
      {showRatingModal && selectedOrderForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Évaluez votre client</h2>
                <p className="text-gray-600">Comment s'est passée la livraison pour <strong>Maquis Belle Vue</strong> ?</p>
              </div>

	              <SupplierRatingForm
	                orderId={selectedOrderForRating.id}
	                clientId={selectedOrderForRating.clientId}
	                onSubmit={handleSubmitRating}
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