import React, { useState, useEffect } from 'react';
import { CheckCircle, Package } from 'lucide-react';
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
        // Get last 3 completed/delivered orders
        const recentOrders = allOrders
          .filter(order => ['delivered', 'completed'].includes(order.status))
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">⏱️ Dernières commandes</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">⏱️ Dernières commandes</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Aucune commande pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">⏱️ Dernières commandes</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Tout voir &gt;
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="space-y-3">
          {orders.map(order => (
            <div 
              key={order.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-sm font-mono text-slate-600">
                  #{order.id.slice(0, 7)}...
                </div>
                <div className="hidden sm:block text-sm text-slate-600">
                  {getItemsSummary(order)}
                </div>
                <div className="hidden sm:block text-sm text-slate-600">
                  {formatDate(order.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Livrée</span>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatPrice(order.totalAmount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
