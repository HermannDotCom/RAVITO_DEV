import React from 'react';
import { Clock, Package, MapPin, CreditCard } from 'lucide-react';
import { Order } from '../../types';
import { ReceivedOffers } from './ReceivedOffers';

interface OrderDetailsWithOffersProps {
  order: Order;
  onOfferAccepted: () => void;
  onClose: () => void;
  onPaymentRequest?: () => void;
}

export const OrderDetailsWithOffers: React.FC<OrderDetailsWithOffersProps> = ({
  order,
  onOfferAccepted,
  onClose,
  onPaymentRequest
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; classes: string }> = {
      'pending-offers': {
        label: 'En attente d\'offres',
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      'offers-received': {
        label: 'Offres reçues',
        classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      'awaiting-payment': {
        label: 'En attente de paiement',
        classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      },
      'paid': {
        label: 'Payé',
        classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      'preparing': {
        label: 'En préparation',
        classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      'delivering': {
        label: 'En livraison',
        classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      },
      'delivered': {
        label: 'Livrée',
        classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      'awaiting-rating': {
        label: 'En attente d\'évaluation',
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      'cancelled': {
        label: 'Annulée',
        classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }
    };

    const config = statusConfig[status] || {
      label: status,
      classes: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.classes}`}>
        {config.label}
      </span>
    );
  };

  const showOffers = ['offers-received', 'awaiting-payment', 'paid'].includes(order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Commande #{order.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Passée le {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Adresse de livraison
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{order.deliveryAddress}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Méthode de paiement
              </h3>
              <p className="text-gray-700 dark:text-gray-300 capitalize">{order.paymentMethod}</p>
            </div>
          </div>

          {order.status === 'pending-offers' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Votre commande est en attente d'offres
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Les fournisseurs de votre zone examinent votre demande. Vous serez notifié dès réception d'offres.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Produits commandés
            </h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.quantity} caisses × {formatPrice(item.product.cratePrice)}
                      {item.withConsigne && ' + consigne'}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(
                      item.product.cratePrice * item.quantity +
                        (item.withConsigne ? item.product.consignPrice * item.quantity : 0)
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {showOffers && (
            <div>
              <ReceivedOffers
                order={order}
                onOfferAccepted={onOfferAccepted}
                onPaymentRequest={onPaymentRequest}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
