import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, AlertCircle, ChevronDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Zone {
  id: string;
  name: string;
  description: string | null;
}

interface ZoneSearchSelectorProps {
  value?: string;
  onChange: (zoneId: string) => void;
  required?: boolean;
  error?: string;
}

export const ZoneSearchSelector: React.FC<ZoneSearchSelectorProps> = ({
  value,
  onChange,
  required = false,
  error
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (value && zones.length > 0) {
      const zone = zones.find(z => z.id === value);
      if (zone) {
        setSelectedZone(zone);
        setSearchTerm(zone.name);
      }
    }
  }, [value, zones]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = zones.filter(zone =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredZones(filtered);
      setIsOpen(true);
    } else if (searchTerm.length === 0) {
      setFilteredZones(zones);
    } else {
      setFilteredZones([]);
      setIsOpen(false);
    }
  }, [searchTerm, zones]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadZones = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const { data, error: fetchError } = await supabase
        .from('zones')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error loading zones:', fetchError);
        setLoadError('Erreur lors du chargement des zones');
        return;
      }

      setZones(data || []);
      setFilteredZones(data || []);
    } catch (err) {
      console.error('Error in loadZones:', err);
      setLoadError('Erreur lors du chargement des zones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectZone = (zone: Zone) => {
    setSelectedZone(zone);
    setSearchTerm(zone.name);
    onChange(zone.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedZone(null);
    setSearchTerm('');
    onChange('');
    setFilteredZones(zones);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value) {
      setSelectedZone(null);
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 3 || searchTerm.length === 0) {
      setIsOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Zone de livraison (Commune) {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
          Chargement des zones...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Zone de livraison (Commune) {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {loadError}
        </div>
        <button
          type="button"
          onClick={loadZones}
          className="text-sm text-orange-600 hover:text-orange-700 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Zone de livraison (Commune) {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          Aucune zone disponible pour le moment
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Zone de livraison (Commune) {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Rechercher votre commune (min. 3 caractères)..."
            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all duration-300 ${
              error
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            }`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {isOpen && filteredZones.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {filteredZones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone)}
                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors ${
                  selectedZone?.id === zone.id ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{zone.name}</div>
                    {zone.description && (
                      <div className="text-sm text-gray-500">{zone.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && searchTerm.length >= 3 && filteredZones.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              Aucune commune trouvée pour "{searchTerm}"
            </div>
          </div>
        )}
      </div>

      {searchTerm.length > 0 && searchTerm.length < 3 && (
        <p className="text-sm text-gray-500">
          Tapez au moins 3 caractères pour rechercher...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {selectedZone && !error && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <MapPin className="h-4 w-4" />
          Zone sélectionnée: {selectedZone.name}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Sélectionnez la commune où vous souhaitez recevoir vos livraisons.
        Seuls les fournisseurs couvrant cette zone pourront traiter vos commandes.
      </p>
    </div>
  );
};
