import React, { useState, useEffect } from 'react';
import { Clock, Package, MapPin, CheckCircle, Loader } from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getOffersBySupplier, SupplierOffer } from '../../services/supplierOfferService';
import { getOrdersBySupplier } from '../../services/orderService';

interface SupplierOrderSectionsProps {
  availableOrders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const SupplierOrderSections: React.FC<SupplierOrderSectionsProps> = ({
  availableOrders,
  onSelectOrder
}) => {
  const { user } = useAuth();
  const [myOffers, setMyOffers] = useState<SupplierOffer[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'active'>('available');

  useEffect(() => {
    loadSupplierData();
  }, [user?.id]);

  const loadSupplierData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [offers, orders] = await Promise.all([
        getOffersBySupplier(user.id),
        getOrdersBySupplier(user.id)
      ]);

      setMyOffers(offers);
      setActiveOrders(orders.filter(o =>
        ['awaiting-payment', 'paid', 'preparing', 'delivering'].includes(o.status)
      ));
    } catch (error) {
      console.error('Error loading supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  // Commandes disponibles (où je n'ai pas encore envoyé d'offre)
  const ordersWithoutMyOffer = availableOrders.filter(order => {
    return !myOffers.some(offer => offer.orderId === order.id);
  });

  // Commandes où j'ai une offre en attente
  const pendingOfferOrders = myOffers
    .filter(offer => offer.status === 'pending')
    .map(offer => availableOrders.find(o => o.id === offer.orderId))
    .filter((order): order is Order => order !== undefined);

  const getTabClass = (tab: string) => {
    return `px-6 py-3 font-semibold rounded-t-lg transition-colors ${
      activeTab === tab
        ? 'bg-white text-blue-600 border-t-2 border-x-2 border-blue-600'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;
  };

  const renderOrderCard = (order: Order, showOfferStatus = false) => {
    const myOffer = myOffers.find(o => o.orderId === order.id);

    return (
      <div
        key={order.id}
        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Commande #{order.orderNumber || order.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {showOfferStatus && myOffer && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Clock className="h-4 w-4 inline mr-1" />
                En attente
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Zone</p>
                <p className="font-semibold text-gray-900">
                  {order.deliveryZone || 'Non spécifiée'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Montant</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(myOffer?.totalAmount || order.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {order.items.length} produit{order.items.length > 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => onSelectOrder(order)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voir détails
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('available')}
          className={getTabClass('available')}
        >
          Commandes disponibles
          {ordersWithoutMyOffer.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {ordersWithoutMyOffer.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={getTabClass('pending')}
        >
          En attente d'acceptation
          {pendingOfferOrders.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
              {pendingOfferOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={getTabClass('active')}
        >
          En cours de traitement
          {activeOrders.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'available' && (
          <div>
            {ordersWithoutMyOffer.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune nouvelle commande disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ordersWithoutMyOffer.map(order => renderOrderCard(order))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div>
            {pendingOfferOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune offre en attente</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vos offres acceptées apparaîtront dans "En cours de traitement"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOfferOrders.map(order => renderOrderCard(order, true))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div>
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune commande en cours</p>
                <p className="text-sm text-gray-500 mt-2">
                  Les commandes dont l'offre a été acceptée apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOrders.map(order => renderOrderCard(order))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
