import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useOrganizationName() {
  const { user } = useAuth();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setOrganizationName(null);
      setIsLoading(false);
      return;
    }

    const fetchOrganizationName = async () => {
      try {
        setIsLoading(true);

        const { data: ownedOrg } = await supabase
          .from('organizations')
          .select('name, owner_id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedOrg) {
          setOrganizationName(ownedOrg.name);
          setIsLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(name, owner_id)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membership && membership.organizations) {
          const org = membership.organizations as any;
          setOrganizationName(org.name);
        } else {
          setOrganizationName(null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching organization name:', error);
        setOrganizationName(null);
        setIsLoading(false);
      }
    };

    fetchOrganizationName();
  }, [user?.id]);

  return { organizationName, isLoading };
}
