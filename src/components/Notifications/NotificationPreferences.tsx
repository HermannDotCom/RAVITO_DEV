import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, MessageSquare, Save, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService, NotificationPreferences as NotificationPreferencesType } from '../../services/notificationService';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
    // loadPreferences is memoized with useCallback and depends on user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const prefs = await notificationService.getPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleToggle = async (field: keyof NotificationPreferencesType) => {
    if (!preferences || !user) return;

    const updatedPreferences = {
      ...preferences,
      [field]: !preferences[field]
    };

    setPreferences(updatedPreferences);
    
    // Auto-save
    await savePreferences(updatedPreferences);
  };

  const handlePushToggle = async () => {
    if (!isSupported) {
      setSaveMessage({ type: 'error', text: 'Les notifications push ne sont pas supportées par votre navigateur' });
      return;
    }

    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        setSaveMessage({ type: 'success', text: 'Notifications push désactivées' });
        // Also update preferences
        if (preferences && user) {
          await savePreferences({ ...preferences, push_enabled: false });
        }
      }
    } else {
      const success = await subscribe();
      if (success) {
        setSaveMessage({ type: 'success', text: 'Notifications push activées' });
        // Also update preferences
        if (preferences && user) {
          await savePreferences({ ...preferences, push_enabled: true });
        }
      } else {
        setSaveMessage({ type: 'error', text: 'Impossible d\'activer les notifications push' });
      }
    }

    setTimeout(() => setSaveMessage(null), 3000);
  };

  const savePreferences = async (prefs: NotificationPreferencesType) => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await notificationService.updatePreferences(user.id, prefs);
      setSaveMessage({ type: 'success', text: 'Préférences enregistrées' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Impossible de charger les préférences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Préférences de Notifications</h2>
        <p className="text-gray-600">Gérez vos préférences de notifications pour ne rien manquer d'important</p>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
        </div>
      )}

      {/* Notification Channels */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Canaux de Notification</h3>
        <div className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications Push</p>
                <p className="text-sm text-gray-500">
                  {!isSupported 
                    ? 'Non supporté par votre navigateur'
                    : isSubscribed
                    ? 'Activées - Vous recevrez des notifications en temps réel'
                    : 'Désactivées - Activez pour recevoir des notifications instantanées'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={!isSupported || pushLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSubscribed ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSubscribed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications Email</p>
                <p className="text-sm text-gray-500">Recevez des emails pour les événements importants</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('email_enabled')}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                preferences.email_enabled ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.email_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications SMS</p>
                <p className="text-sm text-gray-500">Recevez des SMS pour les urgences (bientôt disponible)</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sms_enabled')}
              disabled={true}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200 opacity-50 cursor-not-allowed"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de Notifications</h3>
        <div className="space-y-3">
          {[
            { key: 'notify_new_order', label: 'Nouvelles commandes', description: 'Recevez une notification pour chaque nouvelle commande' },
            { key: 'notify_order_status', label: 'Statut des commandes', description: 'Mise à jour du statut de vos commandes' },
            { key: 'notify_delivery_assigned', label: 'Livraison assignée', description: 'Quand une livraison vous est assignée' },
            { key: 'notify_delivery_status', label: 'Statut de livraison', description: 'Mise à jour du statut de livraison' },
            { key: 'notify_payment', label: 'Paiements', description: 'Confirmations de paiement et transactions' },
            { key: 'notify_team', label: 'Équipe', description: 'Notifications concernant votre équipe' },
            { key: 'notify_support', label: 'Support', description: 'Messages et mises à jour du support' },
            { key: 'notify_promotions', label: 'Promotions', description: 'Offres spéciales et promotions' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key as keyof NotificationPreferencesType)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  preferences[item.key as keyof NotificationPreferencesType] ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[item.key as keyof NotificationPreferencesType] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">À propos des notifications</p>
            <p className="text-sm text-blue-700 mt-1">
              Vos préférences sont enregistrées automatiquement. Les notifications push nécessitent l'autorisation de votre navigateur.
              Vous pouvez modifier ces paramètres à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
