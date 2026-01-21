import React, { useState } from 'react';
import { Truck, Package, Clock, CheckCircle, MapPin, Eye, MessageCircle } from 'lucide-react';
import { Order } from '../../../types';
import { ChatWindow } from '../../Messaging';

interface ActiveOrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

const statusConfig = {
  pending: { label: 'En attente', progress: 20, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  'pending-offers': { label: 'Recherche fournisseur', progress: 30, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'offers-received': { label: 'Offres reçues', progress: 35, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'awaiting-payment': { label: 'En attente de paiement', progress: 40, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  paid: { label: 'Payée', progress: 45, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'awaiting-client-validation': { label: 'Validation client', progress: 50, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  accepted: { label: 'Acceptée', progress: 55, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  preparing: { label: 'En préparation', progress: 65, icon: Package, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  delivering: { label: 'En livraison', progress: 85, icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  delivered: { label: 'Livrée', progress: 100, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'awaiting-rating': { label: 'En attente d\'évaluation', progress: 100, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  cancelled: { label: 'Annulée', progress: 0, icon: Clock, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({ order, onViewDetails }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
    <>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Commande en cours</h2>
          <div className="flex items-center gap-2">
            {/* Messaging button - visible from paid onwards */}
            {['paid', 'awaiting-client-validation', 'accepted', 'preparing', 'delivering'].includes(order.status) && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-full hover:bg-orange-700 font-semibold transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </button>
            )}
            <button
              onClick={onViewDetails}
              className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors group"
            >
              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Suivre</span>
            </button>
          </div>
        </div>

      <div className={`relative overflow-hidden bg-white border-2 ${config.borderColor} rounded-2xl p-5`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${config.bgColor} rounded-full -mr-16 -mt-16 opacity-30`} />

        <div className="relative space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`flex-shrink-0 w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                <StatusIcon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs font-mono text-slate-500">#{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span>{itemsSummary}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{order.deliveryAddress?.split(',')[0] || 'Adresse'}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-medium text-slate-500">Commandé à</div>
              <div className="text-sm font-semibold text-slate-900">{formatTime(order.createdAt)}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Progression de la commande</span>
              <span>{config.progress}%</span>
            </div>
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${config.bgColor} border-r-2 ${config.borderColor} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${config.progress}%` }}
              />
            </div>
            {order.status === 'delivering' && (
              <div className="flex items-center gap-2 text-xs font-medium text-orange-600 mt-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Arrivée estimée: ~15 minutes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        orderId={order.id}
        order={order}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserRole="client"
        orderNumber={order.orderNumber || order.id.slice(0, 8)}
      />
    </>
  );
};
