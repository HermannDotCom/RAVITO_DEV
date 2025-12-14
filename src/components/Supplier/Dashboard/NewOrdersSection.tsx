import React from 'react';
import { Eye, Package, MapPin, Clock } from 'lucide-react';
import { Order } from '../../../types';

interface NewOrdersSectionProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
  onViewAll?: () => void;
}

export const NewOrdersSection: React.FC<NewOrdersSectionProps> = ({
  orders,
  onViewDetails,
  onViewAll,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    return `il y a ${Math.floor(diffHours / 24)}j`;
  };

  const isNew = (date: Date) => {
    const diffMs = new Date().getTime() - new Date(date).getTime();
    return diffMs < 10 * 60 * 1000; // Less than 10 minutes
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">🔔 Nouvelles commandes</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors cursor-pointer"
          >
            Tout voir &gt;
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`border border-gray-200 rounded-xl p-4 ${
              isNew(order.createdAt) ? 'bg-orange-50 border-orange-200 animate-pulse' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-mono text-slate-600">#{order.id.slice(0, 8)}</span>
                <span className="text-sm text-slate-500">{getTimeAgo(order.createdAt)}</span>
                {isNew(order.createdAt) && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    🆕
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>{order.deliveryZone || order.deliveryAddress?.split(',')[0] || 'Zone de livraison'}</span>
              </div>
              <div className="text-sm text-slate-600">
                {order.items.length} produit{order.items.length > 1 ? 's' : ''} • {formatPrice(order.totalAmount)}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onViewDetails(order.id)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir et envoyer une offre
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
