import React from 'react';
import { User } from 'lucide-react';
import type { OrganizationMember } from '../../types/team';
import type { AvailableModule, UserModulePermission } from '../../types/permissions';
import { ModuleToggle } from './ModuleToggle';
import { ROLE_LABELS } from '../../types/team';

interface MemberPermissionCardProps {
  member: OrganizationMember;
  modules: AvailableModule[];
  permissions: UserModulePermission[];
  onPermissionChange: (moduleKey: string, enabled: boolean) => void;
  canEdit: boolean;
  isLoading: boolean;
  savingModule?: string;
}

/**
 * Card displaying a team member with their module permissions
 * Shows avatar, name, role and grid of module toggles
 */
export const MemberPermissionCard: React.FC<MemberPermissionCardProps> = ({
  member,
  modules,
  permissions,
  onPermissionChange,
  canEdit,
  isLoading,
  savingModule,
}) => {
  // Create a map of module permissions for quick lookup
  const permissionMap = new Map<string, boolean>();
  permissions.forEach((perm) => {
    permissionMap.set(perm.moduleKey, perm.hasAccess);
  });

  // Get member's display name with fallback logic
  const getDisplayName = (member: OrganizationMember): string => {
    // Try to extract name from email
    if (member.email && member.email.includes('@')) {
      return member.email.split('@')[0];
    }
    // Fallback to email if no @ sign
    if (member.email) {
      return member.email;
    }
    // Last resort fallback
    return 'Membre';
  };

  const displayName = getDisplayName(member);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Member Header */}
      <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {displayName}
          </h3>
          <p className="text-sm text-gray-600">{member.email}</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
            {ROLE_LABELS[member.role] || member.role}
          </span>
        </div>
      </div>

      {/* Module Permissions Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Accès aux modules
        </h4>
        
        {isLoading && permissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((module) => {
              const hasAccess = permissionMap.get(module.key) || module.isAlwaysAccessible;
              const isSaving = savingModule === module.key;

              return (
                <ModuleToggle
                  key={module.key}
                  module={module}
                  enabled={hasAccess}
                  onChange={(enabled) => onPermissionChange(module.key, enabled)}
                  disabled={!canEdit || module.isOwnerOnly}
                  isAlwaysAccessible={module.isAlwaysAccessible}
                  isLoading={isSaving}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
