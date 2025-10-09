import React, { useState } from 'react';
import { Package, Truck, Clock, TrendingUp, Star, MapPin, Phone, Eye, CheckCircle, X, AlertCircle, Archive, CreditCard, User } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { CrateType } from '../../types';

interface SupplierDashboardProps {
  onNavigate: (section: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders, acceptOrderAsSupplier } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();

  const accessRestrictions = getAccessRestrictions();

  // Vérification sécurisée de l'accès
  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">
            {user?.role === 'supplier' ? 'Dépôt en cours de validation' : 'Accès restreint'}
          </h2>
          <p className="text-orange-800 mb-6">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-orange-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">Dépôt soumis :</h3>
            <div className="text-sm text-orange-800 space-y-1 text-left">
              <p><strong>Dépôt :</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable :</strong> {user.name}</p>
              <p><strong>Zone de couverture :</strong> {(user as any)?.coverageZone || 'Non renseignée'}</p>
              <p><strong>Capacité :</strong> {(user as any)?.deliveryCapacity || 'Non renseignée'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Documents requis :</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>✓ Pièce d'identité</li>
                <li>✓ Justificatif d'adresse</li>
                <li>⏳ Licence commerciale</li>
                <li>⏳ Assurance véhicule</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Après approbation :</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Accès aux commandes</li>
                <li>• Gestion des livraisons</li>
                <li>• Reversements automatiques</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
          </div>
          <div className="text-sm text-orange-700">
            <p className="mb-2"><strong>Délai d'approbation :</strong> 24-72 heures</p>
            <p>Contact : <strong>partenaires@distri-night.ci</strong> ou <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(25);
  const [isAccepting, setIsAccepting] = useState(false);

  const stats = [
    {
      label: 'Commandes disponibles',
      value: availableOrders.length,
      icon: Package,
      color: 'orange',
      action: () => onNavigate('orders')
    },
    {
      label: 'En livraison',
      value: 0,
      icon: Truck,
      color: 'blue'
    },
    {
      label: 'Note moyenne',
      value: user?.rating || 5,
      icon: Star,
      color: 'yellow'
    },
    {
      label: 'Total livraisons',
      value: user?.totalOrders || 0,
      icon: TrendingUp,
      color: 'green'
    }
  ];

  const handleShowDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleShowAccept = (order: any) => {
    setSelectedOrder(order);
    setEstimatedTime(order.estimatedTime);
    setShowAcceptModal(true);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    
    setIsAccepting(true);
    
    // Simulate preparation time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    acceptOrderAsSupplier(selectedOrder.id, estimatedTime);
    
    setIsAccepting(false);
    setShowAcceptModal(false);
    setSelectedOrder(null);
    
    // Show success message
    alert('✅ Offre envoyée avec succès!\n\nLe client va recevoir votre proposition de livraison. La commande passera en "Acceptée" après validation du client.');
  };

  const getCrateSummary = (order: any) => {
    const crateSummary: { [key in CrateType]: { withConsigne: number; toReturn: number } } = {
      C24: { withConsigne: 0, toReturn: 0 },
      C12: { withConsigne: 0, toReturn: 0 },
      C12V: { withConsigne: 0, toReturn: 0 },
      C6: { withConsigne: 0, toReturn: 0 }
    };

    // Mock items for dashboard orders
    const mockItems = [
      { product: { crateType: 'C24' as CrateType }, quantity: 2, withConsigne: false },
      { product: { crateType: 'C12' as CrateType }, quantity: 1, withConsigne: true }
    ];

    mockItems.forEach(item => {
      if (item.withConsigne) {
        crateSummary[item.product.crateType].withConsigne += item.quantity;
      } else {
        crateSummary[item.product.crateType].toReturn += item.quantity;
      }
    });

    return crateSummary;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {(user as any)?.businessName || 'Tableau de Bord Fournisseur'}
        </h1>
        <p className="text-gray-600">
          Responsable: {user?.name} • Gérez vos livraisons et commandes disponibles
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${
                stat.action ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
              }`}
              onClick={stat.action}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.icon === Star ? `${stat.value}/5` : stat.value}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <StatIcon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Orders */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Commandes disponibles</h3>
        
        {availableOrders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande disponible pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{order.clientName}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{order.clientRating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{order.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{order.items.length} article(s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{order.distance} • ~{order.estimatedTime} min</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </span>
                      {order.consigneTotal > 0 && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                          Consigne incluse
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleShowDetails(order)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Détails</span>
                    </button>
                    <button
                      onClick={() => handleShowAccept(order)}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accepter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Détails de la commande</h2>
                    <p className="text-gray-600">Commande #{selectedOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Client Information */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Informations client
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Établissement:</span>
                        <span className="font-medium text-gray-900">{selectedOrder.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium text-gray-900">Jean Dupont</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-medium text-gray-900">+225 07 12 34 56 78</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Note client:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{selectedOrder.clientRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                      Livraison
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 block mb-1">Adresse:</span>
                        <span className="font-medium text-gray-900">{selectedOrder.address}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium text-gray-900 ml-2">{selectedOrder.distance}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Temps estimé:</span>
                          <span className="font-medium text-gray-900 ml-2">~{selectedOrder.estimatedTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Détails de la commande</h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">2x Flag Spéciale 33cl (C24)</span>
                          <span className="font-bold">{formatPrice(36000)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Prix unitaire: {formatPrice(18000)}</span>
                          {!selectedOrder.consigneIncluded && (
                            <span className="ml-4 text-blue-600">Casiers à récupérer</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">1x Castel Beer 66cl (C12)</span>
                          <span className="font-bold">{formatPrice(13200)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Prix unitaire: {formatPrice(13200)}</span>
                          {selectedOrder.consigneIncluded && (
                            <span className="ml-4 text-orange-600">+ Consigne incluse</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-green-200 pt-3">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total</span>
                          <span>{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crate Management */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Archive className="h-5 w-5 mr-2 text-blue-600" />
                      Gestion des casiers (interchangeables par type)
                    </h3>
                    
                    {(() => {
                      const crateSummary = getCrateSummary(selectedOrder);
                      const totalCratesToReturn = Object.values(crateSummary).reduce((sum, crate) => sum + crate.toReturn, 0);
                      const totalConsigneAmount = Object.entries(crateSummary).reduce((sum, [crateType, counts]) => {
                        const consignePrice = crateType === 'C12V' ? 4000 : crateType === 'C6' ? 2000 : 3000;
                        return sum + (counts.withConsigne * consignePrice);
                      }, 0);
                      
                      return (
                        <div className="space-y-3">
                          {totalCratesToReturn > 0 && (
                            <div className="bg-white border border-blue-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-blue-800 mb-3">Casiers vides à récupérer :</p>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(crateSummary).map(([crateType, counts]) => (
                                  counts.toReturn > 0 && (
                                    <div key={crateType} className="bg-blue-50 rounded p-3 text-center">
                                      <div className="text-lg font-bold text-blue-700">{counts.toReturn}</div>
                                      <div className="text-blue-600 text-sm">{crateType}</div>
                                      <div className="text-blue-500 text-xs">
                                        {crateType === 'C24' ? '24×33cl' : 
                                         crateType === 'C12' ? '12×66cl' : 
                                         crateType === 'C12V' ? '12×75cl' : '6×1.5L'}
                                      </div>
                                    </div>
                                  )
                                ))}
                              </div>
                              <p className="text-xs text-blue-600 mt-3 bg-white rounded p-2">
                                💡 <strong>Casiers interchangeables :</strong> Acceptez n'importe quel casier vide du même type
                              </p>
                            </div>
                          )}
                          
                          {totalConsigneAmount > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-orange-700">Consignes incluses</span>
                                <span className="font-bold text-orange-800">{formatPrice(totalConsigneAmount)}</span>
                              </div>
                            </div>
                          )}
                          
                          {totalCratesToReturn === 0 && totalConsigneAmount === 0 && (
                            <p className="text-sm text-blue-700">Aucun casier à gérer</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Information */}
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-yellow-600" />
                      Informations paiement
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mode de paiement:</span>
                        <span className="font-medium text-gray-900">Orange Money</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <span className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="font-medium">Confirmé</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant total:</span>
                        <span className="font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleShowAccept(selectedOrder);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Accepter cette commande</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Order Modal */}
      {showAcceptModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Accepter la commande</h2>
                <p className="text-gray-600">Commande #{selectedOrder.id} - {selectedOrder.clientName}</p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Résumé de la commande</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Articles:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedOrder.items.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedOrder.distance}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Time Estimation */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-orange-900 mb-3">Temps de livraison estimé</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEstimatedTime(Math.max(10, estimatedTime - 5))}
                      className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-700">{estimatedTime}</div>
                      <div className="text-xs text-orange-600">minutes</div>
                    </div>
                    <button
                      onClick={() => setEstimatedTime(estimatedTime + 5)}
                      className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-700">
                      Ajustez selon votre charge de travail actuelle et les conditions de circulation
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission Information for Supplier */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Répartition financière</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Montant total de la commande :</span>
                    <span className="font-bold text-blue-900">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Commission DISTRI-NIGHT ({commissionSettings.supplierCommission}%) :</span>
                    <span className="font-medium">-{formatPrice(getSupplierNetAmount(selectedOrder.totalAmount).commission)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2">
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Montant reversé (sous 24h) :</span>
                      <span>{formatPrice(getSupplierNetAmount(selectedOrder.totalAmount).netAmount)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-white border border-blue-300 rounded p-2">
                  <p className="text-xs text-blue-700">
                    💰 <strong>Garantie de paiement :</strong> Le montant vous sera reversé automatiquement 
                    dans les 24h suivant la livraison confirmée.
                  </p>
                </div>
              </div>

              {/* Commitment Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-2">Engagement de livraison</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Vous vous engagez à livrer dans le délai annoncé</li>
                      <li>Le client sera notifié de votre acceptation</li>
                      <li>Vous recevrez les coordonnées complètes après paiement du client</li>
                      <li>La commande apparaîtra dans vos "Livraisons en cours"</li>
                      <li>Le reversement sera effectué automatiquement sous 24h après livraison</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAcceptOrder}
                  disabled={isAccepting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Acceptation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirmer l'acceptation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};