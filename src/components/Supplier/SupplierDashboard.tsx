import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useOrder } from '../../context/OrderContext';
import { useCommission } from '../../context/CommissionContext';
import {
  SupplierHeader,
  KPICards,
  NewOrdersSection,
  ActiveDeliveryCard,
  PerformanceStats,
  QuickActions,
} from './Dashboard';
import { getOrdersBySupplier } from '../../services/orderService';
import { Order } from '../../types';

interface SupplierDashboardProps {
  onNavigate: (section: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { availableOrders, updateOrderStatus } = useOrder();
  const { commissionSettings, getSupplierNetAmount } = useCommission();
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [todayStats, setTodayStats] = useState({ delivered: 0, revenue: 0 });

  const accessRestrictions = getAccessRestrictions();

  // Vérification sécurisée de l'accès
  if (!accessRestrictions.canAcceptOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-4">
            {user?.role === 'supplier' ? 'Dépôt en cours de validation' : 'Accès restreint'}
          </h2>
          <p className="text-orange-800 mb-6">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-orange-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">Dépôt soumis :</h3>
            <div className="text-sm text-orange-800 space-y-1 text-left">
              <p><strong>Dépôt :</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable :</strong> {user.name}</p>
              <p><strong>Zone de couverture :</strong> {(user as any)?.coverageZone || 'Non renseignée'}</p>
              <p><strong>Capacité :</strong> {(user as any)?.deliveryCapacity || 'Non renseignée'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Documents requis :</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>✓ Pièce d'identité</li>
                <li>✓ Justificatif d'adresse</li>
                <li>⏳ Licence commerciale</li>
                <li>⏳ Assurance véhicule</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Après approbation :</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Accès aux commandes</li>
                <li>• Gestion des livraisons</li>
                <li>• Reversements automatiques</li>
                <li>• Support prioritaire</li>
              </ul>
            </div>
          </div>
          <div className="text-sm text-orange-700">
            <p className="mb-2"><strong>Délai d'approbation :</strong> 24-72 heures</p>
            <p>Contact : <strong>partenaires@distri-night.ci</strong> ou <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // Load active delivery and today's stats
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        const orders = await getOrdersBySupplier(user.id);
        
        // Find active delivery
        const active = orders.find(o => 
          ['accepted', 'preparing', 'delivering'].includes(o.status)
        );
        setActiveDelivery(active || null);

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime() && o.status === 'delivered';
        });

        const delivered = todayOrders.length;
        const revenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        setTodayStats({ delivered, revenue });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'accepted');
      // Refresh will happen automatically via context
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

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
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <SupplierHeader supplierName={supplierName} rating={rating} zone={zone} />

      <KPICards
        availableOrders={availableOrders.length}
        activeDeliveries={activeDelivery ? 1 : 0}
        todayDelivered={todayStats.delivered}
        monthlyRevenue={todayStats.revenue}
        onAvailableClick={() => onNavigate('orders')}
      />

      <div className="border-b border-gray-100" />

      {availableOrders.length > 0 && (
        <NewOrdersSection
          orders={availableOrders.slice(0, 3)}
          onViewDetails={(id) => onNavigate('orders')}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
        />
      )}

      {activeDelivery && (
        <>
          <div className="border-b border-gray-100" />
          <ActiveDeliveryCard
            order={activeDelivery}
            onMarkDelivered={handleMarkDelivered}
          />
        </>
      )}

      <div className="border-b border-gray-100" />

      {user && <PerformanceStats supplierId={user.id} rating={rating} />}

      <div className="border-b border-gray-100" />

      <QuickActions onNavigate={onNavigate} />
    </div>
  );
};
