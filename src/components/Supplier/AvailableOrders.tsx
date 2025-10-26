import React, { useState } from 'react';
import { Clock, Package, MapPin, Star, Phone, AlertCircle, CheckCircle, Archive } from 'lucide-react';
import { Order, OrderStatus, CrateType } from '../../types';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { CreateOfferModal } from './CreateOfferModal';
import { usePendingRatings } from '../../hooks/usePendingRatings';
import { PendingRatingModal } from '../Shared/PendingRatingModal';

interface AvailableOrdersProps {
  onNavigate: (section: string) => void;
}

export const AvailableOrders: React.FC<AvailableOrdersProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders, refreshOrders } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();
  const { hasPendingRatings } = usePendingRatings(user?.id || null);

  const accessRestrictions = getAccessRestrictions();

  // Restriction d'accès sécurisée
  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">Accès aux commandes restreint</h2>
          <p className="text-orange-800 mb-4">
            {accessRestrictions.restrictionReason}
          </p>
          <p className="text-sm text-orange-700">
            {user?.role === 'supplier' 
              ? 'Notre équipe examine votre dossier. Vous serez notifié dès l\'approbation.'
              : 'Accès non autorisé aux commandes.'
            }
          </p>
        </div>
      </div>
    );
  }

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleCreateOffer = (order: Order) => {
    if (hasPendingRatings) {
      setShowRatingModal(true);
      return;
    }
    setSelectedOrder(order);
    setShowOfferModal(true);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getDistanceFromCoordinates = (coords: { lat: number; lng: number }) => {
    // Mock distance calculation
    return (Math.random() * 5 + 0.5).toFixed(1) + ' km';
  };

  const getEstimatedTime = (coords: { lat: number; lng: number }) => {
    // Mock time calculation
    return Math.floor(Math.random() * 20 + 10);
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commandes Disponibles</h1>
        <p className="text-gray-600">Acceptez les commandes dans votre zone de couverture</p>
      </div>

      {availableOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune commande disponible</h3>
          <p className="text-gray-500">Les nouvelles commandes apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div className="space-y-6">
          {availableOrders.map((order) => {
            const distance = getDistanceFromCoordinates(order.coordinates);
            const estimatedTime = getEstimatedTime(order.coordinates);
            const isAccepting = acceptingOrder === order.id;
            const crateSummary = getCrateSummary(order);
            const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
            const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
              const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
              return sum + (counts.withConsigne * consignePrice);
            }, 0);

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Commande #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          Créée il y a {Math.floor((Date.now() - order.createdAt.getTime()) / 60000)} minutes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{distance}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">~{estimatedTime} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Adresse de livraison</h4>
                        <p className="text-gray-700">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Articles commandés</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{item.product.name}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                item.product.brand === 'Solibra' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.product.brand}
                              </span>
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {item.product.packaging}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Quantité: {item.quantity}</span>
                              <span>Prix: {formatPrice(item.product.pricePerUnit * item.quantity)}</span>
                              {item.withConsigne && (
                                <span className="flex items-center space-x-1 text-orange-600">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Avec consigne (+{formatPrice(item.product.consigneAmount * item.quantity)})</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Répartition financière</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Montant total commande :</span>
                          <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Commission DISTRI-NIGHT ({commissionSettings.supplierCommission}%) :</span>
                          <span className="font-medium">-{formatPrice(getSupplierNetAmount(order.totalAmount).commission)}</span>
                        </div>
                        <div className="border-t border-green-200 pt-2">
                          <div className="flex justify-between text-lg font-bold text-green-600">
                            <span>Montant reversé (24h) :</span>
                            <span>{formatPrice(getSupplierNetAmount(order.totalAmount).netAmount)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 bg-white border border-green-300 rounded p-2">
                        <p className="text-xs text-green-700">
                          💰 Reversement automatique sous 24h après livraison confirmée
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Informations paiement</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mode de paiement</span>
                          <span className="font-medium">{getPaymentMethodLabel(order.paymentMethod)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statut</span>
                          <span className="flex items-center space-x-1 text-orange-600">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">En attente de paiement</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Crate Information */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Archive className="h-4 w-4 mr-2 text-blue-600" />
                        Casiers (interchangeables par type)
                      </h4>
                      
                      {totalCratesToReturn > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-blue-800 mb-2">Casiers vides à récupérer :</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(crateSummary).map(([crateType, counts]) => (
                              counts.toReturn > 0 && (
                                <div key={crateType} className="bg-white rounded p-2 text-center">
                                  <div className="font-bold text-blue-700">{counts.toReturn}</div>
                                  <div className="text-blue-600 text-xs">{crateType}</div>
                                  <div className="text-blue-500 text-xs">
                                    {crateType === 'C24' ? '24×33cl' : 
                                     crateType === 'C12' ? '12×66cl' : 
                                     crateType === 'C12V' ? '12×75cl' : '6×1.5L'}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-2 bg-white rounded p-2">
                            💡 <strong>Casiers interchangeables :</strong> Acceptez n'importe quel casier vide du même type
                          </p>
                        </div>
                      )}
                      
                      {totalConsigneAmount > 0 && (
                        <div className="border-t border-blue-200 pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Consignes incluses</span>
                            <span className="font-bold text-blue-800">{formatPrice(totalConsigneAmount)}</span>
                          </div>
                        </div>
                      )}
                      
                      {totalCratesToReturn === 0 && totalConsigneAmount === 0 && (
                        <p className="text-sm text-blue-700">Aucun casier à gérer</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Voir détails
                    </button>
                    <button
                      onClick={() => handleCreateOffer(order)}
                      disabled={order.status !== 'pending-offers'}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                    >
                      {order.status === 'awaiting-client-validation' ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>En attente validation client</span>
                        </>
                      ) : isAccepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Acceptation...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Envoyer une offre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showOfferModal && selectedOrder && (
        <CreateOfferModal
          order={selectedOrder}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowOfferModal(false);
            setSelectedOrder(null);
            refreshOrders();
          }}
        />
      )}

      {showRatingModal && (
        <PendingRatingModal
          userRole="supplier"
          onClose={() => setShowRatingModal(false)}
          onGoToRating={() => {
            setShowRatingModal(false);
            onNavigate('history');
          }}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Détails de la commande
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Adresse de livraison</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedOrder.deliveryAddress}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Produits demandés</h3>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity} caisses {item.withConsigne && '(avec consigne)'}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(item.product.cratePrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCreateOffer(selectedOrder);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Créer une offre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};