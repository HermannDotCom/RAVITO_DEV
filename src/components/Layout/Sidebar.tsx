import React, { useState } from 'react';
import {
  Home,
  ShoppingCart,
  Package,
  Truck,
  Settings,
  Users,
  MapPin,
  CreditCard,
  Clock,
  ShoppingBag,
  MessageSquare,
  Wallet,
  MoreHorizontal,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MoreMenu } from '../ui/MoreMenu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const getMainMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'client':
        return [
          { id: 'dashboard', label: 'Accueil', icon: Home },
          { id: 'catalog', label: 'Catalogue', icon: ShoppingBag },
          { id: 'cart', label: 'Panier', icon: ShoppingCart },
          { id: 'orders', label: 'Mes Commandes', icon: Package },
          { id: 'more', label: 'Plus...', icon: MoreHorizontal },
        ];
      case 'supplier':
        return [
          { id: 'dashboard', label: 'Accueil', icon: Home },
          { id: 'orders', label: 'Commandes', icon: Package },
          { id: 'deliveries', label: 'Livraisons', icon: Truck },
          { id: 'treasury', label: 'Revenus', icon: Wallet },
          { id: 'more', label: 'Plus...', icon: MoreHorizontal },
        ];
      case 'admin':
        // Admin keeps the complex menu unchanged
        return [
          { id: 'analytics', label: 'Analyses', icon: BarChart3 },
          { id: 'users', label: 'Utilisateurs', icon: Users },
          { id: 'orders', label: 'Commandes', icon: Package },
          { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag },
          { id: 'treasury', label: 'Trésorerie', icon: CreditCard },
          { id: 'zones', label: 'Zones de Livraison', icon: MapPin },
          { id: 'team', label: 'Mon Équipe', icon: Users },
          { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare },
          { id: 'data', label: 'Gestion des Données', icon: Settings },
          { id: 'settings', label: 'Paramètres', icon: Settings }
        ];
      default:
        return [];
    }
  };

  const getSecondaryMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'client':
        return [
          { id: 'profile', label: 'Mon Profil', icon: Settings },
          { id: 'treasury', label: 'Trésorerie', icon: Wallet },
          { id: 'team', label: 'Mon Équipe', icon: Users },
          { id: 'support', label: 'Support', icon: MessageSquare },
        ];
      case 'supplier':
        return [
          { id: 'zones', label: 'Mes Zones', icon: MapPin },
          { id: 'team', label: 'Mon Équipe', icon: Users },
          { id: 'history', label: 'Historique', icon: Clock },
          { id: 'support', label: 'Support', icon: MessageSquare },
          { id: 'profile', label: 'Mon Profil', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const mainMenuItems = getMainMenuItems();
  const secondaryMenuItems = getSecondaryMenuItems();

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === 'more') {
      setShowMoreMenu(true);
    } else {
      onSectionChange(itemId);
      onClose();
    }
  };

  const handleSecondaryMenuClick = (itemId: string) => {
    onSectionChange(itemId);
    setShowMoreMenu(false);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:top-16
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full lg:h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-16 border-b border-gray-200 lg:hidden">
            <div className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="Ravito Logo" 
                className="h-10 w-10"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">RAVITO</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
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

          {user && (() => {
            const displayName = ('businessName' in user && user.businessName) 
              ? user.businessName 
              : (user.name || 'Utilisateur');
            return (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* More Menu - only for client and supplier */}
      {(user?.role === 'client' || user?.role === 'supplier') && (
        <MoreMenu
          isOpen={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
          items={secondaryMenuItems.map(item => ({
            ...item,
            onClick: () => handleSecondaryMenuClick(item.id)
          }))}
        />
      )}
    </>
  );
};