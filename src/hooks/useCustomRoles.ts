import { useState, useEffect, useCallback } from 'react';
import type { CustomRole, OrganizationType } from '../types/team';
import * as roleService from '../services/roleService';

interface UseCustomRolesReturn {
  roles: CustomRole[];
  allRoles: {
    client: CustomRole[];
    supplier: CustomRole[];
    admin: CustomRole[];
  };
  isLoading: boolean;
  error: string | null;
  createRole: (params: {
    organizationType: OrganizationType;
    roleKey: string;
    displayName: string;
    description: string;
    allowedPages: string[];
  }) => Promise<boolean>;
  updateRole: (
    roleId: string,
    updates: {
      displayName?: string;
      description?: string;
      allowedPages?: string[];
    }
  ) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * Custom hook for managing custom roles
 * @param organizationType - If provided, only loads roles for this org type
 * @param loadAll - If true, loads roles for all organization types
 */
export const useCustomRoles = (
  organizationType?: OrganizationType,
  loadAll: boolean = false
): UseCustomRolesReturn => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [allRoles, setAllRoles] = useState<{
    client: CustomRole[];
    supplier: CustomRole[];
    admin: CustomRole[];
  }>({ client: [], supplier: [], admin: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load roles for a specific organization type
  const loadRoles = useCallback(async () => {
    if (!organizationType) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const rolesData = await roleService.getCustomRoles(organizationType);
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading custom roles:', err);
      setError('Erreur lors du chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  }, [organizationType]);

  // Load all roles for all organization types
  const loadAllRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rolesData = await roleService.getAllCustomRoles();
      setAllRoles(rolesData);
    } catch (err) {
      console.error('Error loading all custom roles:', err);
      setError('Erreur lors du chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load roles on mount
  useEffect(() => {
    if (loadAll) {
      loadAllRoles();
    } else if (organizationType) {
      loadRoles();
    } else {
      setIsLoading(false);
    }
  }, [loadAll, organizationType, loadRoles, loadAllRoles]);

  // Create a new role
  const createRole = useCallback(
    async (params: {
      organizationType: OrganizationType;
      roleKey: string;
      displayName: string;
      description: string;
      allowedPages: string[];
    }): Promise<boolean> => {
      setError(null);
      const result = await roleService.createCustomRole(params);

      if (result.success) {
        // Refresh roles
        if (loadAll) {
          await loadAllRoles();
        } else {
          await loadRoles();
        }
        return true;
      } else {
        setError(result.error || 'Erreur lors de la création du rôle');
        return false;
      }
    },
    [loadAll, loadRoles, loadAllRoles]
  );

  // Update a role
  const updateRole = useCallback(
    async (
      roleId: string,
      updates: {
        displayName?: string;
        description?: string;
        allowedPages?: string[];
      }
    ): Promise<boolean> => {
      setError(null);
      const result = await roleService.updateCustomRole(roleId, updates);

      if (result.success) {
        // Refresh roles
        if (loadAll) {
          await loadAllRoles();
        } else {
          await loadRoles();
        }
        return true;
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du rôle');
        return false;
      }
    },
    [loadAll, loadRoles, loadAllRoles]
  );

  // Delete a role
  const deleteRole = useCallback(
    async (roleId: string): Promise<boolean> => {
      setError(null);
      const result = await roleService.deleteCustomRole(roleId);

      if (result.success) {
        // Refresh roles
        if (loadAll) {
          await loadAllRoles();
        } else {
          await loadRoles();
        }
        return true;
      } else {
        setError(result.error || 'Erreur lors de la suppression du rôle');
        return false;
      }
    },
    [loadAll, loadRoles, loadAllRoles]
  );

  // Refresh function
  const refresh = useCallback(async () => {
    await loadRoles();
  }, [loadRoles]);

  // Refresh all function
  const refreshAll = useCallback(async () => {
    await loadAllRoles();
  }, [loadAllRoles]);

  return {
    roles,
    allRoles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refresh,
    refreshAll
  };
};
