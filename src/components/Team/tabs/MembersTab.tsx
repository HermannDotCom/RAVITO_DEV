import React, { useState } from 'react';
import { useTeam } from '../../../hooks/useTeam';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { MemberListView } from '../MemberListView';
import { MemberDetailsModal } from '../MemberDetailsModal';
import { MemberPermissionsModal } from '../MemberPermissionsModal';
import type { OrganizationMember } from '../../../types/team';

export const MembersTab: React.FC = () => {
  const { user } = useAuth();
  const { organization, members, removeMember, toggleMemberStatus, updateMemberPermissions } = useTeam();
  const { can } = usePermissions(organization?.id || null);
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

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

  const handleSavePermissions = async (memberId: string, allowedPages: string[], roleUpdates?: { role?: string; customRoleId?: string | null }): Promise<boolean> => {
    const updates: any = { allowedPages };
    
    if (roleUpdates) {
      if (roleUpdates.role !== undefined) {
        updates.role = roleUpdates.role;
      }
      if (roleUpdates.customRoleId !== undefined) {
        updates.customRoleId = roleUpdates.customRoleId;
      }
    }
    
    return await updateMemberPermissions(memberId, updates);
  };

  if (!organization) return null;

  return (
    <>
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
    </>
  );
};
