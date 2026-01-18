import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Phone, Shield, AlertTriangle, Activity, Clock } from 'lucide-react';
import { UserRole } from '../../types';
import { activityService, UserActivity } from '../../services/activityService';

interface PendingUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  businessName?: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface UserExaminationModalProps {
  user: PendingUser;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
  isProcessing: boolean;
}

export const UserExaminationModal: React.FC<UserExaminationModalProps> = ({
  user,
  onClose,
  onApprove,
  onReject,
  isProcessing
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedRejectReasons, setSelectedRejectReasons] = useState<string[]>([]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingActivities(true);
      const activities = await activityService.getUserRecentActivity(user.id, 4);
      setRecentActivities(activities);
      setLoadingActivities(false);
    };

    fetchActivities();
  }, [user.id]);

  const rejectReasons = [
    'Informations de contact incomplètes ou incorrectes',
    'Documents d\'identité manquants ou non valides',
    'Justificatif d\'adresse manquant ou non conforme',
    'Licence commerciale expirée ou non valide',
    'Zone de couverture non autorisée ou trop étendue',
    'Établissement non conforme aux critères RAVITO',
    'Doublon détecté avec un compte existant',
    'Informations commerciales insuffisantes',
    'Moyens de paiement non conformes',
    'Capacité de livraison inadéquate'
  ];

  const toggleRejectReason = (reason: string) => {
    setSelectedRejectReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReject = () => {
    if (selectedRejectReasons.length === 0 && !customRejectReason.trim()) return;

    const allReasons = [...selectedRejectReasons];
    if (customRejectReason.trim()) {
      allReasons.push(customRejectReason.trim());
    }

    const finalReason = allReasons.join('; ');
    onReject(user.id, finalReason);
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
      admin: 'bg-purple-100 text-purple-700'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[90vh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{user.businessName || user.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-1 sm:gap-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} w-fit`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Demandé le {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            <div className="bg-blue-50 rounded-xl p-4 sm:p-5 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Informations de contact
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Responsable:</span>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-medium text-gray-900">{user.phone}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Adresse:</span>
                  <span className="font-medium text-gray-900">{user.address}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-700" />
                Activités récentes
              </h3>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {activityService.getActivityTypeLabel(activity.activity_type)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {activity.activity_description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs sm:text-sm">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>

          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-red-900 mb-3 sm:mb-4">Confirmation du rejet</h4>

              <div className="bg-white border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-red-800 mb-1">Action de rejet</p>
                    <p className="text-red-700">
                      Le demandeur recevra une notification avec les raisons du rejet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-red-800 mb-2 sm:mb-3">
                  Sélectionnez les raisons du rejet :
                </label>
                <div className="space-y-1 sm:space-y-2 max-h-48 overflow-y-auto">
                  {rejectReasons.map((reason) => (
                    <label key={reason} className="flex items-start space-x-2 sm:space-x-3 cursor-pointer p-2 hover:bg-red-100 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRejectReasons.includes(reason)}
                        onChange={() => toggleRejectReason(reason)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mt-0.5 rounded"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 flex-1">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Raison personnalisée (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Ajoutez des précisions..."
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Rejeter la demande</span>
                </button>
                <button
                  onClick={() => onApprove(user.id)}
                  disabled={isProcessing}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Approbation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Approuver et activer</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || (selectedRejectReasons.length === 0 && !customRejectReason.trim())}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Rejet...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Confirmer le rejet</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
