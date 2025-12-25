import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePendingRatings(userId: string | null) {
  const [hasPendingRatings, setHasPendingRatings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setHasPendingRatings(false);
      setLoading(false);
      return;
    }

    checkPendingRatings();
  }, [userId]);

  const checkPendingRatings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.rpc('has_pending_ratings', {
        user_id: userId
      });

      if (error) {
        console.error('Error checking pending ratings:', error);
        setHasPendingRatings(false);
      } else {
        setHasPendingRatings(data || false);
      }
    } catch (error) {
      console.error('Exception checking pending ratings:', error);
      setHasPendingRatings(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    checkPendingRatings();
  };

  return { hasPendingRatings, loading, refresh };
}
