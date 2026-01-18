import React, { useState } from 'react';
import { Users, UserPlus, Crown, AlertCircle, RefreshCw } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { usePermissions } from '../../hooks/usePermissions';
import { CreateMemberModal } from './CreateMemberModal';
import { QuotaBar } from './QuotaBar';
import { MemberListView } from './MemberListView';
import { MemberDetailsModal } from './MemberDetailsModal';
import { MemberPermissionsModal } from './MemberPermissionsModal';
import type { OrganizationMember } from '../../types/team';
import { useAuth } from '../../context/AuthContext';

/**
 * Main Team Management Page - Refactored UI
 */
export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const { organization, members, stats, isLoading, error, createMember, removeMember, toggleMemberStatus, updateMemberPermissions, refresh } = useTeam();
  const { can } = usePermissions(organization?.id || null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const canInvite = can('team', 'invite');
  const canEdit = can('team', 'edit');
  const canRemove = can('team', 'remove');
  const isOwner = organization ? organization.ownerId === user?.id : false;

  const handleViewDetails = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleEditPermissions = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowPermissionsModal(true);
  };

  const handleToggleStatus = async (member: OrganizationMember) => {
    const newStatus = !member.isActive;
    const action = newStatus ? 'activer' : 'désactiver';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${member.email} ?`)) {
      return;
    }

    await toggleMemberStatus(member.id, newStatus);
  };

  const handleRemove = async (member: OrganizationMember) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${member.email} de l'équipe ? Cette action est irréversible.`)) {
      return;
    }

    await removeMember(member.id);
  };

  const handleSavePermissions = async (memberId: string, allowedPages: string[]): Promise<boolean> => {
    return await updateMemberPermissions(memberId, { allowedPages });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Chargement de l'équipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
              Aucune organisation trouvée
            </h3>
            <p className="text-sm sm:text-base text-yellow-800">
              Vous n'êtes pas encore membre d'une équipe. Contactez votre administrateur pour obtenir une invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Gestion des Membres</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">{organization.name}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={refresh}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Actualiser</span>
            </button>

            {canInvite && (
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={stats?.availableSlots === 0}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Créer un membre</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Quota Bar */}
        {stats && <QuotaBar stats={stats} />}

        {/* Upsell message if quota reached */}
        {stats && stats.availableSlots === 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
            <Crown className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Quota atteint
              </h3>
              <p className="text-sm text-orange-800">
                Vous avez atteint le nombre maximum de membres pour votre équipe. 
                Contactez-nous pour augmenter votre quota.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Member List View */}
      <MemberListView
        members={members}
        organizationType={organization.type}
        currentUserId={user?.id}
        canEdit={canEdit || isOwner}
        canRemove={canRemove || isOwner}
        onViewDetails={handleViewDetails}
        onEditPermissions={handleEditPermissions}
        onToggleStatus={handleToggleStatus}
        onRemove={handleRemove}
      />

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createMember}
        organizationType={organization.type}
        availableSlots={stats?.availableSlots || 0}
      />

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          organizationType={organization.type}
          onEditPermissions={handleEditPermissions}
        />
      )}

      {/* Member Permissions Modal */}
      {selectedMember && (
        <MemberPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          organizationType={organization.type}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};

