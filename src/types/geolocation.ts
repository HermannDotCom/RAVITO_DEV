/**
 * Geolocation and Geocoding Types
 * Types for location-based features using Leaflet and Nominatim
 */

export interface GeocodingResult {
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Re-export DeliveryLocation from index.ts for convenience
export type { DeliveryLocation } from './index';
