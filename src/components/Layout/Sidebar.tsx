import React from 'react';
import {
  Home,
  ShoppingCart,
  Package,
  Truck,
  BarChart3,
  Settings,
  Users,
  MapPin,
  CreditCard,
  Clock,
  ShoppingBag,
  MessageSquare,
  Crown,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'client':
        return [
          { id: 'orders', label: 'Mes Commandes', icon: Package },
          { id: 'treasury', label: 'Trésorerie', icon: Wallet },
          { id: 'catalog', label: 'Catalogue', icon: Package },
          { id: 'cart', label: 'Panier', icon: ShoppingCart },
          { id: 'support', label: 'Nous contacter', icon: MessageSquare },
          { id: 'profile', label: 'Mon Profil', icon: Settings }
        ];
      case 'supplier':
        return [
          { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
          { id: 'zones', label: 'Mes Zones', icon: MapPin },
          { id: 'orders', label: 'Commandes Disponibles', icon: Package },
          { id: 'deliveries', label: 'Livraisons en cours', icon: Truck },
          { id: 'history', label: 'Historique', icon: Clock },
          { id: 'treasury', label: 'Trésorerie', icon: Wallet },
          { id: 'premium', label: 'Abonnement Premium', icon: Crown },
          { id: 'support', label: 'Nous contacter', icon: MessageSquare },
          { id: 'profile', label: 'Mon Profil', icon: Settings }
        ];
      case 'admin':
        return [
          { id: 'analytics', label: 'Analyses', icon: BarChart3 },
          { id: 'users', label: 'Utilisateurs', icon: Users },
          { id: 'orders', label: 'Commandes', icon: Package },
          { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag },
          { id: 'treasury', label: 'Trésorerie', icon: CreditCard },
          { id: 'zones', label: 'Zones de Livraison', icon: MapPin },
          { id: 'premium', label: 'Abonnements Premium', icon: Crown },
          { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare },
          { id: 'data', label: 'Gestion des Données', icon: Settings },
          { id: 'settings', label: 'Paramètres', icon: Settings }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">DN</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">DISTRI-NIGHT</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
                    ${activeSection === item.id
                      ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {((user as any)?.businessName || user.name).charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any)?.businessName || user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};