import { useState, useCallback, useRef, useEffect } from 'react';
import { GeocodingResult } from '../types/geolocation';

// Get version from environment or use a fallback
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.5.4';

const NOMINATIM_CONFIG = {
  baseUrl: 'https://nominatim.openstreetmap.org',
  params: {
    format: 'json',
    countrycodes: 'ci',
    limit: 5,
    addressdetails: 1,
    'accept-language': 'fr'
  },
  headers: {
    'User-Agent': `RAVITO-App/${APP_VERSION}`
  }
};

interface UseGeocodingReturn {
  results: GeocodingResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  reverseGeocode: (latitude: number, longitude: number) => Promise<string>;
  clearResults: () => void;
}

/**
 * Hook for geocoding operations using Nominatim API
 * Includes automatic debouncing to respect API rate limits
 */
export const useGeocoding = (): UseGeocodingReturn => {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const search = useCallback((query: string) => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear previous results if query is empty
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Debounce for 500ms to respect Nominatim rate limits
    debounceTimer.current = setTimeout(async () => {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      
      abortController.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          ...NOMINATIM_CONFIG.params,
          q: query
        });

        const response = await fetch(
          `${NOMINATIM_CONFIG.baseUrl}/search?${params}`,
          {
            headers: NOMINATIM_CONFIG.headers,
            signal: abortController.current.signal
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche');
        }

        const data = await response.json();
        
        const mappedResults: GeocodingResult[] = data.map((item: any) => ({
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type
        }));

        setResults(mappedResults);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Impossible de rechercher l\'adresse. Veuillez réessayer.');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce
  }, []);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<string> => {
      try {
        const params = new URLSearchParams({
          ...NOMINATIM_CONFIG.params,
          lat: latitude.toString(),
          lon: longitude.toString()
        });

        const response = await fetch(
          `${NOMINATIM_CONFIG.baseUrl}/reverse?${params}`,
          {
            headers: NOMINATIM_CONFIG.headers
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors du géocodage inversé');
        }

        const data = await response.json();
        return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    reverseGeocode,
    clearResults
  };
};
