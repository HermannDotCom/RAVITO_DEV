import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CLIENT_PAGES, SUPPLIER_PAGES, ADMIN_PAGES, SUPER_ADMIN_EXCLUSIVE_PAGES } from '../constants/pageDefinitions';
import type { UserRole } from '../types';

interface UseAllowedPagesReturn {
  allowedPages: string[];
  isOwner: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Helper function to get all page IDs for a given user role
 * Filters out super admin exclusive pages for non-super admins
 */
function getAllPagesByRole(role: UserRole, isSuperAdmin: boolean = false): string[] {
  if (role === 'client') {
    return CLIENT_PAGES.map(p => p.id);
  } else if (role === 'supplier') {
    return SUPPLIER_PAGES.map(p => p.id);
  } else if (role === 'admin') {
    const allAdminPages = ADMIN_PAGES.map(p => p.id);
    // If not super admin, filter out exclusive pages
    if (!isSuperAdmin) {
      return allAdminPages.filter(pageId => !SUPER_ADMIN_EXCLUSIVE_PAGES.includes(pageId));
    }
    return allAdminPages;
  }
  return [];
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowedPages = async () => {
    if (!user?.id) {
      setIsLoading(false);
      setAllowedPages([]);
      setIsOwner(false);
      setIsSuperAdmin(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user is super admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking super admin status:', profileError);
      }

      const userIsSuperAdmin = profileData?.is_super_admin || false;
      setIsSuperAdmin(userIsSuperAdmin);

      // Check if user is an organization owner
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
        // User is owner
        setIsOwner(true);

        // Check approval status - non-approved users get profile and support pages
        if (!user.isApproved || user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') {
          setAllowedPages(['profile', 'support']);
          setIsLoading(false);
          return;
        }

        // Approved owner - grant all pages based on role and super admin status
        setAllowedPages(getAllPagesByRole(user.role, userIsSuperAdmin));
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
          setAllowedPages(getAllPagesByRole(user.role, userIsSuperAdmin));
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
  }, [user?.id, user?.isApproved, user?.approvalStatus]);

  const refresh = async () => {
    await fetchAllowedPages();
  };

  return {
    allowedPages,
    isOwner,
    isSuperAdmin,
    isLoading,
    error,
    refresh
  };
}
