import React from 'react';
import { Phone, CheckCircle, Package, MapPin } from 'lucide-react';
import { Order } from '../../../types';

interface ActiveDeliveryCardProps {
  order: Order;
  onCall?: () => void;
  onMarkDelivered: () => void;
}

export const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  order,
  onCall,
  onMarkDelivered,
}) => {
  const itemsSummary = order.items.map(item => 
    `${item.quantity} ${item.product.name}`
  ).join(' + ');

  const progress = order.status === 'delivering' ? 80 : order.status === 'preparing' ? 50 : 20;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">🚚 Livraison en cours</h3>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="mb-3">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-mono text-slate-600">#{order.id.slice(0, 8)}</span>
            <span className="text-sm">→</span>
            <div className="flex items-center gap-1 text-sm text-slate-700">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span>{order.deliveryAddress?.split(',')[0] || 'Client'}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 ml-1">{itemsSummary}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>{order.status === 'delivering' ? 'En route' : 'En préparation'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {onCall && (
            <button
              onClick={onCall}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <Phone className="h-4 w-4" />
              Appeler
            </button>
          )}
          <button
            onClick={onMarkDelivered}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Marquer livrée
          </button>
        </div>
      </div>
    </div>
  );
};
