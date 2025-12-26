import React from 'react';
import { Phone, CheckCircle, Package, MapPin, Truck } from 'lucide-react';
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

  const progress = order.status === 'delivering' ? 85 : order.status === 'preparing' ? 50 : 20;
  const statusConfig = {
    preparing: { label: 'Préparation en cours', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
    delivering: { label: 'En route vers le client', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  };
  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.preparing;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Truck className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">Livraison active</h2>
      </div>

      <div className={`relative overflow-hidden bg-white border-2 ${config.borderColor} rounded-2xl p-5`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${config.bgColor} rounded-full -mr-16 -mt-16 opacity-30`} />

        <div className="relative space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs font-mono text-slate-500">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{order.deliveryAddress?.split(',')[0] || 'Client'}</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{itemsSummary}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${config.bgColor} border-r-2 ${config.borderColor} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onCall && (
              <button
                onClick={onCall}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span>Appeler</span>
              </button>
            )}
            <button
              onClick={onMarkDelivered}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Marquer livrée</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
