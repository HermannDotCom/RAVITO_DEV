import React from 'react';
import { Truck, Package, Clock, CheckCircle } from 'lucide-react';
import { Order } from '../../../types';

interface ActiveOrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

const statusConfig = {
  pending: { label: '⏳ En attente', progress: 20, icon: Clock },
  'pending-offers': { label: '📋 Recherche fournisseur', progress: 30, icon: Package },
  'offers-received': { label: '📋 Offres reçues', progress: 35, icon: Package },
  'awaiting-payment': { label: '💳 En attente de paiement', progress: 40, icon: Package },
  paid: { label: '✅ Payée', progress: 45, icon: CheckCircle },
  'awaiting-client-validation': { label: '⏳ Validation client', progress: 50, icon: Clock },
  accepted: { label: '✅ Acceptée', progress: 55, icon: CheckCircle },
  preparing: { label: '📦 En préparation', progress: 65, icon: Package },
  delivering: { label: '🚚 En livraison', progress: 85, icon: Truck },
  delivered: { label: '✅ Livrée', progress: 100, icon: CheckCircle },
  'awaiting-rating': { label: '⭐ En attente d\'évaluation', progress: 100, icon: CheckCircle },
  completed: { label: '✅ Terminée', progress: 100, icon: CheckCircle },
  cancelled: { label: '❌ Annulée', progress: 0, icon: Clock },
};

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({ order, onViewDetails }) => {
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const itemsSummary = order.items.length > 0 
    ? `${order.items.reduce((acc, item) => acc + item.quantity, 0)} casiers` 
    : 'Articles';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-800">📦 Commande en cours</h3>
        <button
          onClick={onViewDetails}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Voir &gt;
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-slate-600">#{order.id.slice(0, 8)}</span>
              <span className="text-sm font-medium text-slate-900">{config.label}</span>
            </div>
            <p className="text-sm text-slate-600">
              {itemsSummary} • {order.deliveryAddress?.split(',')[0] || 'Adresse'}
            </p>
          </div>
          <span className="text-sm text-slate-500">{formatTime(order.createdAt)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Progression</span>
            <span>Arrivée {order.status === 'delivering' ? '~15min' : 'bientôt'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${config.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
