import React, { useState, useEffect } from 'react';
import { Package, Clock } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import {
  SupplierHeader,
  KPICards,
  NewOrdersSection,
  ActiveDeliveryCard,
  PerformanceStats,
} from './Dashboard';
import { getOrdersBySupplier } from '../../services/orderService';
import { Order } from '../../types';
import { ACTIVE_DELIVERY_STATUSES, COMPLETED_ORDER_STATUSES } from '../../constants/orderStatuses';

interface SupplierDashboardProps {
  onNavigate: (section: string) => void;
}

export const SupplierDashboard:  React.FC<SupplierDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders, updateOrderStatus } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [todayStats, setTodayStats] = useState({ delivered: 0, revenue: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const accessRestrictions = getAccessRestrictions();

  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900 mb-3">
            {user?.role === 'supplier' ? 'Dépôt en cours de validation' : 'Accès restreint'}
          </h2>
          <p className="text-amber-800 mb-6 text-lg">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-amber-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-amber-900 mb-4 text-lg">Informations soumises</h3>
            <div className="text-sm text-amber-900 space-y-2 text-left">
              <p><strong>Dépôt:</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable:</strong> {user.name}</p>
              <p><strong>Zone de couverture:</strong> {(user as any)?.coverageZone || 'Non renseignée'}</p>
              <p><strong>Capacité:</strong> {(user as any)?.deliveryCapacity || 'Non renseignée'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Documents requis</h4>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Pièce d'identité
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Justificatif d'adresse
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600">⏳</span> Licence commerciale
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-600">⏳</span> Assurance véhicule
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <h4 className="font-semibold text-emerald-900 mb-3">Après approbation</h4>
              <ul className="text-sm text-emerald-800 space-y-2 text-left">
                <li>• Accès aux commandes</li>
                <li>• Gestion des livraisons</li>
                <li>• Reversements automatiques</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
          </div>
          <div className="bg-amber-100 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <p className="font-semibold mb-2">Délai d'approbation: 24-72 heures</p>
            <p>Contact: <strong>partenaires@distri-night.ci</strong> • <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // Load active delivery and today's stats
  useEffect(() => {
    const loadDashboardData = async () => {
      if (! user?. id) return;

      try {
        const orders = await getOrdersBySupplier(user.id);
        
        // Find active delivery using consistent status constants
        const active = orders.find(o => 
          ACTIVE_DELIVERY_STATUSES.includes(o.status)
        );
        setActiveDelivery(active || null);

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate. getTime() === today.getTime() && 
                 COMPLETED_ORDER_STATUSES.includes(o.status);
        });

        const delivered = todayOrders.length;
        const revenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        setTodayStats({ delivered, revenue });

        // Calculate monthly revenue
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= startOfMonth && o.status === 'delivered';
        });
        const monthlyRev = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        setMonthlyRevenue(monthlyRev);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleMarkDelivered = async () => {
    if (!activeDelivery) return;
    try {
      await updateOrderStatus(activeDelivery.id, 'delivered');
      setActiveDelivery(null);
    } catch (error) {
      console.error('Error marking delivered:', error);
    }
  };

  const supplierName = user?.name || (user as any)?.businessName || 'Partenaire';
  const zone = (user as any)?.coverageZone || (user as any)?.zoneId;
  const rating = user?.rating || 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="space-y-8">
          <SupplierHeader supplierName={supplierName} rating={rating} zone={zone} />

          <KPICards
            availableOrders={availableOrders.length}
            activeDeliveries={activeDelivery ? 1 : 0}
            todayDelivered={todayStats.delivered}
            monthlyRevenue={monthlyRevenue}
            onAvailableClick={() => onNavigate('orders')}
          />

          {availableOrders.length > 0 && (
            <NewOrdersSection
              orders={availableOrders.slice(0, 3)}
              onViewDetails={(id) => onNavigate('orders')}
              onViewAll={() => onNavigate('orders')}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {activeDelivery && (
                <ActiveDeliveryCard
                  order={activeDelivery}
                  onMarkDelivered={handleMarkDelivered}
                />
              )}
            </div>
            <div className="space-y-8">
              {user && <PerformanceStats supplierId={user.id} rating={rating} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};