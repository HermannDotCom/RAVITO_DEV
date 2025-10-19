import React, { useState } from 'react';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationPanel } from '../Notifications/NotificationPanel';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title = 'DISTRI-NIGHT' }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white shadow-lg border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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