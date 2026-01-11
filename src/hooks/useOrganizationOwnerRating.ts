import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Helper function to fetch rating and total orders for a given user ID
 */
async function fetchUserRatingData(userId: string): Promise<{ rating: number; totalOrders: number }> {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('rating, total_orders')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user rating data:', error);
      return { rating: 5.0, totalOrders: 0 };
    }

    return {
      rating: profileData?.rating || 5.0,
      totalOrders: profileData?.total_orders || 0
    };
  } catch (error) {
    console.error('Unexpected error fetching user rating data:', error);
    return { rating: 5.0, totalOrders: 0 };
  }
}

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
          // Query database directly for the most up-to-date rating
          const { rating: userRating, totalOrders: userTotalOrders } = await fetchUserRatingData(user.id);
          setRating(userRating);
          setTotalOrders(userTotalOrders);
          setIsLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(owner_id)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membership && membership.organizations) {
          const org = membership.organizations as any;

          // Fetch owner profile rating
          const { rating: ownerRating, totalOrders: ownerTotalOrders } = await fetchUserRatingData(org.owner_id);
          setRating(ownerRating);
          setTotalOrders(ownerTotalOrders);
        } else {
          // Query database directly for the most up-to-date rating
          const { rating: userRating, totalOrders: userTotalOrders } = await fetchUserRatingData(user.id);
          setRating(userRating);
          setTotalOrders(userTotalOrders);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching owner rating:', error);
        // Fallback to cached values if database query fails
        setRating(user.rating || 5.0);
        setTotalOrders(user.totalOrders || 0);
        setIsLoading(false);
      }
    };

    fetchOwnerRating();
  }, [user?.id]);

  return { rating, totalOrders, isLoading };
}
