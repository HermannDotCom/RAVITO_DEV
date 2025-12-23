import React from 'react';
import { MapPin, Phone, Navigation, Play, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { DeliveryOrder } from '../../../types/delivery';

interface DeliveryCardProps {
  delivery: DeliveryOrder;
  onStartDelivery: () => void;
  onMarkArrived: () => void;
  onConfirmDelivery: () => void;
  onNavigate: () => void;
  onCall: () => void;
}

/**
 * Individual delivery card showing all relevant info and actions
 * Mobile-optimized with large touch targets
 */
export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onStartDelivery,
  onMarkArrived,
  onConfirmDelivery,
  onNavigate,
  onCall,
}) => {
  const getStatusBadge = () => {
    switch (delivery.status) {
      case 'ready_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            <Clock className="h-3 w-3" />
            Prêt
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
            🚚 En livraison
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
            📍 Arrivé
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
            <CheckCircle className="h-3 w-3" />
            Livrée
          </span>
        );
    }
  };

  const getPaymentBadge = () => {
    if (delivery.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
          ✓ Payé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
        ⚠️ À collecter
        </span>
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const renderActions = () => {
    switch (delivery.status) {
      case 'ready_for_delivery':
        return (
          <div className="flex gap-2">
            <button
              onClick={onNavigate}
              className="flex-1 min-h-[48px] px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors active:scale-95"
            >
              <Navigation className="h-5 w-5" />
              Naviguer
            </button>
            <button
              onClick={onStartDelivery}
              className="flex-1 min-h-[48px] px-4 py-3 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
            >
              <Play className="h-5 w-5" />
              Démarrer
            </button>
          </div>
        );

      case 'out_for_delivery':
        return (
          <div className="flex gap-2">
            <button
              onClick={onNavigate}
              className="flex-1 min-h-[48px] px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors active:scale-95"
            >
              <Navigation className="h-5 w-5" />
              Naviguer
            </button>
            <button
              onClick={onMarkArrived}
              className="flex-1 min-h-[48px] px-4 py-3 bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors active:scale-95"
            >
              <MapPin className="h-5 w-5" />
              Arrivé
            </button>
          </div>
        );

      case 'arrived':
        return (
          <div className="flex gap-2">
            <button
              onClick={onCall}
              className="flex-1 min-h-[48px] px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors active:scale-95"
            >
              <Phone className="h-5 w-5" />
              Appeler
            </button>
            <button
              onClick={onConfirmDelivery}
              className="flex-1 min-h-[48px] px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95"
            >
              <CheckCircle className="h-5 w-5" />
              Confirmer
            </button>
          </div>
        );

      case 'delivered':
        return (
          <div className="flex items-center justify-center py-2 text-emerald-600 font-semibold">
            <CheckCircle className="h-5 w-5 mr-2" />
            Livraison terminée
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-green-50 border-b-2 border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-600 mb-1">Commande</div>
          <div className="text-lg font-bold text-gray-900">#{delivery.orderNumber}</div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Client Name */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">Client</div>
            <div className="font-semibold text-gray-900">{delivery.clientName}</div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">Adresse</div>
            <div className="text-sm text-gray-900">{delivery.clientAddress}</div>
          </div>
        </div>

        {/* Phone */}
        {delivery.clientPhone && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Phone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600">Téléphone</div>
              <a 
                href={`tel:${delivery.clientPhone}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {delivery.clientPhone}
              </a>
            </div>
          </div>
        )}

        {/* Amount & Payment */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-lg">
              {formatAmount(delivery.totalAmount)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getPaymentBadge()}
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="text-xs text-gray-600 p-3 bg-blue-50 rounded-xl">
          <div className="font-semibold mb-1">Articles ({delivery.itemsCount})</div>
          <div className="text-gray-700">{delivery.itemsSummary}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t-2 border-gray-100">
        {renderActions()}
      </div>
    </div>
  );
};
