import { supabase } from '../lib/supabase';

/**
 * Service for managing organization data
 */

/**
 * Update organization name
 * @param organizationId - The organization ID
 * @param name - The new organization name
 * @returns Promise<void>
 * @throws Error if update fails
 */
export const updateOrganizationName = async (organizationId: string, name: string): Promise<void> => {
  if (!name.trim()) {
    throw new Error('Le nom de l\'établissement ne peut pas être vide');
  }

  const { error } = await supabase
    .from('organizations')
    .update({ 
      name: name.trim(), 
      updated_at: new Date().toISOString() 
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error updating organization name:', error);
    throw new Error('Erreur lors de la mise à jour du nom de l\'établissement');
  }
};

/**
 * Create an organization for a user
 * @param ownerId - The user ID who will own the organization
 * @param name - The organization name
 * @param type - The organization type (client, supplier, admin)
 * @returns Promise<string> - The created organization ID
 * @throws Error if creation fails
 */
export const createOrganization = async (
  ownerId: string,
  name: string,
  type: 'client' | 'supplier' | 'admin'
): Promise<string> => {
  if (!name.trim()) {
    throw new Error('Le nom de l\'établissement est requis');
  }

  // Use the database function to create organization with owner
  const { data, error } = await supabase.rpc('create_organization_with_owner', {
    org_name: name.trim(),
    org_type: type,
    owner_id: ownerId
  });

  if (error) {
    console.error('Error creating organization:', error);
    throw new Error('Erreur lors de la création de l\'organisation');
  }

  return data as string;
};

/**
 * Get organization details by ID
 * @param organizationId - The organization ID
 * @returns Promise<Organization | null>
 */
export const getOrganization = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching organization:', error);
    throw new Error('Erreur lors de la récupération de l\'organisation');
  }

  return data;
};
