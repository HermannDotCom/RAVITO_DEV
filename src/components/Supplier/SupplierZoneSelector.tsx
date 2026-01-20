import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Zone } from '../../types';

interface SupplierZoneSelectorProps {
  value?: string;
  onChange: (zoneId: string) => void;
  required?: boolean;
  error?: string;
}

export const SupplierZoneSelector: React.FC<SupplierZoneSelectorProps> = ({
  value,
  onChange,
  required = false,
  error
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const { data, error: fetchError } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error loading zones:', fetchError);
        setLoadError('Erreur lors du chargement des zones');
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
      console.error('Error in loadZones:', err);
      setLoadError('Erreur lors du chargement des zones');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Zone de couverture (Commune) {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
          Chargement des zones...
        </div>
      </div>
    );
  }

  if (loadError || zones.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Zone de couverture (Commune) {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {loadError || 'Aucune zone disponible'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <MapPin className="inline-block h-4 w-4 mr-1" />
        Zone de couverture (Commune) {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
          focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">Sélectionnez votre commune</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Cette adresse sera utilisée pour estimer les temps de trajet vers vos clients.
      </p>
    </div>
  );
};
