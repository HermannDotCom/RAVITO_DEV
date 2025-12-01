import { useState, useEffect } from 'react';

export function usePendingRatings(userId: string | null) {
  const [hasPendingRatings, setHasPendingRatings] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Contrainte désactivée : les utilisateurs peuvent accepter des commandes sans évaluer
    setHasPendingRatings(false);
    setLoading(false);
  }, [userId]);

  const refresh = () => {
    // Contrainte désactivée
    setHasPendingRatings(false);
    setLoading(false);
  };

  return { hasPendingRatings, loading, refresh };
}
