import { supabase } from '../lib/supabase';

/**
 * Get the organization owner ID for a given user
 * Returns the user's own ID if they're an owner, or their organization owner's ID if they're a member
 * 
 * This is used to ensure all members of an organization see the same data by querying
 * with the organization owner's ID instead of their individual user IDs.
 */
export async function getOrganizationOwnerId(userId: string): Promise<string> {
  try {
    // First check if user is an organization owner
    const { data: ownedOrg, error: ownerError } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (ownedOrg) {
      // User is an owner, return their own ID
      return userId;
    }

    // If not owner, check if user is a member and get the organization's owner
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations!inner (
          owner_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (membership && membership.organizations) {
      // User is a member, return organization owner's ID
      const org = Array.isArray(membership.organizations) 
        ? membership.organizations[0] 
        : membership.organizations;
      return org.owner_id;
    }

    // Fallback to user's own ID if no organization found
    return userId;
  } catch (error) {
    console.error('Error getting organization owner ID:', error);
    // Fallback to user's own ID on error
    return userId;
  }
}
