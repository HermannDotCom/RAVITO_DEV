import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { updateOrganizationName } from '../services/organizationService';

interface UseOrganizationReturn {
  organizationId: string | null;
  organizationName: string | null;
  organizationType: 'client' | 'supplier' | 'admin' | null;
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  updateOrganization: (data: { name: string }) => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

/**
 * Hook to get the organization information for the current user
 * Works for both organization owners and members
 */
export function useOrganization(): UseOrganizationReturn {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<'client' | 'supplier' | 'admin' | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setOrganizationId(null);
      setOrganizationName(null);
      setOrganizationType(null);
      setIsOwner(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First check if user is an organization owner
      const { data: ownedOrg, error: ownerError } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownerError && ownerError.code !== 'PGRST116') {
        console.error('Error fetching owned organization:', ownerError);
        setError('Erreur lors de la récupération de l\'organisation');
        setIsLoading(false);
        return;
      }

      if (ownedOrg) {
        // User is an owner
        setOrganizationId(ownedOrg.id);
        setOrganizationName(ownedOrg.name);
        setOrganizationType(ownedOrg.type as 'client' | 'supplier' | 'admin');
        setIsOwner(true);
        setIsLoading(false);
        return;
      }

      // If not owner, check if user is a member
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching membership:', memberError);
        setError('Erreur lors de la récupération du membership');
        setIsLoading(false);
        return;
      }

      if (membership && membership.organizations) {
        // User is a member
        const org = membership.organizations as any;
        setOrganizationId(org.id);
        setOrganizationName(org.name);
        setOrganizationType(org.type as 'client' | 'supplier' | 'admin');
        setIsOwner(membership.role === 'owner');
      } else {
        // User has no organization
        setOrganizationId(null);
        setOrganizationName(null);
        setOrganizationType(null);
        setIsOwner(false);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error in useOrganization:', err);
      setError('Erreur lors de la récupération de l\'organisation');
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const updateOrganization = useCallback(async (data: { name: string }) => {
    if (!organizationId) {
      throw new Error('Aucune organisation trouvée');
    }

    await updateOrganizationName(organizationId, data.name);
    // Refresh organization data after update
    await fetchOrganization();
  }, [organizationId, fetchOrganization]);

  const refreshOrganization = useCallback(async () => {
    await fetchOrganization();
  }, [fetchOrganization]);

  return {
    organizationId,
    organizationName,
    organizationType,
    isOwner,
    isLoading,
    error,
    updateOrganization,
    refreshOrganization
  };
}
