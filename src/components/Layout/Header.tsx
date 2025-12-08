import React, { useState } from 'react';
import { Menu, User, LogOut, Bell, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationPanel } from '../Notifications/NotificationPanel';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
  onCartClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title = 'DISTRI-NIGHT', onCartClick }) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-orange-100">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center ml-2 lg:ml-0">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DN</span>
                </div>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900 hidden sm:block">{title}</h1>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {user.role === 'client' && (
                <button
                  onClick={onCartClick}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors relative"
                  aria-label="Panier"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{cartItemsCount > 9 ? '9+' : cartItemsCount}</span>
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
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