import React from 'react';
import type { MemberRole, OrganizationType } from '../../types/team';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES_BY_ORG_TYPE } from '../../types/team';

interface RoleSelectorProps {
  organizationType: OrganizationType;
  selectedRole: MemberRole | '';
  onChange: (role: MemberRole) => void;
  excludeOwner?: boolean;
}

/**
 * Role selector dropdown with descriptions
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  organizationType,
  selectedRole,
  onChange,
  excludeOwner = true
}) => {
  const availableRoles = ROLES_BY_ORG_TYPE[organizationType].filter(
    role => !excludeOwner || role !== 'owner'
  );

  return (
    <div className="space-y-2">
      <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">
        Rôle
      </label>
      <select
        id="role-select"
        value={selectedRole}
        onChange={(e) => onChange(e.target.value as MemberRole)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        <option value="">Sélectionner un rôle</option>
        {availableRoles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>

      {selectedRole && (
        <p className="text-sm text-gray-600 mt-1">
          {ROLE_DESCRIPTIONS[selectedRole]}
        </p>
      )}
    </div>
  );
};
