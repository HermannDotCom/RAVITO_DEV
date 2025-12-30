import React from 'react';
import { X, Mail, Phone, Clock, BarChart3, Target, CheckCircle } from 'lucide-react';
import type { OrganizationMember, OrganizationType } from '../../types/team';
import { ROLE_LABELS, ROLE_COLORS } from '../../types/team';
import { MemberStatusBadge } from './MemberStatusBadge';
import { getPagesByOrganizationType } from '../../constants/pageDefinitions';
import { getMemberDisplayName, formatDateTime } from '../../utils/memberUtils';

interface MemberDetailsModalProps {
  isOpen: boolean;
  member: OrganizationMember | null;
  organizationType: OrganizationType;
  onClose: () => void;
  onEditPermissions: () => void;
}

/**
 * Modal for viewing detailed member information and statistics
 */
export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  member,
  organizationType,
  onClose,
  onEditPermissions,
}) => {
  if (!isOpen || !member) return null;

  const memberName = getMemberDisplayName(member);
  const isOwner = member.role === 'owner';

  // Get available pages for this organization type
  const availablePages = getPagesByOrganizationType(organizationType, isOwner && organizationType === 'admin');

  // TODO: Fetch real statistics from backend
  // Expected data structure:
  // - connections30d: number of login sessions in the last 30 days
  // - actions30d: number of user actions (clicks, edits, etc.) in the last 30 days
  // API endpoint to create: GET /api/team/members/{userId}/statistics?days=30
  // This should aggregate data from audit logs or activity tracking tables
  const mockStats = {
    connections30d: 24,
    actions30d: 156
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{memberName}</h2>
                <div className="mt-2">
                  <MemberStatusBadge status={member.status} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Left Column - Member Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations Membre
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {/* TODO: Add phone field to OrganizationMember type and display it here */}
                      Non renseigné
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Dernière connexion</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(member.acceptedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Statistiques (30 jours)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Connexions</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {mockStats.connections30d}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Actions</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {mockStats.actions30d}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Role & Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rôle Assigné
                </h3>
                <button
                  onClick={onEditPermissions}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Modifier
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[member.role]}`}>
                    {isOwner && '👑 '}
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    {isOwner ? 'Accès complet à tous les modules' : 'Accès configuré par l\'administrateur'}
                  </p>
                </div>

                {/* Accessible Modules */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Modules accessibles
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availablePages.map((page) => {
                      const Icon = page.icon;
                      const hasAccess = isOwner || !page.exclusiveSuperAdmin;
                      
                      return (
                        <div
                          key={page.id}
                          className={`flex items-center space-x-2 text-sm ${
                            hasAccess ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          <CheckCircle className={`w-4 h-4 ${hasAccess ? 'text-green-600' : 'text-gray-300'}`} />
                          <Icon className="w-4 h-4" />
                          <span>{page.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
