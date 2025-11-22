import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { realtimeService, RealtimeConnectionStatus } from '../../services/realtimeService';

export const ConnectionStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connecting') {
        setIsReconnecting(true);
      } else {
        setIsReconnecting(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualReconnect = () => {
    realtimeService.resetReconnection();
    setIsReconnecting(true);
    // Trigger reconnection by reloading the page or refreshing subscriptions
    window.location.reload();
  };

  // Don't show anything if connected
  if (status === 'connected') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Connexion en cours...',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Déconnecté',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300'
        };
      case 'error':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Erreur de connexion',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Connecté',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`
        fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
        flex items-center space-x-2 px-4 py-2 rounded-full border shadow-lg
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        transition-all duration-300
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <span className="text-sm font-medium">
        {config.text}
      </span>
      
      {(status === 'disconnected' || status === 'error') && !isReconnecting && (
        <button
          onClick={handleManualReconnect}
          className={`
            ml-2 px-3 py-1 text-xs font-medium rounded-full
            ${status === 'error' ? 'bg-red-200 hover:bg-red-300' : 'bg-orange-200 hover:bg-orange-300'}
            transition-colors
          `}
          aria-label="Reconnecter"
        >
          Reconnecter
        </button>
      )}
    </div>
  );
};
