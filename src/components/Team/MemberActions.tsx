import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
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
 * Boutons d'action visibles pour chaque membre
 * Le propriétaire est en lecture seule (seul le bouton "Voir" est affiché)
 */
export const MemberActions: React.FC<MemberActionsProps> = ({
  member,
  isOwner,
  canEdit,
  canRemove,
  onViewDetails,
  onEditPermissions,
  onRemove,
}) => {
  // Owner: read-only, only show "View" button
  if (isOwner) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => onViewDetails(member)}
          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          title="Voir les détails"
          aria-label="Voir les détails"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Regular members: show View, Edit, and Delete buttons
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => onViewDetails(member)}
        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        title="Voir les détails"
        aria-label="Voir les détails"
      >
        <Eye className="w-5 h-5" />
      </button>

      {canEdit && (
        <button
          onClick={() => onEditPermissions(member)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Modifier les permissions"
          aria-label="Modifier les permissions"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      )}

      {canRemove && (
        <button
          onClick={() => onRemove(member)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Supprimer le membre"
          aria-label="Supprimer le membre"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
