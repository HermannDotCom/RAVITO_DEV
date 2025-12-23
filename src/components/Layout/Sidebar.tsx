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
  BarChart3,
  DollarSign,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { MoreMenu } from '../ui/MoreMenu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user } = useAuth();
  const { hasAccess } = useModuleAccess();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const getMainMenuItems = () => {
    if (!user) return [];

    let allMenuItems: Array<{ id: string; label: string; icon: any; moduleKey?: string }> = [];

    switch (user.role) {
      case 'client':
        allMenuItems = [
          { id: 'dashboard', label: 'Accueil', icon: Home, moduleKey: 'dashboard' },
          { id: 'catalog', label: 'Catalogue', icon: ShoppingBag, moduleKey: 'catalog' },
          { id: 'cart', label: 'Panier', icon: ShoppingCart, moduleKey: 'cart' },
          { id: 'orders', label: 'Mes Commandes', icon: Package, moduleKey: 'orders' },
          { id: 'more', label: 'Plus...', icon: MoreHorizontal },
        ];
        break;
      case 'supplier':
        allMenuItems = [
          { id: 'dashboard', label: 'Accueil', icon: Home, moduleKey: 'dashboard' },
          { id: 'delivery-mode', label: 'Mode Livreur', icon: Navigation, moduleKey: 'deliveries' },
          { id: 'orders', label: 'Commandes', icon: Package, moduleKey: 'orders' },
          { id: 'deliveries', label: 'Livraisons', icon: Truck, moduleKey: 'deliveries' },
          { id: 'treasury', label: 'Revenus', icon: Wallet, moduleKey: 'treasury' },
          { id: 'more', label: 'Plus...', icon: MoreHorizontal },
        ];
        break;
      case 'admin':
        allMenuItems = [
          { id: 'analytics', label: 'Analyses', icon: BarChart3, moduleKey: 'analytics' },
          { id: 'users', label: 'Utilisateurs', icon: Users, moduleKey: 'users' },
          { id: 'orders', label: 'Commandes', icon: Package, moduleKey: 'orders' },
          { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag, moduleKey: 'products' },
          { id: 'pricing', label: 'Prix de Reference', icon: DollarSign, moduleKey: 'pricing' },
          { id: 'treasury', label: 'Tresorerie', icon: CreditCard, moduleKey: 'treasury' },
          { id: 'commissions', label: 'Mes Commissions', icon: Wallet, moduleKey: 'commissions' },
          { id: 'zones', label: 'Zones de Livraison', icon: MapPin, moduleKey: 'zones' },
          { id: 'team', label: 'Mon Equipe', icon: Users, moduleKey: 'team' },
          { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare, moduleKey: 'tickets' },
          { id: 'data', label: 'Gestion des Donnees', icon: Settings, moduleKey: 'data' },
          { id: 'settings', label: 'Parametres', icon: Settings, moduleKey: 'settings' }
        ];
        break;
      default:
        return [];
    }

    // Filter based on permissions (keep items without moduleKey like "more")
    return allMenuItems.filter(item => !item.moduleKey || hasAccess(item.moduleKey));
  };

  const getSecondaryMenuItems = () => {
    if (!user) return [];

    let allSecondaryItems: Array<{ id: string; label: string; icon: any; moduleKey?: string }> = [];

    switch (user.role) {
      case 'client':
        allSecondaryItems = [
          { id: 'profile', label: 'Mon Profil', icon: Settings, moduleKey: 'profile' },
          { id: 'treasury', label: 'Trésorerie', icon: Wallet, moduleKey: 'treasury' },
          { id: 'team', label: 'Mon Équipe', icon: Users, moduleKey: 'team' },
          { id: 'support', label: 'Support', icon: MessageSquare, moduleKey: 'support' },
        ];
        break;
      case 'supplier':
        allSecondaryItems = [
          { id: 'zones', label: 'Mes Zones', icon: MapPin, moduleKey: 'zones' },
          { id: 'pricing', label: 'Produits vendus', icon: DollarSign, moduleKey: 'pricing' },
          { id: 'team', label: 'Mon Équipe', icon: Users, moduleKey: 'team' },
          { id: 'history', label: 'Historique', icon: Clock, moduleKey: 'history' },
          { id: 'support', label: 'Support', icon: MessageSquare, moduleKey: 'support' },
          { id: 'profile', label: 'Mon Profil', icon: Settings, moduleKey: 'profile' },
        ];
        break;
      default:
        return [];
    }

    // Filter based on permissions
    return allSecondaryItems.filter(item => !item.moduleKey || hasAccess(item.moduleKey));
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
            <img 
              src="/logo_sans_slogan.png" 
              alt="Ravito Logo" 
              className="h-10"
            />
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