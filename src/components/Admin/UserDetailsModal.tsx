import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Star, Package, Shield, Ban, MessageSquare, History, Clock, Activity } from 'lucide-react';
import { UserRole } from '../../types';
import { activityService, UserActivity } from '../../services/activityService';
import { supabase } from '../../lib/supabase';

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  business_name?: string;
  rating: number;
  total_orders: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  userId,
  onClose,
  onUserUpdated
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [allActivities, setAllActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    loadUserData();
    loadActivities();
  }, [userId]);

  const loadUserData = async () => {
    setLoadingUser(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data as UserProfile);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    const activities = await activityService.getUserRecentActivity(userId, 4);
    setRecentActivities(activities);
    setLoadingActivities(false);
  };

  const loadFullHistory = async () => {
    setLoadingActivities(true);
    const activities = await activityService.getUserRecentActivity(userId, 50);
    setAllActivities(activities);
    setLoadingActivities(false);
  };

  const handleDeactivateAccount = async () => {
    if (!deactivationReason.trim()) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      await activityService.logActivity(
        userId,
        'account_deactivated',
        `Compte désactivé par l'administrateur. Raison: ${deactivationReason}`,
        { metadata: { reason: deactivationReason } }
      );

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'account_deactivated',
        title: 'Compte désactivé',
        message: `Votre compte a été désactivé. Raison: ${deactivationReason}`,
        data: { reason: deactivationReason }
      });

      setShowDeactivateConfirm(false);
      if (onUserUpdated) onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert('Erreur lors de la désactivation du compte');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) return;

    setIsProcessing(true);
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'admin_message',
        title: messageSubject,
        message: messageContent,
        data: { from: 'admin' }
      });

      await activityService.logActivity(
        userId,
        'message_received',
        `Message de l'administrateur: ${messageSubject}`,
        { metadata: { subject: messageSubject } }
      );

      setShowMessageForm(false);
      setMessageSubject('');
      setMessageContent('');
      alert('Message envoyé avec succès');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      client: 'Client',
      supplier: 'Fournisseur',
      admin: 'Administrateur'
    };
    return labels[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      client: 'bg-blue-100 text-blue-700',
      supplier: 'bg-green-100 text-green-700',
      admin: 'bg-orange-100 text-orange-700'
    };
    return colors[role];
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  if (loadingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.business_name || user.name}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  {user.is_active ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      Inactif
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Informations personnelles
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{user.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-medium text-gray-900">{user.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adresse:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px]">{user.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membre depuis:</span>
                  <span className="font-medium text-gray-900">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-green-600" />
                Performances
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{user.rating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Note moyenne</div>
                </div>
                <div className="text-center pt-4 border-t border-green-200">
                  <div className="text-4xl font-bold text-gray-900">{user.total_orders}</div>
                  <div className="text-sm text-gray-600">Livraisons</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-gray-700" />
                Activité récente
              </h3>
              {!showFullHistory && (
                <button
                  onClick={() => {
                    setShowFullHistory(true);
                    loadFullHistory();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tout
                </button>
              )}
            </div>
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(showFullHistory ? allActivities : recentActivities).map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activityService.getActivityTypeLabel(activity.activity_type)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.activity_description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(showFullHistory ? allActivities : recentActivities).length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucune activité récente</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {showDeactivateConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Confirmer la désactivation du compte
              </h4>
              <p className="text-sm text-red-700 mb-4">
                Cette action désactivera le compte de l'utilisateur. Il ne pourra plus se connecter ni utiliser l'application.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la désactivation
                </label>
                <textarea
                  rows={3}
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Expliquez la raison de la désactivation..."
                />
              </div>
            </div>
          )}

          {showMessageForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Envoyer un message
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Objet du message..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Votre message..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-yellow-600" />
              Actions administratives
            </h4>
            <div className="space-y-3">
              {!showDeactivateConfirm ? (
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  disabled={!user.is_active}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <Ban className="h-5 w-5" />
                  <span>Désactiver le compte</span>
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={isProcessing || !deactivationReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Désactivation...' : 'Confirmer'}
                  </button>
                </div>
              )}

              {!showMessageForm ? (
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>Envoyer un message</span>
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMessageForm(false)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isProcessing || !messageSubject.trim() || !messageContent.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if (!showFullHistory) {
                    setShowFullHistory(true);
                    loadFullHistory();
                  }
                }}
                className="w-full px-4 py-3 bg-white border-2 border-gray-600 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <History className="h-5 w-5" />
                <span>Voir l'historique complet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
