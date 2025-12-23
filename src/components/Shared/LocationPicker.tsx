import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Search } from 'lucide-react';

// Mapbox access token - should be in environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoicmF2aXRvLWNpIiwiYSI6ImNtNTRuZjVmbjBnbWMybHM1cHFnODRxenkifQ.qK9gYZqLJOxJYJyYJYqYJQ';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  instructions: string;
}

interface LocationPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
  initialInstructions?: string;
  onLocationChange?: (location: LocationData) => void;
  readOnly?: boolean;
  height?: string;
  showSearchBar?: boolean;
  showGpsButton?: boolean;
  showInstructions?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  initialAddress = '',
  initialInstructions = '',
  onLocationChange,
  readOnly = false,
  height = '400px',
  showSearchBar = false,
  showGpsButton = false,
  showInstructions = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [latitude, setLatitude] = useState<number>(initialLatitude || 5.3364);
  const [longitude, setLongitude] = useState<number>(initialLongitude || -4.0267);
  const [address, setAddress] = useState<string>(initialAddress);
  const [instructions, setInstructions] = useState<string>(initialInstructions);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
      interactive: !readOnly
    });

    // Add navigation controls if not read-only
    if (!readOnly) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    // Add marker
    marker.current = new mapboxgl.Marker({
      draggable: !readOnly,
      color: '#ea580c'
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Handle marker drag
    if (!readOnly && marker.current) {
      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          const newLat = lngLat.lat;
          const newLng = lngLat.lng;
          setLatitude(newLat);
          setLongitude(newLng);
          reverseGeocode(newLng, newLat);
        }
      });
    }

    // Handle map click
    if (!readOnly) {
      map.current.on('click', (e) => {
        const newLat = e.lngLat.lat;
        const newLng = e.lngLat.lng;
        setLatitude(newLat);
        setLongitude(newLng);
        marker.current?.setLngLat([newLng, newLat]);
        reverseGeocode(newLng, newLat);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (map.current && marker.current && initialLatitude && initialLongitude) {
      marker.current.setLngLat([initialLongitude, initialLatitude]);
      map.current.flyTo({ center: [initialLongitude, initialLatitude], zoom: 14 });
    }
  }, [initialLatitude, initialLongitude]);

  // Notify parent of changes
  useEffect(() => {
    if (onLocationChange && !readOnly) {
      onLocationChange({
        latitude,
        longitude,
        address,
        instructions
      });
    }
  }, [latitude, longitude, address, instructions, onLocationChange, readOnly]);

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=fr`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&proximity=${longitude},${latitude}&language=fr&country=CI`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        setLatitude(lat);
        setLongitude(lng);
        setAddress(feature.place_name);
        
        marker.current?.setLngLat([lng, lat]);
        map.current?.flyTo({ center: [lng, lat], zoom: 15 });
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        
        setLatitude(newLat);
        setLongitude(newLng);
        
        marker.current?.setLngLat([newLng, newLat]);
        map.current?.flyTo({ center: [newLng, newLat], zoom: 15 });
        reverseGeocode(newLng, newLat);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Impossible d\'obtenir votre position. Veuillez vérifier les permissions.');
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      {showSearchBar && !readOnly && (
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher une adresse..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      )}

      {/* GPS button */}
      {showGpsButton && !readOnly && (
        <button
          onClick={handleGetCurrentLocation}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <Navigation className="h-4 w-4 text-orange-600" />
          <span>Utiliser ma position actuelle</span>
        </button>
      )}

      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden border border-gray-300"
        style={{ height }}
      />

      {/* Address display */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-start space-x-2">
          <MapPin className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">Adresse sélectionnée</p>
            {!readOnly ? (
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                placeholder="Affinez l'adresse si nécessaire..."
              />
            ) : (
              <p className="text-sm text-gray-700">{address || 'Aucune adresse spécifiée'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery instructions */}
      {showInstructions && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            Instructions de livraison (optionnel)
          </label>
          {!readOnly ? (
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              placeholder="Ex: Porte bleue, 2ème étage, sonner 3 fois..."
            />
          ) : (
            instructions && <p className="text-sm text-blue-800">{instructions}</p>
          )}
        </div>
      )}

      {/* Coordinates display (for debugging/verification) */}
      {!readOnly && (
        <div className="text-xs text-gray-500">
          Coordonnées: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
};
