import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, MessageSquare, AlertCircle, CreditCard, Star } from 'lucide-react';
import { Order } from '../../types';
import { SupplierOffer, getOffersByOrder, acceptOffer, rejectOffer } from '../../services/supplierOfferService';

interface ReceivedOffersProps {
  order: Order;
  onOfferAccepted: () => void;
  onPaymentRequest?: () => void;
}

export const ReceivedOffers: React.FC<ReceivedOffersProps> = ({ order, onOfferAccepted, onPaymentRequest }) => {
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOffers();
  }, [order.id]);

  const loadOffers = async () => {
    setLoading(true);
    const data = await getOffersByOrder(order.id);
    setOffers(data);
    setLoading(false);
  };

  const handleAcceptOffer = async (offerId: string) => {
    setProcessingOfferId(offerId);
    setError('');

    const result = await acceptOffer(offerId, order.id);

    setProcessingOfferId(null);

    if (result.success) {
      await loadOffers();
      onOfferAccepted();
    } else {
      setError(result.error || 'Erreur lors de l\'acceptation de l\'offre');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setProcessingOfferId(offerId);
    setError('');

    const result = await rejectOffer(offerId);

    setProcessingOfferId(null);

    if (result.success) {
      await loadOffers();
    } else {
      setError(result.error || 'Erreur lors du refus de l\'offre');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-4 w-4 mr-1" />
            Refusée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            En attente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Chargement des offres...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          Aucune offre reçue pour le moment
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Les fournisseurs de votre zone examinent votre commande
        </p>
      </div>
    );
  }

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const hasAcceptedOffer = offers.some(o => o.status === 'accepted');

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> Les identités des fournisseurs sont masquées jusqu'au paiement.
          Vous pouvez refuser plusieurs offres mais ne pouvez en accepter qu'une seule.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Offres reçues ({offers.length})
      </h3>

      <div className="space-y-4">
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className={`p-6 border rounded-lg ${
              offer.status === 'accepted'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : offer.status === 'rejected'
                ? 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-60'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Offre #{index + 1}
                </h4>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Note moyenne reçue du fournisseur :</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {offer.supplierRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reçue le {formatDate(offer.createdAt)}
                </p>
              </div>
              {getOfferStatusBadge(offer.status)}
            </div>

            <div className="space-y-3 mb-4">
              <h5 className="font-medium text-gray-900 dark:text-white">Produits proposés:</h5>
              {offer.modifiedItems.map((item: any, idx: number) => {
                const originalItem = order.items.find(oi => oi.product.id === item.productId);
                const hasChanged = originalItem && originalItem.quantity !== item.quantity;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {originalItem?.product.name || 'Produit'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantité: {item.quantity} caisses
                        {hasChanged && (
                          <span className="ml-2 text-orange-600 dark:text-orange-400">
                            (demandé: {originalItem?.quantity})
                          </span>
                        )}
                      </p>
                    </div>
                    {item.withConsigne && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        Consigne
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {offer.supplierMessage && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Message du fournisseur:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {offer.supplierMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
              {offer.consigneTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Consigne</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(offer.consigneTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
                <span className="text-gray-900 dark:text-white">Total à payer</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatPrice(offer.totalAmount)}
                </span>
              </div>
            </div>

            {offer.status === 'pending' && !hasAcceptedOffer && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleAcceptOffer(offer.id)}
                  disabled={processingOfferId !== null}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {processingOfferId === offer.id ? 'Acceptation...' : 'Accepter'}
                </button>
                <button
                  onClick={() => handleRejectOffer(offer.id)}
                  disabled={processingOfferId !== null}
                  className="flex-1 px-4 py-2 border border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  {processingOfferId === offer.id ? 'Refus...' : 'Refuser'}
                </button>
              </div>
            )}

            {offer.status === 'accepted' && (
              <div className="mt-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg mb-3">
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    ✅ Offre acceptée ! Procédez au paiement pour finaliser votre commande.
                  </p>
                </div>
                {onPaymentRequest && (
                  <button
                    onClick={onPaymentRequest}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Procéder au paiement
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {pendingOffers.length === 0 && !hasAcceptedOffer && offers.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Vous avez refusé toutes les offres. Les fournisseurs peuvent soumettre de nouvelles offres.
          </p>
        </div>
      )}
    </div>
  );
};
