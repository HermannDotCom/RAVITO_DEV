import React, { useState } from 'react';
import { Users, UserPlus, Crown, AlertCircle, RefreshCw, Mail, Shield } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { usePermissions } from '../../hooks/usePermissions';
import { MemberCard } from './MemberCard';
import { InviteMemberModal } from './InviteMemberModal';
import { QuotaBar } from './QuotaBar';
import { PermissionsTab } from './PermissionsTab';
import { MemberListView } from './MemberListView';
import { MemberDetailsModal } from './MemberDetailsModal';
import { MemberPermissionsModal } from './MemberPermissionsModal';
import type { OrganizationMember, MemberRole } from '../../types/team';
import { RoleSelector } from './RoleSelector';
import { useAuth } from '../../context/AuthContext';

type TabId = 'members' | 'invitations' | 'permissions';

/**
 * Main Team Management Page
 */
export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const { organization, members, stats, isLoading, error, inviteMember, removeMember, updateMemberRole, toggleMemberStatus, refresh } = useTeam();
  const { can } = usePermissions(organization?.id || null);
  
  const [activeTab, setActiveTab] = useState<TabId>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [newRole, setNewRole] = useState<MemberRole | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const canInvite = can('team', 'invite');
  const canEdit = can('team', 'edit');
  const canRemove = can('team', 'remove');
  const isOwner = organization ? organization.ownerId === user?.id : false;
  const canViewPermissions = isOwner || canEdit;

  const handleInvite = async (email: string, role: MemberRole): Promise<boolean> => {
    return await inviteMember(email, role);
  };

  const handleEditClick = (member: OrganizationMember) => {
    setEditingMember(member);
    setNewRole(member.role);
    setUpdateError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingMember || !newRole) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const success = await updateMemberRole(editingMember.id, newRole as MemberRole);
      if (success) {
        setShowEditModal(false);
        setEditingMember(null);
        setNewRole('');
      } else {
        setUpdateError('Erreur lors de la mise à jour du rôle');
      }
    } catch (err) {
      setUpdateError('Une erreur est survenue');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveClick = async (member: OrganizationMember) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.email} de l'équipe ?`)) {
      return;
    }

    await removeMember(member.id);
  };

  const handleToggleStatus = async (member: OrganizationMember) => {
    if (member.role === 'owner') {
      alert('Le propriétaire ne peut pas être désactivé');
      return;
    }

    const action = member.status === 'active' ? 'désactiver' : 'activer';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${member.email} ?`)) {
      return;
    }

    await toggleMemberStatus(member.id, member.status);
  };

  const handleViewMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleEditPermissions = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async (memberId: string, permissions: Record<string, boolean>) => {
    // This would call a service to update permissions
    // For now, we'll just close the modal
    console.log('Saving permissions for', memberId, permissions);
    setShowPermissionsModal(false);
    await refresh();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de l'équipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Aucune organisation trouvée
            </h3>
            <p className="text-yellow-800">
              Vous n'êtes pas encore membre d'une équipe. Contactez votre administrateur pour obtenir une invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Équipe</h1>
              <p className="text-gray-600">{organization.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </button>

            {canInvite && activeTab === 'members' && (
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={stats?.availableSlots === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter
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

        {/* Tabs Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('members')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                ${activeTab === 'members'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Users className="w-5 h-5" />
              <span>Membres</span>
            </button>

            <button
              onClick={() => setActiveTab('invitations')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                ${activeTab === 'invitations'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Mail className="w-5 h-5" />
              <span>Invitations</span>
            </button>

            {canViewPermissions && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                  ${activeTab === 'permissions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Shield className="w-5 h-5" />
                <span>Permissions</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Membres ({members.length})
          </h2>

          {members.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun membre dans l'équipe</p>
            </div>
          ) : (
            <MemberListView
              members={members}
              onView={handleViewMember}
              onEditPermissions={handleEditPermissions}
              onToggleStatus={handleToggleStatus}
              onDelete={handleRemoveClick}
              canEdit={canEdit}
            />
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Invitations en attente
          </h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune invitation en attente</p>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && organization && (
        <PermissionsTab
          organizationId={organization.id}
          members={members}
          canEdit={isOwner}
        />
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
        organizationType={organization.type}
        availableSlots={stats?.availableSlots || 0}
      />

      {/* Member Details Modal */}
      <MemberDetailsModal
        isOpen={showDetailsModal}
        member={selectedMember}
        organizationType={organization.type}
        onClose={() => setShowDetailsModal(false)}
        onEditPermissions={() => {
          setShowDetailsModal(false);
          setShowPermissionsModal(true);
        }}
      />

      {/* Member Permissions Modal */}
      <MemberPermissionsModal
        isOpen={showPermissionsModal}
        member={selectedMember}
        organizationType={organization.type}
        onClose={() => setShowPermissionsModal(false)}
        onSave={handleSavePermissions}
      />

      {/* Edit Role Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isUpdating && setShowEditModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Modifier le rôle
              </h2>
              
              <p className="text-sm text-gray-600 mb-4">
                Membre: {editingMember.email}
              </p>

              {updateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{updateError}</p>
                </div>
              )}

              <RoleSelector
                organizationType={organization.type}
                selectedRole={newRole}
                onChange={setNewRole}
                excludeOwner={true}
              />

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={isUpdating || !newRole || newRole === editingMember.role}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
