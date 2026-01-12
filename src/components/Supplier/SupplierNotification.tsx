import React, { useState } from 'react';
import { Phone, MapPin, User, CheckCircle, Package, Archive, CreditCard as Edit3, Save, Clock } from 'lucide-react';
import { Order, CrateType } from '../../types';
import { useOrder } from '../../context/OrderContext';

interface SupplierNotificationProps {
  order: Order;
  clientInfo: {
    name: string;
    businessName: string;
    phone: string;
    address: string;
    commune: string;
  };
  onContinue: () => void;
}

export const SupplierNotification: React.FC<SupplierNotificationProps> = ({
  order,
  clientInfo,
  onContinue
}) => {
  const { updateDeliveryTime, supplierOffer } = useOrder();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newEstimatedTime, setNewEstimatedTime] = useState(supplierOffer?.estimatedTime || 25);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handleUpdateTime = () => {
    updateDeliveryTime(newEstimatedTime);
    setIsEditingTime(false);
  };

  // Calculate crate summary
  const getCrateSummary = () => {
    const crateSummary: { [key: string]: { withConsigne: number; toReturn: number } } = {
      B33: { withConsigne: 0, toReturn: 0 },
      B65: { withConsigne: 0, toReturn: 0 },
      B100: { withConsigne: 0, toReturn: 0 },
      B50V: { withConsigne: 0, toReturn: 0 },
      B100V: { withConsigne: 0, toReturn: 0 }
    };

    order.items.forEach(item => {
      const crateType = item.product.crateType;
      if (crateType in crateSummary) {
        if (item.withConsigne) {
          crateSummary[crateType].withConsigne += item.quantity;
        } else {
          crateSummary[crateType].toReturn += item.quantity;
        }
      }
    });

    return crateSummary;
  };

  const crateSummary = getCrateSummary();
  const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
  const totalConsigneAmount = order.items.reduce((sum, item) => {
    if (item.withConsigne) {
      return sum + (item.product.consignPrice * item.quantity);
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande payée et confirmée !</h2>
            <p className="text-gray-600">Voici les coordonnées de votre client</p>
          </div>

          {/* Payment Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Paiement reçu : {formatPrice(order.totalAmount)}</p>
                <p className="text-sm text-green-700">
                  Commande #{order.id} - Vous pouvez commencer la préparation
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Time Management */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Temps de livraison estimé</p>
                  <p className="text-sm text-orange-700">Vous pouvez affiner votre estimation</p>
                </div>
              </div>
              
              {isEditingTime ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newEstimatedTime}
                    onChange={(e) => setNewEstimatedTime(parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-orange-300 rounded text-center focus:ring-2 focus:ring-orange-500"
                    min="5"
                    max="60"
                  />
                  <span className="text-orange-700">min</span>
                  <button
                    onClick={handleUpdateTime}
                    className="p-1 text-green-600 hover:text-green-700 bg-white rounded"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-orange-900">
                    {supplierOffer?.estimatedTime || newEstimatedTime} min
                  </span>
                  <button
                    onClick={() => setIsEditingTime(true)}
                    className="p-1 text-orange-600 hover:text-orange-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Coordonnées du client
            </h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {(clientInfo.businessName || clientInfo.name || 'C').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{clientInfo.businessName || clientInfo.name || 'Client'}</h4>
                <p className="text-sm text-gray-600">Contact: {clientInfo.name || 'Non disponible'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{clientInfo.phone || 'Non disponible'}</span>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{order.deliveryAddress}</span>
              </div>
            </div>
          </div>

          {/* Crate Management */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Archive className="h-4 w-4 mr-2" />
              Gestion des casiers
            </h4>
            
            {(() => {
              const cratesToReturn = order.items.filter(item => !item.withConsigne);
              const cratesWithConsigne = order.items.filter(item => item.withConsigne);
              
              return (
                <div className="space-y-3">
                  {cratesToReturn.length > 0 && (
                    <div className="bg-white border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">Casiers vides à récupérer chez le client :</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {cratesToReturn.map((item, index) => (
                          <div key={index} className="bg-blue-50 rounded p-2 text-center">
                            <div className="text-lg font-bold text-blue-700">{item.quantity}</div>
                            <div className="text-blue-600 text-xs">{item.product.crateType}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cratesWithConsigne.length > 0 && (
                    <div className="bg-white border border-orange-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-orange-800 mb-2">Consignes incluses dans le paiement :</p>
                      <div className="space-y-1">
                        {cratesWithConsigne.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-orange-700">{item.quantity} casier(s) {item.product.crateType}</span>
                            <span className="text-orange-600 font-medium">
                              {formatPrice(item.product.consigneAmount * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-orange-600 mt-2">
                        Le client garde les casiers, aucun retour nécessaire
                      </p>
                    </div>
                  )}
                  
                  {cratesToReturn.length === 0 && cratesWithConsigne.length === 0 && (
                    <p className="text-sm text-blue-700">Aucun casier à gérer pour cette commande</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Récapitulatif de la commande</h4>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.product.name} ({item.product.crateType})
                    {item.withConsigne && <span className="text-orange-600 ml-1">+ Consigne</span>}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.product.pricePerUnit * item.quantity + 
                      (item.withConsigne ? item.product.consigneAmount * item.quantity : 0))}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Total payé</span>
                  <span className="text-green-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">Prochaines étapes :</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Contactez le client pour confirmer la livraison</li>
                  <li>Préparez la commande avec les produits demandés</li>
                  <li>Récupérez les casiers vides si nécessaire</li>
                  <li>Effectuez la livraison à l'adresse indiquée</li>
                </ol>
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
          >
            <Package className="h-5 w-5" />
            <span>Commencer la préparation</span>
          </button>
        </div>
      </div>
    </div>
  );
};