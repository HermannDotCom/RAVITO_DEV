import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone, Clock, CheckCircle, Package, Navigation, Star, Archive, AlertCircle, X } from 'lucide-react';
import { Order, OrderStatus, CrateType } from '../../types';
import { useOrder } from '../../context/OrderContext';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';

interface ActiveDeliveriesProps {
  onNavigate: (section: string) => void;
}

export const ActiveDeliveries: React.FC<ActiveDeliveriesProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { supplierActiveDeliveries, updateOrderStatus, completeDelivery } = useOrder();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const accessRestrictions = getAccessRestrictions();

  // Restriction d'accès sécurisée
  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">Livraisons non accessibles</h2>
          <p className="text-orange-800">
            {accessRestrictions.restrictionReason}
          </p>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'delivered') {
      const order = supplierActiveDeliveries.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowConfirmationModal(true);
        setConfirmationCode('');
        setCodeError('');
      }
      return;
    }
    
    updateOrderStatus(orderId, newStatus);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;

    if (!selectedOrder.delivery_confirmation_code) {
      setCodeError('Code de confirmation non trouve');
      return;
    }

    if (confirmationCode !== selectedOrder.delivery_confirmation_code) {
      setCodeError('Code incorrect. Veuillez verifier avec le client.');
      return;
    }

    await updateOrderStatus(selectedOrder.id, 'delivered');
    completeDelivery(selectedOrder.id);
    
    setShowConfirmationModal(false);
    setSelectedOrder(null);
    setConfirmationCode('');
    setCodeError('');
    
    alert('Livraison confirmee avec succes!');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'accepted':
        return { label: 'Acceptée', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
      case 'preparing':
        return { label: 'En préparation', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
      case 'delivering':
        return { label: 'En livraison', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
      case 'delivered':
        return { label: 'Livrée', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
      default:
        return { label: 'En attente', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
    }
  };

  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case 'accepted':
        return { label: 'Commencer préparation', nextStatus: 'preparing' as OrderStatus };
      case 'preparing':
        return { label: 'Partir en livraison', nextStatus: 'delivering' as OrderStatus };
      case 'delivering':
        return { label: 'Marquer comme livré', nextStatus: 'delivered' as OrderStatus };
      default:
        return null;
    }
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
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Livraisons en Cours</h1>
          <p className="text-gray-600">Gérez vos livraisons actives et mettez à jour leur statut</p>
        </div>

        {supplierActiveDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune livraison en cours</h3>
            <p className="text-gray-500 mb-6">Acceptez des commandes pour commencer vos livraisons</p>
            <button
              onClick={() => onNavigate('orders')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Voir les commandes disponibles
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {supplierActiveDeliveries.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const nextAction = getNextAction(order.status);
              const crateSummary = getCrateSummary(order);
              const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
              const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
                const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
                return sum + (counts.withConsigne * consignePrice);
              }, 0);

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    {/* Status Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Commande #{order.id}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-sm text-gray-600">
                              Total: {formatPrice(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Client Info & Address */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                            Informations client
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Établissement</span>
                              <span className="font-medium">Maquis Belle Vue</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Contact</span>
                              <span className="font-medium">+225 07 12 34 56 78</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Note client</span>
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="font-medium">4.5</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Adresse de livraison</h4>
                          <p className="text-gray-700 text-sm mb-3">{order.deliveryAddress}</p>
                          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                            <Navigation className="h-4 w-4" />
                            <span className="text-sm font-medium">Ouvrir dans Maps</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-4 lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Détails de la commande</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.product.name} ({item.product.packaging})
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.product.pricePerUnit * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {order.consigneTotal > 0 && (
                              <div className="flex justify-between items-center text-sm text-orange-600 border-t border-gray-200 pt-2">
                                <span>Consignes incluses</span>
                                <span className="font-medium">{formatPrice(order.consigneTotal)}</span>
                              </div>
                            )}
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Crate Management */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Archive className="h-4 w-4 mr-2 text-blue-600" />
                            Gestion des casiers
                          </h4>
                          
                          {totalCratesToReturn > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-blue-800 mb-2">À récupérer du client :</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(crateSummary).map(([crateType, counts]) => (
                                  counts.toReturn > 0 && (
                                    <div key={crateType} className="bg-white rounded p-2 text-center">
                                      <div className="font-bold text-blue-700">{counts.toReturn}</div>
                                      <div className="text-blue-600 text-xs">{crateType}</div>
                                    </div>
                                  )
                                ))}
                              </div>
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

                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Paiement</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-700 font-medium">
                                À collecter : {getPaymentMethodLabel(order.paymentMethod)}
                              </span>
                            </div>
                            <p className="text-xs text-yellow-600">
                              Le paiement sera effectué à la livraison
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {nextAction && (
                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Contacter le client</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextAction.nextStatus)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
                        >
                          <Package className="h-4 w-4" />
                          <span>{nextAction.label}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmation du code de livraison */}
      {showConfirmationModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Confirmation de livraison</h2>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Veuillez entrer le code de confirmation fourni par le client pour confirmer la livraison.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Commande :</strong> #{selectedOrder.id.slice(0, 8)}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Adresse :</strong> {selectedOrder.deliveryAddress}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de confirmation (4 chiffres)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="CODE1234"
                  value={confirmationCode}
                  onChange={(e) => {
                    setConfirmationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setCodeError('');
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>

              {codeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{codeError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
