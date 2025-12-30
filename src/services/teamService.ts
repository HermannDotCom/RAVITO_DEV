import { supabase } from '../lib/supabase';
import type {
  Organization,
  OrganizationMember,
  MemberRole,
  TeamStats,
  OrganizationType
} from '../types/team';

/**
 * Team Service
 * Manages organizations and their members
 */

// Helper function to transform database record to Organization
const transformOrganization = (record: any): Organization => ({
  id: record.id,
  name: record.name,
  type: record.type as OrganizationType,
  ownerId: record.owner_id,
  maxMembers: record.max_members,
  settings: record.settings || {},
  createdAt: new Date(record.created_at),
  updatedAt: new Date(record.updated_at)
});

// Helper function to transform database record to OrganizationMember
const transformMember = (record: any): OrganizationMember => ({
  id: record.id,
  organizationId: record.organization_id,
  userId: record.user_id,
  email: record.email,
  role: record.role as MemberRole,
  permissions: record.permissions || {},
  status: record.status,
  invitationToken: record.invitation_token,
  invitedAt: new Date(record.invited_at),
  acceptedAt: record.accepted_at ? new Date(record.accepted_at) : null,
  createdAt: new Date(record.created_at),
  updatedAt: new Date(record.updated_at)
});

/**
 * Get the organization for a user (either as owner or member)
 */
export const getOrganization = async (userId: string): Promise<Organization | null> => {
  try {
    // First check if user is an owner
    const { data: ownedOrg, error: ownerError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (ownedOrg && !ownerError) {
      return transformOrganization(ownedOrg);
    }

    // If not owner, check if user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData) {
      return null;
    }

    // Get the organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', memberData.organization_id)
      .single();

    if (orgError || !orgData) {
      return null;
    }

    return transformOrganization(orgData);
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
};

/**
 * Get all members of an organization
 */
export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }

    return (data || []).map(transformMember);
  } catch (error) {
    console.error('Error in getOrganizationMembers:', error);
    return [];
  }
};

/**
 * Invite a member to an organization
 */
export const inviteMember = async (
  orgId: string,
  email: string,
  role: MemberRole
): Promise<{ success: boolean; error?: string; member?: OrganizationMember }> => {
  try {
    // Check if organization can add more members
    const { data: canAddData, error: canAddError } = await supabase
      .rpc('can_add_member', { org_id: orgId });

    if (canAddError) {
      console.error('Error checking member quota:', canAddError);
      return { success: false, error: 'Erreur lors de la vérification du quota' };
    }

    if (!canAddData) {
      return { success: false, error: 'Quota de membres atteint' };
    }

    // Generate invitation token
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create member invitation
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        email,
        role,
        status: 'pending',
        invitation_token: invitationToken
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting member:', error);
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Ce membre est déjà invité' };
      }
      return { success: false, error: 'Erreur lors de l\'invitation' };
    }

    // Note: Email sending would be implemented via Supabase Edge Function or external service
    // Example: await supabase.functions.invoke('send-team-invitation', { body: { email, token: invitationToken, organizationName } })

    return { success: true, member: transformMember(data) };
  } catch (error) {
    console.error('Error in inviteMember:', error);
    return { success: false, error: 'Erreur lors de l\'invitation' };
  }
};

/**
 * Remove a member from an organization
 */
export const removeMember = async (memberId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      return { success: false, error: 'Erreur lors de la suppression du membre' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeMember:', error);
    return { success: false, error: 'Erreur lors de la suppression du membre' };
  }
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (
  memberId: string,
  newRole: MemberRole
): Promise<{ success: boolean; error?: string; member?: OrganizationMember }> => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member role:', error);
      return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
    }

    return { success: true, member: transformMember(data) };
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
  }
};

/**
 * Toggle a member's status between active and inactive
 */
export const toggleMemberStatus = async (
  memberId: string,
  currentStatus: string
): Promise<{ success: boolean; error?: string; member?: OrganizationMember }> => {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { data, error } = await supabase
      .from('organization_members')
      .update({ status: newStatus })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling member status:', error);
      return { success: false, error: 'Erreur lors de la modification du statut' };
    }

    return { success: true, member: transformMember(data) };
  } catch (error) {
    console.error('Error in toggleMemberStatus:', error);
    return { success: false, error: 'Erreur lors de la modification du statut' };
  }
};

/**
 * Accept an invitation using a token
 */
export const acceptInvitation = async (
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; member?: OrganizationMember }> => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({
        user_id: userId,
        status: 'active',
        accepted_at: new Date().toISOString()
      })
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Invitation invalide ou expirée' };
    }

    return { success: true, member: transformMember(data) };
  } catch (error) {
    console.error('Error in acceptInvitation:', error);
    return { success: false, error: 'Erreur lors de l\'acceptation de l\'invitation' };
  }
};

/**
 * Get team statistics for an organization
 */
export const getTeamStats = async (orgId: string): Promise<TeamStats> => {
  try {
    // Get organization to know max members
    const { data: orgData } = await supabase
      .from('organizations')
      .select('max_members')
      .eq('id', orgId)
      .single();

    const maxMembers = orgData?.max_members || 0;

    // Get members count
    const { data: members } = await supabase
      .from('organization_members')
      .select('status')
      .eq('organization_id', orgId);

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || 0;
    const pendingInvitations = members?.filter(m => m.status === 'pending').length || 0;
    const availableSlots = maxMembers - activeMembers;

    return {
      totalMembers,
      activeMembers,
      pendingInvitations,
      maxMembers,
      availableSlots
    };
  } catch (error) {
    console.error('Error getting team stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      pendingInvitations: 0,
      maxMembers: 0,
      availableSlots: 0
    };
  }
};

/**
 * Create an organization with the user as owner
 */
export const createOrganization = async (
  name: string,
  type: OrganizationType,
  ownerId: string,
  email: string
): Promise<{ success: boolean; error?: string; organizationId?: string }> => {
  try {
    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      p_name: name,
      p_type: type,
      p_owner_id: ownerId,
      p_email: email
    });

    if (error) {
      console.error('Error creating organization:', error);
      return { success: false, error: 'Erreur lors de la création de l\'organisation' };
    }

    return { success: true, organizationId: data };
  } catch (error) {
    console.error('Error in createOrganization:', error);
    return { success: false, error: 'Erreur lors de la création de l\'organisation' };
  }
};
