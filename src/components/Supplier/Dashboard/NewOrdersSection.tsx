import React from 'react';
import { Eye, Package, MapPin, ArrowRight, Zap, Clock } from 'lucide-react';
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

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}j`;
  };

  const isNew = (date: Date) => {
    const diffMs = new Date().getTime() - new Date(date).getTime();
    return diffMs < 10 * 60 * 1000;
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-bold text-slate-900">Nouvelles commandes</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            <span>Tout voir</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`group relative overflow-hidden border rounded-xl p-4 transition-all ${
              isNew(order.createdAt)
                ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isNew(order.createdAt) && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-orange-100 rounded-full -mr-12 -mt-12 opacity-30" />
            )}

            <div className="relative space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg">
                    <Package className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-xs font-mono text-slate-700">#{order.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 px-2 py-1 bg-slate-50 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(order.createdAt)}</span>
                  </div>
                  {isNew(order.createdAt) && (
                    <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      <Zap className="h-3 w-3" />
                      <span>Nouveau</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{order.deliveryZone || order.deliveryAddress?.split(',')[0] || 'Zone de livraison'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {order.items.length} produit{order.items.length > 1 ? 's' : ''}
                </div>
                <div className="text-base font-bold text-slate-900 tabular-nums">
                  {formatPrice(order.totalAmount)}
                </div>
              </div>

              <button
                onClick={() => onViewDetails(order.id)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                <Eye className="h-4 w-4" />
                <span>Voir et faire une offre</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
