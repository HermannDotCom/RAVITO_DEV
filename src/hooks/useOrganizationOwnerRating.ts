import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useOrganizationOwnerRating() {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5.0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRating(5.0);
      setTotalOrders(0);
      setIsLoading(false);
      return;
    }

    const fetchOwnerRating = async () => {
      try {
        setIsLoading(true);

        const { data: ownedOrg } = await supabase
          .from('organizations')
          .select('owner_id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedOrg) {
          setRating(user.rating || 5.0);
          setTotalOrders(user.totalOrders || 0);
          setIsLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(owner_id, profiles!organizations_owner_id_fkey(rating, total_orders))')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membership && membership.organizations) {
          const org = membership.organizations as any;
          const ownerProfile = org.profiles;
          setRating(ownerProfile?.rating || 5.0);
          setTotalOrders(ownerProfile?.total_orders || 0);
        } else {
          setRating(user.rating || 5.0);
          setTotalOrders(user.totalOrders || 0);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching owner rating:', error);
        setRating(user.rating || 5.0);
        setTotalOrders(user.totalOrders || 0);
        setIsLoading(false);
      }
    };

    fetchOwnerRating();
  }, [user?.id, user?.rating, user?.totalOrders]);

  return { rating, totalOrders, isLoading };
}
