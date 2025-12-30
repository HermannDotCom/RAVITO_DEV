import { supabase } from '../lib/supabase';
import type { CustomRole, OrganizationType } from '../types/team';

/**
 * Role Service
 * Manages custom roles for organizations
 */

// Helper function to transform database record to CustomRole
const transformCustomRole = (record: any): CustomRole => ({
  id: record.id,
  organizationType: record.organization_type as OrganizationType,
  roleKey: record.role_key,
  displayName: record.display_name,
  description: record.description || '',
  allowedPages: record.allowed_pages || [],
  isSystemRole: record.is_system_role || false,
  isActive: record.is_active !== false,
  createdBy: record.created_by,
  createdAt: new Date(record.created_at),
  updatedAt: new Date(record.updated_at)
});

/**
 * Get all custom roles for a specific organization type
 */
export const getCustomRoles = async (
  organizationType: OrganizationType
): Promise<CustomRole[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .eq('organization_type', organizationType)
      .eq('is_active', true)
      .order('is_system_role', { ascending: false })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching custom roles:', error);
      return [];
    }

    return (data || []).map(transformCustomRole);
  } catch (error) {
    console.error('Error in getCustomRoles:', error);
    return [];
  }
};

/**
 * Get a specific custom role by ID
 */
export const getCustomRoleById = async (
  roleId: string
): Promise<CustomRole | null> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error || !data) {
      console.error('Error fetching custom role:', error);
      return null;
    }

    return transformCustomRole(data);
  } catch (error) {
    console.error('Error in getCustomRoleById:', error);
    return null;
  }
};

/**
 * Get a custom role by organization type and role key
 */
export const getCustomRoleByKey = async (
  organizationType: OrganizationType,
  roleKey: string
): Promise<CustomRole | null> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .eq('organization_type', organizationType)
      .eq('role_key', roleKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching custom role by key:', error);
      return null;
    }

    return transformCustomRole(data);
  } catch (error) {
    console.error('Error in getCustomRoleByKey:', error);
    return null;
  }
};

/**
 * Create a new custom role (Super Admin only)
 */
export const createCustomRole = async (params: {
  organizationType: OrganizationType;
  roleKey: string;
  displayName: string;
  description: string;
  allowedPages: string[];
}): Promise<{ success: boolean; error?: string; role?: CustomRole }> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .insert({
        organization_type: params.organizationType,
        role_key: params.roleKey,
        display_name: params.displayName,
        description: params.description,
        allowed_pages: params.allowedPages,
        is_system_role: false,
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom role:', error);
      if (error.code === '23505') {
        return { success: false, error: 'Un rôle avec cette clé existe déjà' };
      }
      return { success: false, error: 'Erreur lors de la création du rôle' };
    }

    return { success: true, role: transformCustomRole(data) };
  } catch (error) {
    console.error('Error in createCustomRole:', error);
    return { success: false, error: 'Erreur lors de la création du rôle' };
  }
};

/**
 * Update a custom role (Super Admin only, non-system roles only)
 */
export const updateCustomRole = async (
  roleId: string,
  updates: {
    displayName?: string;
    description?: string;
    allowedPages?: string[];
  }
): Promise<{ success: boolean; error?: string; role?: CustomRole }> => {
  try {
    const updateData: any = {};
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.allowedPages !== undefined) updateData.allowed_pages = updates.allowedPages;

    const { data, error } = await supabase
      .from('custom_roles')
      .update(updateData)
      .eq('id', roleId)
      .eq('is_system_role', false) // Only non-system roles can be updated
      .select()
      .single();

    if (error) {
      console.error('Error updating custom role:', error);
      return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
    }

    if (!data) {
      return { success: false, error: 'Rôle non trouvé ou protégé' };
    }

    return { success: true, role: transformCustomRole(data) };
  } catch (error) {
    console.error('Error in updateCustomRole:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
  }
};

/**
 * Delete a custom role (Super Admin only, non-system roles only)
 */
export const deleteCustomRole = async (
  roleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if any members are using this role
    const { data: members, error: checkError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('custom_role_id', roleId)
      .limit(1);

    if (checkError) {
      console.error('Error checking role usage:', checkError);
      return { success: false, error: 'Erreur lors de la vérification du rôle' };
    }

    if (members && members.length > 0) {
      return { 
        success: false, 
        error: 'Ce rôle est utilisé par des membres. Veuillez d\'abord réassigner leurs rôles.' 
      };
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('custom_roles')
      .update({ is_active: false })
      .eq('id', roleId)
      .eq('is_system_role', false); // Only non-system roles can be deleted

    if (error) {
      console.error('Error deleting custom role:', error);
      return { success: false, error: 'Erreur lors de la suppression du rôle' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCustomRole:', error);
    return { success: false, error: 'Erreur lors de la suppression du rôle' };
  }
};

/**
 * Get all custom roles for all organization types (Super Admin only)
 */
export const getAllCustomRoles = async (): Promise<{
  client: CustomRole[];
  supplier: CustomRole[];
  admin: CustomRole[];
}> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .eq('is_active', true)
      .order('organization_type', { ascending: true })
      .order('is_system_role', { ascending: false })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching all custom roles:', error);
      return { client: [], supplier: [], admin: [] };
    }

    const roles = (data || []).map(transformCustomRole);
    
    return {
      client: roles.filter(r => r.organizationType === 'client'),
      supplier: roles.filter(r => r.organizationType === 'supplier'),
      admin: roles.filter(r => r.organizationType === 'admin')
    };
  } catch (error) {
    console.error('Error in getAllCustomRoles:', error);
    return { client: [], supplier: [], admin: [] };
  }
};
