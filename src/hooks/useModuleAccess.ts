import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { InterfaceType, AvailableModule } from '../types/permissions';

interface UseModuleAccessReturn {
  hasAccess: (moduleKey: string) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  // Helpers
  isOwner: boolean;
  isSuperAdmin: boolean;
  availableModules: AvailableModule[];
}

/**
 * Hook to check if the current user has access to specific modules
 * Includes fallback mode for when permission tables don't exist yet
 */
export function useModuleAccess(interfaceType?: InterfaceType): UseModuleAccessReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map());
  const [availableModules, setAvailableModules] = useState<AvailableModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Load available modules
  const loadAvailableModules = useCallback(async () => {
    try {
      // Try to load modules from database
      const { data, error: queryError } = await supabase
        .from('available_modules')
        .select('*')
        .order('display_order');

      if (queryError) {
        // Check if table doesn't exist (PostgreSQL error code 42P01)
        if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
          console.warn('available_modules table not found - using fallback mode');
          setFallbackMode(true);
          return [];
        }
        throw queryError;
      }

      return (data || []).map((record: any) => ({
        id: record.id,
        key: record.key,
        name: record.name,
        description: record.description,
        icon: record.icon,
        interface: record.interface as InterfaceType,
        isOwnerOnly: record.is_owner_only || false,
        isSuperAdminOnly: record.is_super_admin_only || false,
        isAlwaysAccessible: record.is_always_accessible || false,
        displayOrder: record.display_order || 0,
      }));
    } catch (err) {
      console.error('Error loading available modules:', err);
      setFallbackMode(true);
      return [];
    }
  }, []);

  // Check if user is organization owner
  const checkIsOwner = useCallback(async (userId: string) => {
    if (!userId) return false;

    try {
      const { data, error: queryError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (queryError) {
        // If organizations table doesn't exist, assume not owner in fallback mode
        if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
          console.warn('organizations table not found - using fallback mode');
          return false;
        }
        throw queryError;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking owner status:', err);
      return false;
    }
  }, []);

  // Check if user is super admin
  const checkIsSuperAdmin = useCallback(async (userId: string) => {
    if (!userId) return false;

    try {
      // Check if user has is_super_admin flag in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      return profileData?.is_super_admin === true;
    } catch (err) {
      console.error('Error checking super admin status:', err);
      return false;
    }
  }, []);

  // Load user permissions from database
  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setPermissions(new Map());
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check user status
      const [ownerStatus, superAdminStatus, modules] = await Promise.all([
        checkIsOwner(user.id),
        checkIsSuperAdmin(user.id),
        loadAvailableModules(),
      ]);

      setIsOwner(ownerStatus);
      setIsSuperAdmin(superAdminStatus);
      setAvailableModules(modules);

      // If in fallback mode, owner and super admin have all access
      if (fallbackMode) {
        const fallbackPermissions = new Map<string, boolean>();
        modules.forEach(module => {
          // Owner has access to everything in their interface
          // Super admin has access to everything in admin interface
          const hasAccess = ownerStatus || (superAdminStatus && module.interface === 'admin');
          fallbackPermissions.set(module.key, hasAccess);
        });
        setPermissions(fallbackPermissions);
        setIsLoading(false);
        return;
      }

      // Try to load permissions from database
      const { data: permissionsData, error: permError } = await supabase
        .from('user_module_permissions')
        .select('module_key, has_access')
        .eq('user_id', user.id);

      if (permError) {
        // Check if table doesn't exist
        if (permError.code === '42P01' || permError.message.includes('does not exist')) {
          console.warn('user_module_permissions table not found - using fallback mode');
          setFallbackMode(true);
          // Rerun with fallback mode
          const fallbackPermissions = new Map<string, boolean>();
          modules.forEach(module => {
            const hasAccess = ownerStatus || (superAdminStatus && module.interface === 'admin');
            fallbackPermissions.set(module.key, hasAccess);
          });
          setPermissions(fallbackPermissions);
          setIsLoading(false);
          return;
        }
        throw permError;
      }

      // Build permissions map
      const permsMap = new Map<string, boolean>();
      (permissionsData || []).forEach((perm: any) => {
        permsMap.set(perm.module_key, perm.has_access);
      });

      setPermissions(permsMap);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      setFallbackMode(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, checkIsOwner, checkIsSuperAdmin, loadAvailableModules, fallbackMode]);

  // Load permissions on mount and when user changes
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Check if user has access to a specific module
  const hasAccess = useCallback(
    (moduleKey: string): boolean => {
      // 1. If loading, allow temporarily to avoid flash of denied content
      if (isLoading) return true;

      // 2. If no user, deny access
      if (!user) return false;

      // 3. Find module details
      const module = availableModules.find(m => m.key === moduleKey);

      // 4. Super Admin has access to all admin modules (only if interfaceType is explicitly 'admin')
      if (isSuperAdmin && interfaceType === 'admin') return true;

      // 5. Check if module is super_admin_only
      if (module?.isSuperAdminOnly && !isSuperAdmin) return false;

      // 6. Owner has access to everything in their interface
      if (isOwner) return true;

      // 7. Modules that are always accessible
      if (module?.isAlwaysAccessible) return true;

      // 8. Check specific permissions
      return permissions.get(moduleKey) || false;
    },
    [isLoading, user, availableModules, isSuperAdmin, interfaceType, isOwner, permissions]
  );

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  return {
    hasAccess,
    isLoading,
    error,
    refreshPermissions,
    isOwner,
    isSuperAdmin,
    availableModules,
  };
}
