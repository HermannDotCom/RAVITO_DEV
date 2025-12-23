import React, { useState } from 'react';
import { Clock, Package, MapPin, X, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { Order, CrateType } from '../../types';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import { usePendingRatings } from '../../hooks/usePendingRatings';
import { PendingRatingModal } from '../Shared/PendingRatingModal';
import { SupplierOrderSections } from './SupplierOrderSections';
import { supabase } from '../../lib/supabase';
import { getSupplierPrices } from '../../services/supplierOfferService';

interface AvailableOrdersProps {
  onNavigate: (section: string) => void;
}

interface OfferItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  offeredQuantity: number;
  pricePerUnit: number;
  withConsigne: boolean;
  consigneAmount: number;
  isCustomPrice?: boolean;
  referencePricePerUnit?: number;
}

export const AvailableOrders: React.FC<AvailableOrdersProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders, refreshOrders } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();
  const { hasPendingRatings } = usePendingRatings(user?.id || null);

  const accessRestrictions = getAccessRestrictions();

  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-6 md:p-8 text-center">
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderTab, setSelectedOrderTab] = useState<'available' | 'pending' | 'active'>('available');

  const handleViewDetails = async (order: Order, activeTab: 'available' | 'pending' | 'active'): Promise<void> => {
    if (hasPendingRatings) {
      setShowRatingModal(true);
      return;
    }

    // Fetch supplier's custom prices
    const priceMap = user ? await getSupplierPrices(user.id) : new Map();

    const items: OfferItem[] = order.items.map(item => {
      const supplierPrice = priceMap.get(item.product.id);
      const pricePerUnit = supplierPrice?.crate_price ?? item.product.pricePerUnit;
      const consigneAmount = supplierPrice?.consign_price ?? (item.product.consigneAmount || 0);

      return {
        productId: item.product.id,
        productName: item.product.name,
        requestedQuantity: item.quantity,
        offeredQuantity: item.quantity,
        pricePerUnit: pricePerUnit,
        withConsigne: item.withConsigne,
        consigneAmount: consigneAmount,
        isCustomPrice: !!supplierPrice,
        referencePricePerUnit: item.product.pricePerUnit
      };
    });

    setOfferItems(items);
    setSelectedOrder(order);
    setSelectedOrderTab(activeTab);
    setMessage('');
    setShowDetailsModal(true);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setOfferItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, offeredQuantity: Math.max(0, newQuantity) }
        : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = offerItems.reduce((sum, item) => {
      return sum + (item.offeredQuantity * item.pricePerUnit);
    }, 0);

    const consigneTotal = offerItems.reduce((sum, item) => {
      return sum + (item.withConsigne ? item.offeredQuantity * item.consigneAmount : 0);
    }, 0);

    const total = subtotal + consigneTotal;
    const clientCommission = total * (commissionSettings.clientCommission / 100);
    const supplierCommission = total * (commissionSettings.supplierCommission / 100);
    const supplierNet = total - supplierCommission;
    const clientTotal = total + clientCommission;

    return {
      subtotal,
      consigneTotal,
      total,
      clientCommission,
      supplierCommission,
      supplierNet,
      clientTotal
    };
  };

  const handleSubmitOffer = async () => {
    if (!selectedOrder || !user) return;

    const activeItems = offerItems.filter(item => item.offeredQuantity > 0);
    if (activeItems.length === 0) {
      alert('Veuillez proposer au moins un produit avec une quantité supérieure à 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const totals = calculateTotals();

      const { error } = await supabase.from('supplier_offers').insert({
        order_id: selectedOrder.id,
        supplier_id: user.id,
        modified_items: activeItems.map(item => ({
          productId: item.productId,
          quantity: item.offeredQuantity,
          withConsigne: item.withConsigne
        })),
        total_amount: totals.total,
        consigne_total: totals.consigneTotal,
        supplier_commission: totals.supplierCommission,
        net_supplier_amount: totals.supplierNet,
        supplier_message: message || null,
        status: 'pending'
      });

      if (error) throw error;

      const { error: orderUpdateError } = await supabase.from('orders').update({
        status: 'offers-received'
      }).eq('id', selectedOrder.id);

      if (orderUpdateError) {
        console.error('Error updating order status:', orderUpdateError);
        throw orderUpdateError;
      }

      alert('✅ Offre envoyée avec succès!\n\nLe client va recevoir votre proposition.');

      setShowDetailsModal(false);
      setSelectedOrder(null);
      setOfferItems([]);
      setMessage('');
      await refreshOrders();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      alert('Erreur lors de l\'envoi de l\'offre: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getDistanceFromCoordinates = (coords: { lat: number; lng: number }) => {
    return (Math.random() * 5 + 0.5).toFixed(1) + ' km';
  };

  const getEstimatedTime = (coords: { lat: number; lng: number }) => {
    return Math.floor(Math.random() * 20 + 10);
  };

  const totals = selectedOrder ? calculateTotals() : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-0">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">Mes Commandes</h1>
        <p className="text-sm sm:text-base text-gray-600">Gérez vos commandes disponibles, en attente et en cours</p>
      </div>

      <SupplierOrderSections
        availableOrders={availableOrders}
        onSelectOrder={handleViewDetails}
      />

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl my-4 max-h-[calc(100vh-2rem)]">
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-2rem)]">
              <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white pb-3 border-b border-gray-200">
                <div className="min-w-0 flex-1 mr-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Détails de la commande</h2>
                  <p className="text-sm sm:text-base text-gray-600">Commande #{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Informations de livraison</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Zone de livraison</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.deliveryZone || 'Non spécifiée'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Distance estimée</p>
                    <p className="font-semibold text-gray-900">{getDistanceFromCoordinates(selectedOrder.coordinates)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  L'adresse exacte et les coordonnées du client vous seront communiquées après acceptation de votre offre
                </p>
              </div>

              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Produits demandés</h3>
                {selectedOrderTab === 'available' && offerItems.some(item => !item.isCustomPrice) && (
                  <div className="bg-orange-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-orange-800">
                      <strong>Prix par défaut:</strong> Certains produits utilisent les prix de référence Ravito. 
                      Définissez vos propres prix dans votre grille tarifaire pour être plus compétitif.
                    </p>
                  </div>
                )}
                {selectedOrderTab === 'available' && (
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Note:</strong> Vous pouvez modifier les quantités selon vos disponibilités. Les produits avec une quantité de 0 seront retirés de l'offre.
                    </p>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  {offerItems.map((item) => (
                    <div key={item.productId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            Prix unitaire: {formatPrice(item.pricePerUnit)}
                            {item.withConsigne && ` (+ ${formatPrice(item.consigneAmount)} consigne)`}
                          </p>
                        </div>
                        {item.isCustomPrice ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Prix perso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ⚠ Défaut
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p className="text-gray-600">
                            {selectedOrderTab === 'available' ? 'Demandé' : 'Quantité'}: <span className="font-semibold">{item.requestedQuantity} caisses</span>
                          </p>
                          {selectedOrderTab === 'available' && item.offeredQuantity !== item.requestedQuantity && (
                            <p className="text-orange-600 font-medium">
                              Vous proposez: {item.offeredQuantity} caisses
                            </p>
                          )}
                        </div>

                        {selectedOrderTab === 'available' && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.productId, item.offeredQuantity - 1)}
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                              disabled={item.offeredQuantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              value={item.offeredQuantity}
                              onChange={(e) => updateQuantity(item.productId, Math.min(parseInt(e.target.value) || 0, item.requestedQuantity))}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                              min="0"
                              max={item.requestedQuantity}
                            />
                            <button
                              onClick={() => updateQuantity(item.productId, item.offeredQuantity + 1)}
                              disabled={item.offeredQuantity >= item.requestedQuantity}
                              className={`p-2 border rounded-lg ${
                                item.offeredQuantity >= item.requestedQuantity
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-right">
                        <p className="text-sm text-gray-600">Sous-total:</p>
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.offeredQuantity * (item.pricePerUnit + (item.withConsigne ? item.consigneAmount : 0)))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrderTab === 'available' && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Message au client (optionnel)</h3>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex: Certains produits sont en stock limité..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}

              {totals && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif financier</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-semibold">{formatPrice(totals.subtotal)}</span>
                    </div>
                    {totals.consigneTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Consignes</span>
                        <span className="font-semibold">{formatPrice(totals.consigneTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-red-600">
                      <span>Commission fournisseur (-{commissionSettings.supplierCommission}%)</span>
                      <span className="font-semibold">-{formatPrice(totals.supplierCommission)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>Vous recevrez (24h)</span>
                        <span>{formatPrice(totals.supplierNet)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Total client</span>
                        <span className="font-semibold">{formatPrice(totals.clientTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  {selectedOrderTab === 'available' ? 'Annuler' : 'Fermer'}
                </button>
                {selectedOrderTab === 'available' && (
                  <button
                    onClick={handleSubmitOffer}
                    disabled={isSubmitting || offerItems.every(item => item.offeredQuantity === 0)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Envoyer l'offre</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
      </div>
    </div>
  );
};
