import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Zone } from '../types';

export const useZones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('zones')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          console.error('Error loading zones:', fetchError);
          setError('Erreur lors du chargement des zones');
          return;
        }

        const mappedZones: Zone[] = (data || []).map((zone) => ({
          id: zone.id,
          name: zone.name,
          description: zone.description,
          isActive: zone.is_active,
          createdAt: new Date(zone.created_at)
        }));

        setZones(mappedZones);
      } catch (err) {
        console.error('Exception in fetchZones:', err);
        setError('Erreur lors du chargement des zones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, []);

  return { zones, isLoading, error };
};
