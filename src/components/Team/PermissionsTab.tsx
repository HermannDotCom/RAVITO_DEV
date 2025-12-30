import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useTeamPermissions } from '../../hooks/useTeamPermissions';
import { MemberPermissionCard } from './MemberPermissionCard';
import type { OrganizationMember, OrganizationType } from '../../types/team';

interface PermissionsTabProps {
  organizationId: string;
  organizationType: OrganizationType;
  members: OrganizationMember[];
  canEdit: boolean;
}

/**
 * Permissions management tab for team page
 * Allows owners to manage module access for team members
 */
export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  organizationId,
  organizationType,
  members,
  canEdit,
}) => {
  const {
    availableModules,
    memberPermissions,
    isLoading,
    error,
    updateMemberPermission,
    loadAllPermissions,
  } = useTeamPermissions(organizationId);

  const [savingStates, setSavingStates] = useState<Map<string, string>>(new Map());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all member permissions on mount
  useEffect(() => {
    loadAllPermissions();
  }, [loadAllPermissions]);

  // Filter out owner from the list (owner has all permissions by default)
  const editableMembers = members.filter((member) => member.role !== 'owner');

  // Filter modules by organization type and interface
  const filteredModules = availableModules.filter((module) => {
    // Map organization types to interface types
    const interfaceTypeMap: Record<OrganizationType, string> = {
      client: 'client',
      supplier: 'supplier',
      admin: 'admin'
    };
    
    return module.interface === interfaceTypeMap[organizationType];
  });

  // Handle permission change with debounce and auto-save
  const handlePermissionChange = useCallback(
    async (userId: string, moduleKey: string, enabled: boolean) => {
      if (!canEdit) {
        setErrorMessage('Vous n\'avez pas la permission de modifier les accès');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      // Set saving state for this specific module
      setSavingStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, moduleKey);
        return newMap;
      });

      try {
        await updateMemberPermission(userId, moduleKey, enabled);
        
        // Show success message
        setSuccessMessage('Permissions mises à jour');
        setTimeout(() => setSuccessMessage(null), 2000);
      } catch (err) {
        console.error('Error updating permission:', err);
        setErrorMessage('Erreur lors de la mise à jour des permissions');
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        // Clear saving state
        setSavingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }
    },
    [canEdit, updateMemberPermission]
  );

  if (isLoading && memberPermissions.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Permissions</h2>
          <p className="text-gray-600">
            Gérez les accès aux modules pour chaque membre de votre équipe.
            {!canEdit && ' (Lecture seule)'}
          </p>
        </div>
      </div>

      {/* Toast Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 shadow-lg animate-slide-in-right">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 shadow-lg animate-slide-in-right">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900 mb-1">Erreur</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Info Message */}
      {!canEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Vous pouvez consulter les permissions, mais seul le propriétaire peut les modifier.
          </p>
        </div>
      )}

      {/* Organization Type Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-orange-900 font-medium">
            Type d'organisation : {organizationType === 'client' ? 'Client' : organizationType === 'supplier' ? 'Fournisseur' : 'Administrateur'}
          </p>
          <p className="text-sm text-orange-800 mt-1">
            {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} disponible{filteredModules.length > 1 ? 's' : ''} pour ce type d'organisation
          </p>
        </div>
      </div>

      {/* Member Permission Cards */}
      {editableMembers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun membre à gérer</p>
          <p className="text-sm text-gray-500 mt-1">
            Invitez des membres pour gérer leurs permissions
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter members who have a userId (active members only) 
              Members without userId are typically pending invitations */}
          {editableMembers
            .filter((member) => member.userId)
            .map((member) => {
              const permissions = memberPermissions.get(member.userId!) || [];
              const savingModule = savingStates.get(member.userId!);

              return (
                <MemberPermissionCard
                  key={member.id}
                  member={member}
                  modules={filteredModules}
                  permissions={permissions}
                  onPermissionChange={(moduleKey, enabled) =>
                    handlePermissionChange(member.userId!, moduleKey, enabled)
                  }
                  canEdit={canEdit}
                  isLoading={isLoading}
                  savingModule={savingModule}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};
