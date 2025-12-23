import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModuleAccess } from './useModuleAccess';
import { useUserPermissions } from './useUserPermissions';
import type { AvailableModule, UserModulePermission } from '../types/permissions';

interface UseTeamPermissionsReturn {
  // Data
  availableModules: AvailableModule[];
  memberPermissions: Map<string, UserModulePermission[]>;
  
  // State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  updateMemberPermission: (userId: string, moduleKey: string, enabled: boolean) => Promise<void>;
  bulkUpdatePermissions: (userId: string, permissions: {moduleKey: string, enabled: boolean}[]) => Promise<void>;
  loadMemberPermissions: (userId: string) => Promise<void>;
  loadAllPermissions: () => Promise<void>;
  
  // Permissions
  canManagePermissions: boolean;
}

/**
 * Hook for managing team member permissions
 * Provides access to module permissions and update functions
 */
export function useTeamPermissions(organizationId?: string): UseTeamPermissionsReturn {
  const { availableModules } = useModuleAccess();
  const {
    memberPermissions,
    isLoading,
    error,
    updatePermission,
    updateMultiplePermissions,
    loadMemberPermissions: loadMember,
    loadAllMembersPermissions,
    canManagePermissions,
  } = useUserPermissions(organizationId);

  const [isSaving, setIsSaving] = useState(false);

  /**
   * Update a single permission for a team member
   */
  const updateMemberPermission = useCallback(
    async (userId: string, moduleKey: string, enabled: boolean): Promise<void> => {
      if (!canManagePermissions) {
        console.warn('User does not have permission to manage team permissions');
        return;
      }

      try {
        setIsSaving(true);
        await updatePermission(userId, moduleKey, enabled);
      } catch (err) {
        console.error('Error updating member permission:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [canManagePermissions, updatePermission]
  );

  /**
   * Update multiple permissions at once for a team member
   */
  const bulkUpdatePermissions = useCallback(
    async (userId: string, permissions: {moduleKey: string, enabled: boolean}[]): Promise<void> => {
      if (!canManagePermissions) {
        console.warn('User does not have permission to manage team permissions');
        return;
      }

      try {
        setIsSaving(true);
        await updateMultiplePermissions(userId, permissions.map(p => ({
          userId,
          moduleKey: p.moduleKey,
          hasAccess: p.enabled,
        })));
      } catch (err) {
        console.error('Error bulk updating permissions:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [canManagePermissions, updateMultiplePermissions]
  );

  /**
   * Load permissions for a specific team member
   */
  const loadMemberPermissions = useCallback(
    async (userId: string): Promise<void> => {
      await loadMember(userId);
    },
    [loadMember]
  );

  /**
   * Load permissions for all team members
   */
  const loadAllPermissions = useCallback(
    async (): Promise<void> => {
      await loadAllMembersPermissions();
    },
    [loadAllMembersPermissions]
  );

  return {
    availableModules,
    memberPermissions,
    isLoading,
    isSaving,
    error,
    updateMemberPermission,
    bulkUpdatePermissions,
    loadMemberPermissions,
    loadAllPermissions,
    canManagePermissions,
  };
}
