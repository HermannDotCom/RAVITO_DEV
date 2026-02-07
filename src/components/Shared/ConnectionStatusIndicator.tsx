import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { realtimeService, RealtimeConnectionStatus } from '../../services/realtimeService';

export const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribeStatus = realtimeService.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connecting') {
        setIsReconnecting(true);
      } else {
        setIsReconnecting(false);
      }
      
      // Show success message briefly when reconnected
      if (newStatus === 'connected' && wasOffline) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setWasOffline(false);
      }
    });

    const unsubscribeOnline = realtimeService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (!online) {
        setWasOffline(true);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeOnline();
    };
  }, [wasOffline]);

  const handleManualReconnect = () => {
    realtimeService.resetReconnection();
    setIsReconnecting(true);
    setTimeout(() => {
      setIsReconnecting(false);
    }, 2000);
  };

  // Show success message
  if (showSuccess) {
    return (
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2 rounded-full border shadow-lg bg-green-100 text-green-800 border-green-300 transition-all duration-300"
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">Connexion rétablie</span>
      </div>
    );
  }

  // Don't show anything if connected and online
  if (status === 'connected' && isOnline) {
    return null;
  }

  const getStatusConfig = () => {
    // Priorité: pas d'internet > erreur WebSocket > déconnecté WebSocket > connexion en cours
    if (!isOnline) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        text: 'Mode hors ligne',
        subtext: 'Les données seront synchronisées au retour de la connexion',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-300'
      };
    }

    switch (status) {
      case 'connecting':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Connexion en cours...',
          subtext: null,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Déconnecté',
          subtext: null,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300'
        };
      case 'error':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Erreur de connexion',
          subtext: null,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Connecté',
          subtext: null,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center px-4 py-2 rounded-2xl border shadow-lg ${config.bgColor} ${config.textColor} ${config.borderColor} transition-all duration-300 max-w-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <span className="text-sm font-medium">
          {config.text}
        </span>
        
        {isOnline && (status === 'disconnected' || status === 'error') && !isReconnecting && (
          <button
            onClick={handleManualReconnect}
            className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${status === 'error' ? 'bg-red-200 hover:bg-red-300' : 'bg-orange-200 hover:bg-orange-300'} transition-colors`}
            aria-label="Reconnecter"
          >
            Reconnecter
          </button>
        )}
      </div>
      
      {config.subtext && (
        <p className="text-xs mt-1 opacity-80 text-center">
          {config.subtext}
        </p>
      )}
    </div>
  );
};
