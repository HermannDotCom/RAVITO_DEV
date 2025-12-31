import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SUPPLIER_PAGES, CLIENT_PAGES, ADMIN_PAGES } from '../types/team';

interface UseAllowedPagesReturn {
  allowedPages: string[];
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get the allowed pages for the current user
 * Owners get all pages for their interface type
 * Members get only their assigned pages from allowed_pages field
 */
export function useAllowedPages(): UseAllowedPagesReturn {
  const { user } = useAuth();
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowedPages = async () => {
    if (!user?.id) {
      setIsLoading(false);
      setAllowedPages([]);
      setIsOwner(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First check if user is an organization owner
      const { data: ownedOrg, error: ownerError } = await supabase
        .from('organizations')
        .select('id, type')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownerError && ownerError.code !== 'PGRST116') {
        console.error('Error checking owner status:', ownerError);
        setError('Erreur lors de la vérification du statut');
        setIsLoading(false);
        return;
      }

      if (ownedOrg) {
        // User is owner - grant all pages for their type
        setIsOwner(true);
        let allPages: string[] = [];
        
        switch (ownedOrg.type) {
          case 'client':
            allPages = CLIENT_PAGES.map(p => p.id);
            break;
          case 'supplier':
            allPages = SUPPLIER_PAGES.map(p => p.id);
            break;
          case 'admin':
            allPages = ADMIN_PAGES.map(p => p.id);
            break;
        }
        
        setAllowedPages(allPages);
        setIsLoading(false);
        return;
      }

      // If not owner, check membership and get allowed_pages
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('role, allowed_pages')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching membership:', memberError);
        setError('Erreur lors de la récupération des permissions');
        setIsLoading(false);
        return;
      }

      if (membership) {
        // Check if member has owner role (shouldn't happen but handle it)
        if (membership.role === 'owner') {
          setIsOwner(true);
          // Get all pages based on user's role from profile
          let allPages: string[] = [];
          if (user.role === 'client') {
            allPages = CLIENT_PAGES.map(p => p.id);
          } else if (user.role === 'supplier') {
            allPages = SUPPLIER_PAGES.map(p => p.id);
          } else if (user.role === 'admin') {
            allPages = ADMIN_PAGES.map(p => p.id);
          }
          setAllowedPages(allPages);
        } else {
          // Regular member - use allowed_pages
          setIsOwner(false);
          setAllowedPages(membership.allowed_pages || []);
        }
      } else {
        // User has no membership
        setIsOwner(false);
        setAllowedPages([]);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error in useAllowedPages:', err);
      setError('Erreur lors de la récupération des permissions');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllowedPages();
  }, [user?.id]);

  const refresh = async () => {
    await fetchAllowedPages();
  };

  return {
    allowedPages,
    isOwner,
    isLoading,
    error,
    refresh
  };
}
