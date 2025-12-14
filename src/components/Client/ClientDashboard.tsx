import React from 'react';
import { Clock } from 'lucide-react';
import { useProfileSecurity } from '../../hooks/useProfileSecurity';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import {
  WelcomeHeader,
  QuickOrderCard,
  ActiveOrderCard,
  PopularProductsCarousel,
  MonthlyStats,
  RecentOrdersList,
} from './Dashboard';
import { Product } from '../../types';

interface ClientDashboardProps {
  onNavigate: (section: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate }) => {
  const { user, getAccessRestrictions } = useProfileSecurity();
  const { cart, addToCart } = useCart();
  const { clientCurrentOrder } = useOrder();

  const accessRestrictions = getAccessRestrictions();

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, false);
  };

  if (!accessRestrictions.canPlaceOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900 mb-3">
            {user?.role === 'client' ? 'Compte en attente d\'approbation' : 'Accès restreint'}
          </h2>
          <p className="text-amber-800 mb-6 text-lg">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-amber-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-amber-900 mb-4 text-lg">Informations soumises</h3>
            <div className="text-sm text-amber-900 space-y-2 text-left">
              <p><strong>Établissement:</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable:</strong> {user.name}</p>
              <p><strong>Téléphone:</strong> {user.phone}</p>
              <p><strong>Adresse:</strong> {user.address}</p>
            </div>
          </div>
          <div className="bg-amber-100 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <p className="font-semibold mb-2">Délai d'approbation habituel: 24-48 heures</p>
            <p>Support: <strong>support@distri-night.ci</strong> • <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const userName = user?.name || (user as any)?.businessName || 'Utilisateur';
  const zone = (user as any)?.zoneId || user?.address?.split(',')[0];
  const rating = user?.rating || 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="space-y-8">
          <WelcomeHeader userName={userName} zone={zone} rating={rating} />

          <QuickOrderCard onOrderClick={() => onNavigate('catalog')} />

          {clientCurrentOrder && (
            <ActiveOrderCard
              order={clientCurrentOrder}
              onViewDetails={() => onNavigate('tracking')}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {user && <MonthlyStats userId={user.id} />}
            </div>
            <div className="space-y-8">
              {user && (
                <RecentOrdersList
                  userId={user.id}
                  onViewAll={() => onNavigate('history')}
                />
              )}
            </div>
          </div>

          <div className="pt-4">
            <PopularProductsCarousel onAddToCart={handleAddToCart} />
          </div>
        </div>
      </div>
    </div>
  );
};