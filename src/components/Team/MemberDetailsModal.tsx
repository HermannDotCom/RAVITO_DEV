import React from 'react';
import { X, Mail, Phone, Clock, BarChart3, Target } from 'lucide-react';
import type { OrganizationMember, OrganizationType } from '../../types/team';
import { ROLE_LABELS } from '../../types/team';
import { MemberStatusBadge } from './MemberStatusBadge';
import { getPagesByOrganizationType } from '../../constants/pageDefinitions';

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember;
  organizationType: OrganizationType;
  onEditPermissions: (member: OrganizationMember) => void;
}

/**
 * Modal de consultation d'un membre avec informations et statistiques
 */
export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  member,
  organizationType,
  onEditPermissions,
}) => {
  if (!isOpen) return null;

  const allPages = getPagesByOrganizationType(organizationType);
  const memberPages = member.allowedPages || [];

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Jamais connecté';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-120px)] flex flex-col">
          {/* Header - fixe */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {member.email.split('@')[0]}
                </h2>
                <div className="mt-2">
                  <MemberStatusBadge isActive={member.isActive} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="grid md:grid-cols-2 divide-x divide-gray-200 overflow-y-auto flex-1">
            {/* Left Column - Member Information */}
            <div className="px-6 py-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations Membre
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Téléphone</div>
                      <div className="text-sm text-gray-900">Non renseigné</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Dernière connexion</div>
                      <div className="text-sm text-gray-900">{formatDateTime(member.lastLoginAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Statistiques (30 jours)
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Connexions</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {member.loginCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Actions</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      N/A
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Role & Permissions */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rôle Assigné
                </h3>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => onEditPermissions(member)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Role Badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    {member.role === 'owner' && '👑 '}
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {member.role === 'owner' 
                    ? 'Accès complet à toutes les fonctionnalités' 
                    : 'Accès limité aux modules autorisés'}
                </p>

                {/* Accessible Modules */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Modules accessibles:
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {member.role === 'owner' ? (
                      // Owner has access to all pages
                      allPages.map((page) => {
                        const Icon = page.icon;
                        return (
                          <div key={page.id} className="flex items-center space-x-2 text-sm">
                            <span className="text-green-600">✓</span>
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{page.label}</span>
                          </div>
                        );
                      })
                    ) : (
                      // Regular members show their allowed pages
                      memberPages.length > 0 ? (
                        allPages
                          .filter(page => memberPages.includes(page.id))
                          .map((page) => {
                            const Icon = page.icon;
                            return (
                              <div key={page.id} className="flex items-center space-x-2 text-sm">
                                <span className="text-green-600">✓</span>
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{page.label}</span>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-sm text-gray-500 italic">Aucun module autorisé</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - fixe */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
