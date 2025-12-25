import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const NotificationPermissionPrompt: React.FC = () => {
  const { user } = useAuth();
  const { hasNotificationPermission, requestNotificationPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    
    if (!dismissed && !hasNotificationPermission && user) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasNotificationPermission, user]);

  const handleEnable = async () => {
    if (isRequesting) return; // Prevent multiple clicks
    
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setShowPrompt(false);
      } else {
        // If permission denied, still close the prompt but save the preference
        setShowPrompt(false);
        localStorage.setItem('notification-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowPrompt(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Set a flag to remind after 24 hours
    const remindAt = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('notification-prompt-remind-at', remindAt.toString());
  };

  if (!showPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <Bell className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Activer les Notifications
        </h2>

        <p className="text-gray-600 text-center mb-6">
          {user?.role === 'supplier' 
            ? 'Ne manquez plus jamais une commande ! Recevez des notifications en temps réel dès qu\'une nouvelle commande arrive dans votre zone.'
            : 'Restez informé ! Recevez des notifications pour les offres des fournisseurs et le suivi de vos commandes.'
          }
        </p>

        <div className="space-y-3">
          <button
            onClick={handleEnable}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isRequesting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Activation en cours...
              </>
            ) : (
              'Activer les Notifications'
            )}
          </button>

          <button
            onClick={handleRemindLater}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Me rappeler plus tard
          </button>

          <button
            onClick={handleDismiss}
            className="w-full text-gray-500 text-sm hover:text-gray-700"
          >
            Ne plus me demander
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Vous pourrez toujours activer les notifications plus tard depuis les paramètres
          </p>
        </div>
      </div>
    </div>
  );
};
