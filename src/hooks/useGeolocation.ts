import { useState, useCallback } from 'react';
import { GeolocationPosition, GeolocationError } from '../types/geolocation';

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentPosition: () => void;
}

/**
 * Hook for accessing browser geolocation API
 * Wraps navigator.geolocation.getCurrentPosition with React state management
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'La géolocalisation n\'est pas disponible sur cet appareil'
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLoading(false);
      },
      (err) => {
        let message = 'Impossible d\'obtenir votre position';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Vous avez refusé l\'accès à votre position. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Votre position n\'est pas disponible. Vérifiez que le GPS est activé.';
            break;
          case err.TIMEOUT:
            message = 'La demande de géolocalisation a expiré. Veuillez réessayer.';
            break;
        }

        setError({
          code: err.code,
          message
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition
  };
};
