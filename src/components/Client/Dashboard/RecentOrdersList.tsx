import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, History, ArrowRight, Calendar } from 'lucide-react';
import { Order } from '../../../types';
import { getOrdersByClient } from '../../../services/orderService';

interface RecentOrdersListProps {
  userId: string;
  onViewAll: () => void;
}

export const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ userId, onViewAll }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const allOrders = await getOrdersByClient(userId);
        const recentOrders = allOrders
          .filter(order => order.status === 'delivered')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        setOrders(recentOrders);
      } catch (error) {
        console.error('Error loading recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + 'F';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getItemsSummary = (order: Order) => {
    const totalCrates = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return `${totalCrates} casier${totalCrates > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Commandes récentes</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Commandes récentes</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Aucune commande livrée</p>
          <p className="text-xs text-slate-500 mt-1">Passez votre première commande!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Commandes récentes</h2>
        </div>
        <button
          onClick={onViewAll}
          className="group inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
        >
          <span>Tout voir</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-500">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600">{getItemsSummary(order)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatPrice(order.totalAmount)}
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  Livrée
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
