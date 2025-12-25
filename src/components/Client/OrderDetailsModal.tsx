import React, { memo } from 'react';
import { XCircle, Download, Archive, CreditCard, Phone, Package, Key, Star } from 'lucide-react';
import { Order, CrateType } from '../../types';
import { MutualRatingsDisplay } from '../Shared/MutualRatingsDisplay';
import { RatingBadge } from '../Shared/RatingBadge';

interface SupplierProfile {
  id: string;
  name: string;
  business_name?: string;
  phone?: string;
  rating?: number;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  formatPrice: (price: number) => string;
  formatDate: (date: Date | string) => string;
  getPaymentMethodLabel: (method: string) => string;
  getStatusInfo: (status: string) => {
    label: string;
    icon: React.ComponentType<any>;
    textColor: string;
    color: string;
  };
  getSupplierName: (supplierId?: string) => string;
  getSupplierProfile: (supplierId?: string) => SupplierProfile | null;
  isSupplierRevealed: (status: string) => boolean;
  handleRateSupplier: (order: Order) => void;
  handleCancelOrder: (orderId: string) => void;
}

const getCrateSummary = (order: Order) => {
  const crateSummary: Record<string, { withConsigne: number; toReturn: number }> = {};

  order.items.forEach(item => {
    const crateType = item.product.crateType;

    if (!crateSummary[crateType]) {
      crateSummary[crateType] = { withConsigne: 0, toReturn: 0 };
    }

    if (item.withConsigne) {
      crateSummary[crateType].withConsigne += item.quantity;
    } else {
      crateSummary[crateType].toReturn += item.quantity;
    }
  });

  return crateSummary;
};

export const OrderDetailsModal = memo<OrderDetailsModalProps>(({
  order,
  onClose,
  formatPrice,
  formatDate,
  getPaymentMethodLabel,
  getStatusInfo,
  getSupplierName,
  getSupplierProfile,
  isSupplierRevealed,
  handleRateSupplier,
  handleCancelOrder
}) => {
  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const crateSummary = getCrateSummary(order);
  const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
  const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
    const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
    return sum + (counts.withConsigne * consignePrice);
  }, 0);

  // Memoize supplier profile data
  const supplierProfile = order.supplierId && isSupplierRevealed(order.status)
    ? getSupplierProfile(order.supplierId)
    : null;

  // Map status text colors to gradient classes (Tailwind needs explicit class names)
  const statusGradientClasses: Record<string, string> = {
    'text-yellow-600': 'bg-gradient-to-br from-yellow-400 to-yellow-500',
    'text-blue-600': 'bg-gradient-to-br from-blue-400 to-blue-500',
    'text-orange-600': 'bg-gradient-to-br from-orange-400 to-orange-500',
    'text-green-600': 'bg-gradient-to-br from-green-400 to-green-500',
    'text-purple-600': 'bg-gradient-to-br from-purple-400 to-purple-500',
    'text-red-600': 'bg-gradient-to-br from-red-400 to-red-500',
    'text-gray-600': 'bg-gradient-to-br from-gray-400 to-gray-500',
  };

  const iconGradientClass = statusGradientClasses[statusInfo.textColor] || 'bg-gradient-to-br from-gray-400 to-gray-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${iconGradientClass}`}>
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
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de livraison</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block mb-1">Adresse:</span>
                    <span className="font-medium text-gray-900">{order.deliveryAddress}</span>
                  </div>
                  {order.supplierId && isSupplierRevealed(order.status) && (
                    <>
                      <div>
                        <span className="text-gray-600 block mb-1">Fournisseur:</span>
                        <span className="font-medium text-gray-900">{getSupplierName(order.supplierId)}</span>
                      </div>
                      {supplierProfile && (
                        <>
                          {supplierProfile.phone && (
                            <div>
                              <span className="text-gray-600 block mb-1">Téléphone:</span>
                              <a 
                                href={`tel:${supplierProfile.phone}`}
                                className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                {supplierProfile.phone}
                              </a>
                            </div>
                          )}
                          {supplierProfile.rating && supplierProfile.rating > 0 && (
                            <div>
                              <span className="text-gray-600 block mb-1">Note du fournisseur :</span>
                              <RatingBadge
                                rating={supplierProfile.rating}
                                reviewCount={1}
                                userId={supplierProfile.id}
                                userType="supplier"
                                size="sm"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {order.supplierId && !isSupplierRevealed(order.status) && (
                    <div>
                      <span className="text-gray-600 block mb-1">Fournisseur:</span>
                      <span className="font-medium text-gray-500 italic">Révélé après paiement</span>
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

              {/* Delivery Confirmation Code - Display when status is "delivering" */}
              {order.status === 'delivering' && 
               (order.deliveryConfirmationCode || order.delivery_confirmation_code) && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2 text-orange-600" />
                    Code de confirmation
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white border-2 border-orange-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-mono font-bold text-orange-600 tracking-widest mb-2">
                        {order.deliveryConfirmationCode || order.delivery_confirmation_code}
                      </div>
                      <div className="flex items-center justify-center text-orange-700">
                        <Package className="h-4 w-4 mr-2" />
                        <span className="text-sm">À communiquer au livreur lors de la réception</span>
                      </div>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <p className="text-xs text-orange-800 text-center">
                        ⚠️ Ce code est unique et sécurise la réception de votre commande. Ne le partagez qu'avec le livreur lors de la livraison.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

              {/* Mutual Ratings Display - for delivered orders */}
              {order.status === 'delivered' && (
                <MutualRatingsDisplay
                  orderId={order.id}
                  currentUserRole="client"
                />
              )}

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
});

OrderDetailsModal.displayName = 'OrderDetailsModal';
