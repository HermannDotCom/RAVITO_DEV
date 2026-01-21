import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useGeocoding } from '../../../hooks/useGeocoding';
import { GeocodingResult } from '../../../types/geolocation';
import './LocationPicker.css';

// Default center: Abidjan, Côte d'Ivoire
const DEFAULT_CENTER: [number, number] = [5.3600, -4.0083];
const DEFAULT_ZOOM = 13;

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LocationPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
  initialInstructions?: string;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    address: string;
    instructions: string;
  }) => void;
  readOnly?: boolean;
  showSearchBar?: boolean;
  showGpsButton?: boolean;
  showInstructions?: boolean;
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  instructionsLabel?: string;
  instructionsPlaceholder?: string;
}

// Component to handle map events
const MapEventHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
  readOnly?: boolean;
}> = ({ onMapClick, readOnly }) => {
  useMapEvents({
    click: (e) => {
      if (!readOnly) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Component to handle map recenter
const MapRecenter: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  initialAddress = '',
  initialInstructions = '',
  onLocationChange,
  readOnly = false,
  showSearchBar = true,
  showGpsButton = true,
  showInstructions = true,
  height = '400px',
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  instructionsLabel = 'Indications pour le livreur',
  instructionsPlaceholder = 'Ex: Porte jaune, derrière la boutique bleue...',
}) => {
  // State
  const [position, setPosition] = useState<[number, number]>(
    initialLatitude && initialLongitude
      ? [initialLatitude, initialLongitude]
      : defaultCenter
  );
  const [address, setAddress] = useState(initialAddress);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Hooks
  const { 
    position: gpsPosition, 
    error: gpsError, 
    loading: gpsLoading, 
    getCurrentPosition 
  } = useGeolocation();
  
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    reverseGeocode,
    clearResults
  } = useGeocoding();

  // Notify parent component of location changes
  const notifyLocationChange = useCallback((lat: number, lng: number, addr: string, instr: string) => {
    onLocationChange({
      latitude: lat,
      longitude: lng,
      address: addr,
      instructions: instr,
    });
  }, [onLocationChange]);

  // Update position when GPS position is obtained
  useEffect(() => {
    if (gpsPosition) {
      const newPosition: [number, number] = [gpsPosition.latitude, gpsPosition.longitude];
      setPosition(newPosition);
      
      // Get address for the new position
      reverseGeocode(gpsPosition.latitude, gpsPosition.longitude).then((addr) => {
        setAddress(addr);
        notifyLocationChange(gpsPosition.latitude, gpsPosition.longitude, addr, instructions);
      });
    }
  }, [gpsPosition, instructions, reverseGeocode, notifyLocationChange]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      search(value);
      setShowResults(true);
    } else {
      clearResults();
      setShowResults(false);
    }
  }, [search, clearResults]);

  // Handle result selection
  const handleResultSelect = useCallback((result: GeocodingResult) => {
    const newPosition: [number, number] = [result.latitude, result.longitude];
    setPosition(newPosition);
    setAddress(result.displayName);
    setSearchQuery('');
    setShowResults(false);
    clearResults();
    notifyLocationChange(result.latitude, result.longitude, result.displayName, instructions);
  }, [instructions, clearResults, notifyLocationChange]);

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    
    // Get address for clicked position
    reverseGeocode(lat, lng).then((addr) => {
      setAddress(addr);
      notifyLocationChange(lat, lng, addr, instructions);
    });
  }, [instructions, reverseGeocode, notifyLocationChange]);

  // Handle marker drag
  const handleMarkerDrag = useCallback((e: L.DragEndEvent) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    const newPosition: [number, number] = [newPos.lat, newPos.lng];
    setPosition(newPosition);
    
    // Get address for new position
    reverseGeocode(newPos.lat, newPos.lng).then((addr) => {
      setAddress(addr);
      notifyLocationChange(newPos.lat, newPos.lng, addr, instructions);
    });
  }, [instructions, reverseGeocode, notifyLocationChange]);

  // Handle instructions change
  const handleInstructionsChange = useCallback((value: string) => {
    setInstructions(value);
    notifyLocationChange(position[0], position[1], address, value);
  }, [position, address, notifyLocationChange]);

  return (
    <div className="location-picker-container">
      {/* Search Bar */}
      {showSearchBar && !readOnly && (
        <div className="location-picker-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher un lieu..."
            className="w-full"
          />
          
          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="location-picker-results">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="location-picker-result-item"
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{result.displayName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchLoading && (
            <div className="location-picker-results">
              <div className="location-picker-result-item">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Recherche en cours...</span>
                </div>
              </div>
            </div>
          )}
          
          {searchError && (
            <div className="location-picker-error mt-2">
              {searchError}
            </div>
          )}
        </div>
      )}

      {/* GPS Button */}
      {showGpsButton && !readOnly && (
        <button
          onClick={getCurrentPosition}
          disabled={gpsLoading}
          className={`location-picker-gps-button ${gpsLoading ? 'loading' : ''}`}
        >
          {gpsLoading ? (
            <>
              <Loader2 className="h-4 w-4" />
              <span>Localisation en cours...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              <span>Me localiser</span>
            </>
          )}
        </button>
      )}

      {/* GPS Error */}
      {gpsError && (
        <div className="location-picker-error">
          {gpsError.message}
        </div>
      )}

      {/* Map */}
      <div className="location-picker-map" style={{ height }}>
        <MapContainer
          center={position}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={!readOnly}
          dragging={!readOnly}
          scrollWheelZoom={!readOnly}
          doubleClickZoom={!readOnly}
          touchZoom={!readOnly}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker
            position={position}
            draggable={!readOnly}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
          />
          
          <MapEventHandler onMapClick={handleMapClick} readOnly={readOnly} />
          <MapRecenter center={position} zoom={defaultZoom} />
        </MapContainer>
      </div>

      {/* Current Address Display */}
      {address && (
        <div className="location-picker-info">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Adresse sélectionnée:</strong>
              <br />
              {address}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Instructions */}
      {showInstructions && (
        <div className="location-picker-instructions">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {instructionsLabel}
          </label>
          <textarea
            value={instructions}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            placeholder={instructionsPlaceholder}
            disabled={readOnly}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
