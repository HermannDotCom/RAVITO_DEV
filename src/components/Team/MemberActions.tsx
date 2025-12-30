import React, { useState } from 'react';
import { MoreVertical, Eye, Shield, Power, Trash2 } from 'lucide-react';
import type { OrganizationMember } from '../../types/team';

interface MemberActionsProps {
  member: OrganizationMember;
  isOwner: boolean;
  canEdit: boolean;
  canRemove: boolean;
  onViewDetails: (member: OrganizationMember) => void;
  onEditPermissions: (member: OrganizationMember) => void;
  onToggleStatus: (member: OrganizationMember) => void;
  onRemove: (member: OrganizationMember) => void;
}

/**
 * Dropdown d'actions pour chaque membre
 * Note: Le propriétaire ne peut pas être désactivé ni supprimé
 */
export const MemberActions: React.FC<MemberActionsProps> = ({
  member,
  isOwner,
  canEdit,
  canRemove,
  onViewDetails,
  onEditPermissions,
  onToggleStatus,
  onRemove,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleViewDetails = () => {
    setShowMenu(false);
    onViewDetails(member);
  };

  const handleEditPermissions = () => {
    setShowMenu(false);
    onEditPermissions(member);
  };

  const handleToggleStatus = () => {
    setShowMenu(false);
    onToggleStatus(member);
  };

  const handleRemove = () => {
    setShowMenu(false);
    onRemove(member);
  };

  // Owner cannot be modified
  if (isOwner) {
    return (
      <button
        onClick={handleViewDetails}
        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <Eye className="w-4 h-4 inline mr-1" />
        Voir
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </button>
            
            {canEdit && (
              <button
                onClick={handleEditPermissions}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Shield className="w-4 h-4 mr-2" />
                Modifier permissions
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleToggleStatus}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Power className="w-4 h-4 mr-2" />
                {member.isActive ? 'Désactiver' : 'Activer'}
              </button>
            )}

            {canRemove && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={handleRemove}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
