import { useState, useEffect, useCallback } from 'react';
import type { Permissions, PermissionAction } from '../types/team';
import * as permissionService from '../services/permissionService';
import { useAuth } from '../context/AuthContext';

interface UsePermissionsReturn {
  permissions: Permissions;
  isLoading: boolean;
  can: (section: string, action: PermissionAction) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for checking user permissions
 * @param organizationId - The organization ID to check permissions for
 */
export const usePermissions = (organizationId: string | null): UsePermissionsReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load user permissions
  const loadPermissions = useCallback(async () => {
    if (!user?.id || !organizationId) {
      setIsLoading(false);
      setPermissions({});
      return;
    }

    try {
      setIsLoading(true);
      const perms = await permissionService.getUserPermissions(user.id, organizationId);
      setPermissions(perms);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setPermissions({});
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organizationId]);

  // Load permissions on mount and when dependencies change
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Check if user has a specific permission
  const can = useCallback(
    (section: string, action: PermissionAction): boolean => {
      if (!permissions || !section) return false;

      const sectionPerms = permissions[section as keyof Permissions];
      if (!sectionPerms || typeof sectionPerms !== 'object') return false;

      // Type-safe access to permission action
      const hasPermission = sectionPerms[action as keyof typeof sectionPerms];
      return typeof hasPermission === 'boolean' ? hasPermission : false;
    },
    [permissions]
  );

  // Refresh function
  const refresh = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    isLoading,
    can,
    refresh
  };
};
