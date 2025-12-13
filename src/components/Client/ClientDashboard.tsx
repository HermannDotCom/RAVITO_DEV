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

  // Vérification sécurisée de l'accès
  if (!accessRestrictions.canPlaceOrders) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-900 mb-4">
            {user?.role === 'client' ? 'Compte en attente d\'approbation' : 'Accès restreint'}
          </h2>
          <p className="text-yellow-800 mb-6">
            {accessRestrictions.restrictionReason}
          </p>
          <div className="bg-white border border-yellow-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Informations soumises :</h3>
            <div className="text-sm text-yellow-800 space-y-1 text-left">
              <p><strong>Établissement :</strong> {(user as any)?.businessName || 'Non renseigné'}</p>
              <p><strong>Responsable :</strong> {user.name}</p>
              <p><strong>Téléphone :</strong> {user.phone}</p>
              <p><strong>Adresse :</strong> {user.address}</p>
            </div>
          </div>
          <div className="text-sm text-yellow-700">
            <p className="mb-2"><strong>Délai d'approbation habituel :</strong> 24-48 heures</p>
            <p>Pour toute question : <strong>support@distri-night.ci</strong> ou <strong>+225 27 20 30 40 50</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // Get the actual name - prefer user.name (person's real name) for personal greeting
  const userName = user?.name || (user as any)?.businessName || 'Utilisateur';
  const zone = (user as any)?.zoneId || user?.address?.split(',')[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <WelcomeHeader userName={userName} zone={zone} />

      <QuickOrderCard onOrderClick={() => onNavigate('catalog')} />

      {clientCurrentOrder && (
        <ActiveOrderCard 
          order={clientCurrentOrder} 
          onViewDetails={() => onNavigate('tracking')} 
        />
      )}

      <div className="border-b border-gray-100" />

      <PopularProductsCarousel onAddToCart={handleAddToCart} />

      <div className="border-b border-gray-100" />

      {user && <MonthlyStats userId={user.id} />}

      <div className="border-b border-gray-100" />

      {user && (
        <RecentOrdersList 
          userId={user.id} 
          onViewAll={() => onNavigate('history')} 
        />
      )}
    </div>
  );
};