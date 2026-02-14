import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { realtimeService, RealtimeConnectionStatus } from '../../services/realtimeService';

/**
 * Compact connection status indicator for the header
 * Shows only an icon with tooltip on hover
 */
export const ConnectionStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const unsubscribeStatus = realtimeService.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeOnline = realtimeService.onOnlineStatusChange((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeOnline();
    };
  }, []);

  const handleReconnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    realtimeService.resetReconnection();
  };

  // Don't show anything if connected and online
  if (status === 'connected' && isOnline) {
    return null;
  }

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff className="h-5 w-5" />,
        text: 'Mode hors ligne',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300'
      };
    }

    switch (status) {
      case 'connecting':
        return {
          icon: <RefreshCw className="h-5 w-5 animate-spin" />,
          text: 'Connexion en cours...',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          text: 'Déconnecté - Cliquer pour reconnecter',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-300'
        };
      case 'error':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          text: 'Erreur de connexion - Cliquer pour reconnecter',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Wifi className="h-5 w-5" />,
          text: 'Connecté',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        };
    }
  };

  const config = getStatusConfig();
  const canReconnect = isOnline && (status === 'disconnected' || status === 'error');

  return (
    <div className="relative">
      <button
        onClick={canReconnect ? handleReconnect : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          p-2 rounded-full border transition-all
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${canReconnect ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        `}
        aria-label={config.text}
        title={config.text}
      >
        {config.icon}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`
          absolute top-full right-0 mt-2 px-3 py-2 rounded-lg shadow-lg
          ${config.bgColor} ${config.textColor} ${config.borderColor} border
          whitespace-nowrap text-xs font-medium z-50
          animate-in fade-in duration-200
        `}>
          {config.text}
          <div className={`absolute -top-1 right-4 w-2 h-2 ${config.bgColor} ${config.borderColor} border-t border-r transform rotate-[-45deg]`} />
        </div>
      )}
    </div>
  );
};
