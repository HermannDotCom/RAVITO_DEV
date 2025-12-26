import { supabase } from '../lib/supabase';
import type {
  Permissions,
  PermissionAction,
  RolePermission,
  OrganizationType,
  MemberRole
} from '../types/team';

/**
 * Permission Service
 * Manages user permissions and role-based access control
 */

/**
 * Get user permissions for a specific organization
 */
export const getUserPermissions = async (
  userId: string,
  orgId: string
): Promise<Permissions> => {
  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
      org_id: orgId
    });

    if (error) {
      console.error('Error getting user permissions:', error);
      return {};
    }

    return data || {};
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return {};
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = async (
  userId: string,
  orgId: string,
  section: string,
  action: PermissionAction
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_permission', {
      p_user_id: userId,
      org_id: orgId,
      section,
      action
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
};

/**
 * Get role permissions for a specific organization type and role
 */
export const getRolePermissions = async (
  orgType: OrganizationType,
  role: MemberRole
): Promise<RolePermission | null> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_type', orgType)
      .eq('role_name', role)
      .single();

    if (error) {
      console.error('Error getting role permissions:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      organizationType: data.organization_type as OrganizationType,
      roleName: data.role_name as MemberRole,
      displayName: data.display_name,
      description: data.description,
      permissions: data.permissions as Permissions,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error in getRolePermissions:', error);
    return null;
  }
};

/**
 * Get all available roles for an organization type
 */
export const getAvailableRoles = async (
  orgType: OrganizationType
): Promise<RolePermission[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_type', orgType)
      .order('role_name');

    if (error) {
      console.error('Error getting available roles:', error);
      return [];
    }

    return (data || []).map(record => ({
      id: record.id,
      organizationType: record.organization_type as OrganizationType,
      roleName: record.role_name as MemberRole,
      displayName: record.display_name,
      description: record.description,
      permissions: record.permissions as Permissions,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    }));
  } catch (error) {
    console.error('Error in getAvailableRoles:', error);
    return [];
  }
};

/**
 * Check if a user is an organization owner
 */
export const isOrganizationOwner = async (
  userId: string,
  orgId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.owner_id === userId;
  } catch (error) {
    console.error('Error checking if user is owner:', error);
    return false;
  }
};
