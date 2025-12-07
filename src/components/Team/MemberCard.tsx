import React, { useState } from 'react';
import { MoreVertical, Mail, Shield, Trash2, Edit } from 'lucide-react';
import type { OrganizationMember } from '../../types/team';
import { ROLE_LABELS, ROLE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../types/team';

interface MemberCardProps {
  member: OrganizationMember;
  isOwner: boolean;
  canEdit: boolean;
  canRemove: boolean;
  onEdit?: (member: OrganizationMember) => void;
  onRemove?: (member: OrganizationMember) => void;
}

/**
 * Display a team member card with actions
 */
export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isOwner,
  canEdit,
  canRemove,
  onEdit,
  onRemove
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) onEdit(member);
  };

  const handleRemove = () => {
    setShowMenu(false);
    if (onRemove) onRemove(member);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(member.email)}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {member.email}
              </h3>
              {member.role === 'owner' && (
                <Shield className="w-4 h-4 text-purple-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                {ROLE_LABELS[member.role]}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[member.status]}`}>
                {STATUS_LABELS[member.status]}
              </span>
            </div>

            {member.status === 'pending' && (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                En attente d'acceptation
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {!isOwner && (canEdit || canRemove) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le rôle
                    </button>
                  )}
                  {canRemove && (
                    <button
                      onClick={handleRemove}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Retirer du groupe
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
