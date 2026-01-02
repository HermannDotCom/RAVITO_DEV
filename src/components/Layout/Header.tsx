import React, { useState } from 'react';
import { Menu, User, LogOut, Bell, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useOrganizationName } from '../../hooks/useOrganizationName';
import { NotificationPanel } from '../Notifications/NotificationPanel';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
  onCartClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title = 'RAVITO', onCartClick }) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const { organizationName } = useOrganizationName();
  const [showNotifications, setShowNotifications] = useState(false);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-orange-100">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center flex-1">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] rounded-md text-gray-600 active:text-orange-600 active:bg-orange-50 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center ml-1 sm:ml-2 lg:ml-0">
              <div className="flex-shrink-0">
                <img
                  src="/logo_sans_slogan.png"
                  alt="Ravito Logo"
                  className="h-8 sm:h-10"
                />
              </div>
            </div>
          </div>

          {user && (user.role === 'client' || user.role === 'supplier') && organizationName && (
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
              <div className="px-4 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-full border border-orange-200">
                <p className="text-sm font-semibold text-orange-800 whitespace-nowrap">
                  {organizationName}
                </p>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-1 justify-end">
              {user.role === 'client' && (
                <button
                  onClick={onCartClick}
                  className="p-2 min-h-[44px] min-w-[44px] text-gray-600 active:text-orange-600 active:bg-orange-50 rounded-full transition-colors relative"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{cartItemsCount > 9 ? '9+' : cartItemsCount}</span>
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 min-h-[44px] min-w-[44px] text-gray-600 active:text-orange-600 active:bg-orange-50 rounded-full transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any)?.businessName || user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                
                <div className="h-8 w-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </header>
  );
};