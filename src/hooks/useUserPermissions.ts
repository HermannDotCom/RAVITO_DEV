import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useModuleAccess } from './useModuleAccess';
import type { 
  UserModulePermission, 
  PermissionAssignment, 
  AvailableModule,
  InterfaceType 
} from '../types/permissions';

interface UseUserPermissionsReturn {
  // État
  memberPermissions: Map<string, UserModulePermission[]>; // userId -> permissions
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadMemberPermissions: (userId: string) => Promise<void>;
  loadAllMembersPermissions: () => Promise<void>;
  updatePermission: (userId: string, moduleKey: string, hasAccess: boolean) => Promise<boolean>;
  updateMultiplePermissions: (userId: string, assignments: PermissionAssignment[]) => Promise<boolean>;
  
  // Helpers
  canManagePermissions: boolean;
  canAssignModule: (moduleKey: string) => boolean;
  getAssignableModules: () => AvailableModule[];
}

/**
 * Hook to manage permissions for team members
 * Only accessible to owners and users with team management permissions
 * 
 * @param organizationId - Required for most operations. If not provided, 
 *                          most methods will silently fail with warnings.
 *                          Consider providing it from AuthContext or similar.
 */
export function useUserPermissions(organizationId?: string): UseUserPermissionsReturn {
  const { user } = useAuth();
  const { hasAccess, isOwner, availableModules } = useModuleAccess();
  
  const [memberPermissions, setMemberPermissions] = useState<Map<string, UserModulePermission[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user can manage permissions
  const canManagePermissions = isOwner || hasAccess('team');

  // Check if current user can assign a specific module
  const canAssignModule = useCallback(
    (moduleKey: string): boolean => {
      // Owner can assign all modules
      if (isOwner) return true;

      // Find the module
      const module = availableModules.find(m => m.key === moduleKey);

      // Super admin only modules can only be assigned by super admin
      if (module?.isSuperAdminOnly) return false;

      // Otherwise, user can only assign modules they have access to
      return hasAccess(moduleKey);
    },
    [isOwner, availableModules, hasAccess]
  );

  // Get list of modules that current user can assign
  const getAssignableModules = useCallback((): AvailableModule[] => {
    if (isOwner) {
      // Owner can assign all non-super-admin modules
      return availableModules.filter(m => !m.isSuperAdminOnly);
    }

    // Regular users can only assign modules they have access to
    return availableModules.filter(m => 
      !m.isSuperAdminOnly && hasAccess(m.key)
    );
  }, [isOwner, availableModules, hasAccess]);

  // Load permissions for a specific member
  const loadMemberPermissions = useCallback(
    async (userId: string) => {
      if (!organizationId || !canManagePermissions) {
        console.warn('Cannot load member permissions: missing org ID or insufficient permissions');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to load from database
        const { data, error: queryError } = await supabase
          .from('user_module_permissions')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('user_id', userId);

        if (queryError) {
          // If table doesn't exist, skip
          if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
            console.warn('user_module_permissions table not found - skipping load');
            return;
          }
          throw queryError;
        }

        const permissions = (data || []).map((record: any) => ({
          id: record.id,
          organizationId: record.organization_id,
          userId: record.user_id,
          moduleKey: record.module_key,
          hasAccess: record.has_access,
          assignedBy: record.assigned_by,
          assignedAt: new Date(record.assigned_at),
          updatedAt: new Date(record.updated_at),
        }));

        setMemberPermissions(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, permissions);
          return newMap;
        });
      } catch (err) {
        console.error('Error loading member permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load member permissions');
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, canManagePermissions]
  );

  // Load permissions for all members of the organization
  const loadAllMembersPermissions = useCallback(async () => {
    if (!organizationId || !canManagePermissions) {
      console.warn('Cannot load all permissions: missing org ID or insufficient permissions');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get all members of the organization
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (membersError) {
        if (membersError.code === '42P01' || membersError.message.includes('does not exist')) {
          console.warn('organization_members table not found - skipping load');
          return;
        }
        throw membersError;
      }

      // Load permissions for all members
      const { data, error: queryError } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('organization_id', organizationId);

      if (queryError) {
        if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
          console.warn('user_module_permissions table not found - skipping load');
          return;
        }
        throw queryError;
      }

      // Group permissions by user
      const permsByUser = new Map<string, UserModulePermission[]>();
      (data || []).forEach((record: any) => {
        const permission: UserModulePermission = {
          id: record.id,
          organizationId: record.organization_id,
          userId: record.user_id,
          moduleKey: record.module_key,
          hasAccess: record.has_access,
          assignedBy: record.assigned_by,
          assignedAt: new Date(record.assigned_at),
          updatedAt: new Date(record.updated_at),
        };

        const userPerms = permsByUser.get(record.user_id) || [];
        userPerms.push(permission);
        permsByUser.set(record.user_id, userPerms);
      });

      setMemberPermissions(permsByUser);
    } catch (err) {
      console.error('Error loading all member permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load all member permissions');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, canManagePermissions]);

  // Update a single permission
  const updatePermission = useCallback(
    async (userId: string, moduleKey: string, hasAccess: boolean): Promise<boolean> => {
      if (!organizationId || !user?.id || !canManagePermissions) {
        console.warn('Cannot update permission: missing org ID or insufficient permissions');
        return false;
      }

      // Check if can assign this module
      if (!canAssignModule(moduleKey)) {
        console.warn(`Cannot assign module ${moduleKey}: insufficient permissions`);
        return false;
      }

      try {
        setError(null);

        // Upsert permission
        const { error: upsertError } = await supabase
          .from('user_module_permissions')
          .upsert({
            organization_id: organizationId,
            user_id: userId,
            module_key: moduleKey,
            has_access: hasAccess,
            assigned_by: user.id,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'organization_id,user_id,module_key'
          });

        if (upsertError) {
          if (upsertError.code === '42P01' || upsertError.message.includes('does not exist')) {
            console.warn('user_module_permissions table not found - cannot update');
            return false;
          }
          throw upsertError;
        }

        // Reload permissions for this user
        await loadMemberPermissions(userId);
        return true;
      } catch (err) {
        console.error('Error updating permission:', err);
        setError(err instanceof Error ? err.message : 'Failed to update permission');
        return false;
      }
    },
    [organizationId, user?.id, canManagePermissions, canAssignModule, loadMemberPermissions]
  );

  // Update multiple permissions at once
  const updateMultiplePermissions = useCallback(
    async (userId: string, assignments: PermissionAssignment[]): Promise<boolean> => {
      if (!organizationId || !user?.id || !canManagePermissions) {
        console.warn('Cannot update permissions: missing org ID or insufficient permissions');
        return false;
      }

      try {
        setError(null);

        // Filter to only modules that can be assigned
        const validAssignments = assignments.filter(a => canAssignModule(a.moduleKey));

        if (validAssignments.length === 0) {
          console.warn('No valid assignments to update');
          return false;
        }

        // Prepare upsert data
        const upsertData = validAssignments.map(assignment => ({
          organization_id: organizationId,
          user_id: userId,
          module_key: assignment.moduleKey,
          has_access: assignment.hasAccess,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('user_module_permissions')
          .upsert(upsertData, {
            onConflict: 'organization_id,user_id,module_key'
          });

        if (upsertError) {
          if (upsertError.code === '42P01' || upsertError.message.includes('does not exist')) {
            console.warn('user_module_permissions table not found - cannot update');
            return false;
          }
          throw upsertError;
        }

        // Reload permissions for this user
        await loadMemberPermissions(userId);
        return true;
      } catch (err) {
        console.error('Error updating multiple permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to update permissions');
        return false;
      }
    },
    [organizationId, user?.id, canManagePermissions, canAssignModule, loadMemberPermissions]
  );

  return {
    memberPermissions,
    isLoading,
    error,
    loadMemberPermissions,
    loadAllMembersPermissions,
    updatePermission,
    updateMultiplePermissions,
    canManagePermissions,
    canAssignModule,
    getAssignableModules,
  };
}
