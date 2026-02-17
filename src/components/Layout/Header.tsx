import React, { useState } from 'react';
import { Menu, User, LogOut, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useOrganizationName } from '../../hooks/useOrganizationName';
import { NotificationPanel } from '../Notifications/NotificationPanel';
import { ConnectionStatusBadge } from '../Shared/ConnectionStatusBadge';
import { useOffline } from '../../context/OfflineContext';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title = 'RAVITO' }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { organizationName } = useOrganizationName();
  const { pendingActionsCount, isSyncing, isOfflineMode, forceSync, isOnline } = useOffline();
  const [showNotifications, setShowNotifications] = useState(false);

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
              {/* Sync status indicator */}
              {user && (pendingActionsCount > 0 || isSyncing) && (
                <button
                  onClick={isOnline && !isSyncing ? forceSync : undefined}
                  disabled={isSyncing || !isOnline}
                  title={
                    isSyncing
                      ? 'Synchronisation en cours...'
                      : isOfflineMode
                      ? `${pendingActionsCount} action(s) en attente - hors ligne`
                      : `${pendingActionsCount} action(s) à synchroniser - cliquer pour sync`
                  }
                  className={`relative p-2 min-h-[44px] min-w-[44px] rounded-full transition-colors ${
                    isOfflineMode
                      ? 'text-amber-600 bg-amber-50'
                      : isSyncing
                      ? 'text-blue-500 bg-blue-50'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                  aria-label="État de la synchronisation"
                >
                  <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {pendingActionsCount > 0 && !isSyncing && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">
                        {pendingActionsCount > 9 ? '9+' : pendingActionsCount}
                      </span>
                    </span>
                  )}
                </button>
              )}

              {/* Connection Status Badge */}
              <ConnectionStatusBadge />

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