import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  MapPin,
  CreditCard,
  MessageSquare,
  MoreHorizontal,
  BarChart3,
  Shield,
  ClipboardList,
  Briefcase,
  ShoppingBag,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAllowedPages } from '../../hooks/useAllowedPages';
import { usePaymentNotifications } from '../../hooks/usePaymentNotifications';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { MoreMenu } from '../ui/MoreMenu';
import { getSalesRepByUserId } from '../../services/commercialActivityService';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user } = useAuth();
  const { hasAccess } = useModuleAccess(user?.role === 'admin' ? 'admin' : user?.role === 'supplier' ? 'supplier' : 'client');
  const { allowedPages, isOwner, isSuperAdmin } = useAllowedPages();
  const { pendingPaymentsCount } = usePaymentNotifications();
  const { canAccessGestionActivity, loading: subscriptionLoading } = useSubscriptionContext();
  const { settings: platformSettings } = usePlatformSettings();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSalesRep, setIsSalesRep] = useState(false);

  // Check if user is a sales rep
  useEffect(() => {
    const checkSalesRep = async () => {
      if (user) {
        const salesRep = await getSalesRepByUserId(user.id);
        setIsSalesRep(!!salesRep);
      }
    };
    checkSalesRep();
  }, [user]);

  /**
   * Helper function to filter menu items based on allowed pages
   *
   * Filtering logic:
   * - Owners: Have full access to everything
   * - Team members: Only see pages in their allowedPages list
   * - Mode Opératoire pages: Visible to all users of that role if enabled via platform settings
   *
   * Note: Module-level permissions (hasAccess) are NOT checked here for team members
   * because allowed_pages is the source of truth for page access in team context.
   */
  const filterMenuItems = (items: Array<{ id: string; label: string; icon: any; moduleKey?: string }>) => {
    return items.filter(item => {
      // Skip "more" button here - will be handled separately
      if (item.id === 'more') return false;

      // Owners have full access to everything
      if (isOwner) return true;

      // Mode Opératoire pages are accessible to ALL users of that role
      // when enabled via platform settings (no permission filtering needed)
      // The visibility is already controlled by the toggle in admin settings
      if (item.id === 'admin-guide' && platformSettings.guide_admin_enabled) return true;
      if (item.id === 'guide' && platformSettings.guide_client_enabled) return true;
      if (item.id === 'supplier-guide' && platformSettings.guide_supplier_enabled) return true;

      // For team members, check if page is in their allowedPages list
      return allowedPages.includes(item.id);
    });
  };

  const getMainMenuItems = () => {
    if (!user) return [];

    let allMenuItems: Array<{ id: string; label: string; icon: any; moduleKey?: string }> = [];

    switch (user.role) {
      case 'client':
        allMenuItems = [
          { id: 'activity', label: 'Gestion Activité', icon: ClipboardList, moduleKey: 'activity' },
          { id: 'ravito-gestion-subscription', label: 'Mon Abonnement', icon: CreditCard, moduleKey: 'ravito-gestion-subscription' },
          { id: 'team', label: 'Mon Équipe', icon: Users, moduleKey: 'team' },
          { id: 'support', label: 'Support', icon: MessageSquare, moduleKey: 'support' },
          { id: 'profile', label: 'Mon Profil', icon: Settings, moduleKey: 'profile' },
          ...(platformSettings.guide_client_enabled
            ? [{ id: 'guide', label: 'Mode Opératoire', icon: BookOpen, moduleKey: 'guide' }]
            : []),
        ];
        if (isSalesRep) {
          allMenuItems.splice(3, 0, { id: 'commercial-activity', label: 'Mon Activité Commerciale', icon: Briefcase, moduleKey: 'commercial-activity' });
        }
        break;
      case 'supplier':
        allMenuItems = [
          { id: 'team', label: 'Mon Équipe', icon: Users, moduleKey: 'team' },
          { id: 'support', label: 'Support', icon: MessageSquare, moduleKey: 'support' },
          { id: 'profile', label: 'Mon Profil', icon: Settings, moduleKey: 'profile' },
          ...(platformSettings.guide_supplier_enabled
            ? [{ id: 'supplier-guide', label: 'Mode Opératoire', icon: BookOpen, moduleKey: 'supplier-guide' }]
            : []),
        ];
        if (isSalesRep) {
          allMenuItems.splice(0, 0, { id: 'commercial-activity', label: 'Mon Activité Commerciale', icon: Briefcase, moduleKey: 'commercial-activity' });
        }
        break;
      case 'admin':
        allMenuItems = [
          { id: 'super-dashboard', label: 'Tableau de Bord', icon: BarChart3, moduleKey: 'super-dashboard' },
          { id: 'commercial-activity', label: 'Activité Commerciale', icon: Briefcase, moduleKey: 'commercial-activity' },
          { id: 'users', label: 'Utilisateurs', icon: Users, moduleKey: 'users' },
          { id: 'products', label: 'Catalogue Produits', icon: ShoppingBag, moduleKey: 'products' },
          { id: 'subscription-management', label: 'Gestion Abonnements', icon: CreditCard, moduleKey: 'subscription-management' },
          { id: 'zones', label: 'Zones de Livraison', icon: MapPin, moduleKey: 'zones' },
          { id: 'team', label: 'Mon Equipe', icon: Users, moduleKey: 'team' },
          { id: 'roles', label: 'Gestion des Roles', icon: Shield, moduleKey: 'roles' },
          { id: 'tickets', label: 'Support & Tickets', icon: MessageSquare, moduleKey: 'tickets' },
          { id: 'data', label: 'Gestion des Donnees', icon: Settings, moduleKey: 'data' },
          { id: 'settings', label: 'Parametres', icon: Settings, moduleKey: 'settings' },
          ...(platformSettings.guide_admin_enabled
            ? [{ id: 'admin-guide', label: 'Mode Opératoire', icon: BookOpen, moduleKey: 'admin-guide' }]
            : []),
        ];
        break;
      default:
        return [];
    }

    return filterMenuItems(allMenuItems);
  };

  const getSecondaryMenuItems = () => {
    if (!user) return [];

    let allSecondaryItems: Array<{ id: string; label: string; icon: any; moduleKey?: string }> = [];

    switch (user.role) {
      case 'client':
        allSecondaryItems = [];
        break;
      case 'supplier':
        allSecondaryItems = [];
        break;
      default:
        return [];
    }

    return filterMenuItems(allSecondaryItems);
  };

  const baseMainMenuItems = getMainMenuItems();
  const secondaryMenuItems = getSecondaryMenuItems();

  // Add "more" button only if:
  // 1. User is client or supplier (not admin)
  // 2. There are secondary items to show
  const mainMenuItems = React.useMemo(() => {
    let items = [...baseMainMenuItems];

    // Non-approved users (except admins) should only see "Mon Profil" and "Support"
    if (!user?.isApproved && user?.role !== 'admin') {
      items = items.filter(item => item.id === 'profile' || item.id === 'support');
    } else if (user?.role === 'client' && !canAccessGestionActivity && !subscriptionLoading) {
      // Clients without active subscription can only access "Support", "Mon Profil", "Mon Abonnement" and "Mode Opératoire"
      items = items.filter(item =>
        item.id === 'profile' ||
        item.id === 'support' ||
        item.id === 'ravito-gestion-subscription' ||
        item.id === 'guide'
      );
    }

    if ((user?.role === 'client' || user?.role === 'supplier') && secondaryMenuItems.length > 0) {
      if (user?.isApproved || user?.role === 'admin') {
        items.push({ id: 'more', label: 'Plus...', icon: MoreHorizontal });
      }
    }

    return items;
  }, [baseMainMenuItems, secondaryMenuItems.length, user?.role, user?.isApproved, canAccessGestionActivity, subscriptionLoading, platformSettings]);

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

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.id === 'subscriptions' && user?.role === 'admin' && pendingPaymentsCount > 0;
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
                  <span className="font-medium flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                      {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
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