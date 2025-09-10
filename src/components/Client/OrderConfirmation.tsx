import React, { useState } from 'react';
import { Clock, Package, MapPin, CreditCard, CheckCircle, X, AlertCircle, Archive, Smartphone } from 'lucide-react';
import { Order, PaymentMethod, CrateType } from '../../types';
import { useApp } from '../../context/AppContext';

interface OrderConfirmationProps {
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  onAccept,
  onReject,
  onCancel
}) => {
  const { clientCurrentOrder, supplierOffer, commissionSettings } = useApp();
  
  if (!clientCurrentOrder || !supplierOffer) {
    return null;
  }

  // Calculate totals
  const subtotal = clientCurrentOrder.items.reduce((sum, item) => 
    sum + (item.product.pricePerUnit * item.quantity), 0
  );
  
  const consigneTotal = clientCurrentOrder.items.reduce((sum, item) => 
    sum + (item.withConsigne ? item.product.consigneAmount * item.quantity : 0), 0
  );
  
  const clientCommission = Math.round(subtotal * (commissionSettings.clientCommission / 100));
  const total = subtotal + consigneTotal + clientCommission;

  // Calculate crate summary
  const getCrateSummary = () => {
    const crateSummary: { [key in CrateType]: number } = {
      C24: 0,
      C12: 0,
      C12V: 0,
      C6: 0
    };

    clientCurrentOrder.items.forEach(item => {
      if (!item.withConsigne) {
        crateSummary[item.product.crateType] += item.quantity;
      }
    });

    return crateSummary;
  };

  const crateSummary = getCrateSummary();
  const totalCratesToReturn = Object.values(crateSummary).reduce((sum, count) => sum + count, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Offre de livraison reçue !</h2>
            <p className="text-gray-600">Un fournisseur a accepté votre commande #{clientCurrentOrder.id}</p>
          </div>

          {/* Supplier Info (Limited) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div className="text-center">
                <p className="font-medium text-blue-900">Fournisseur disponible</p>
                <p className="text-sm text-blue-700">
                  Zone : {supplierOffer.supplierCommune} • Temps estimé : {supplierOffer.estimatedTime} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <Clock className="h-6 w-6 text-green-600" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-900">
                  Livraison estimée : {supplierOffer.estimatedTime} minutes
                </p>
                <p className="text-sm text-green-700">
                  Le fournisseur peut livrer maintenant
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              Récapitulatif de votre commande
            </h3>
            
            <div className="space-y-3 mb-4">
              {clientCurrentOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.quantity}x {item.product.name}
                    </span>
                    <div className="text-sm text-gray-600">
                      {item.product.crateType} • {item.product.brand}
                      {item.withConsigne && (
                        <span className="ml-2 text-orange-600 font-medium">+ Consigne</span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(item.product.pricePerUnit * item.quantity + 
                      (item.withConsigne ? item.product.consigneAmount * item.quantity : 0))}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total produits</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {consigneTotal > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Total consignes</span>
                  <span>{formatPrice(consigneTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-blue-600">
                <span>Frais DISTRI-NIGHT ({commissionSettings.clientCommission}%)</span>
                <span>{formatPrice(clientCommission)}</span>
              </div>
              <div className="text-xs text-blue-500 -mt-1 text-right">
                Frais de traitement de la plateforme
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Montant à régler</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Crate Return Information */}
          {totalCratesToReturn > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Archive className="h-4 w-4 mr-2" />
                Casiers vides à rendre au livreur
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {Object.entries(crateSummary).map(([crateType, count]) => (
                  count > 0 && (
                    <div key={crateType} className="bg-white rounded p-3 text-center">
                      <div className="text-lg font-bold text-blue-700">{count}</div>
                      <div className="text-blue-600 text-sm">{crateType}</div>
                    </div>
                  )
                ))}
              </div>
              <p className="text-sm text-blue-700 font-medium">
                ⚠️ Préparez {totalCratesToReturn} casier(s) vide(s) pour le livreur
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                {clientCurrentOrder.paymentMethod === 'card' ? (
                  <CreditCard className="h-5 w-5 text-white" />
                ) : (
                  <Smartphone className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Mode de paiement</p>
                <p className="text-sm text-gray-600">{getPaymentMethodLabel(clientCurrentOrder.paymentMethod)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Adresse de livraison</p>
                <p className="text-gray-700">{clientCurrentOrder.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Anonymity Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Protection de la vie privée</p>
                <p>
                  Les coordonnées complètes du fournisseur vous seront communiquées uniquement après confirmation 
                  du paiement pour garantir la sécurité des deux parties.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Accepter et payer ({formatPrice(total)})</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onReject}
                className="px-6 py-3 border border-orange-300 text-orange-700 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Refuser l'offre</span>
              </button>
              
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Annuler commande</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              En acceptant, vous vous engagez à effectuer le paiement et à être présent pour la livraison
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};