import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin, Navigation, Clock, Package, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox configuration - Use environment variable in production
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || (import.meta.env.MODE === 'test' ? 'test-token' : '');
if (!MAPBOX_TOKEN && import.meta.env.MODE !== 'test') {
  console.warn('VITE_MAPBOX_TOKEN not set. GPS tracking map will not be available.');
}

// Update intervals and constants
const UPDATE_INTERVAL_MS = 3000; // Update driver location every 3 seconds
const PROGRESS_MULTIPLIER = 20; // Used to calculate progress percentage from distance
const DRIVER_MARKER_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzM4NjZGRiIvPjxwYXRoIGQ9Ik0yMCAxMkwyNiAyOEgxNEwyMCAxMloiIGZpbGw9IndoaXRlIi8+PC9zdmc+';

// Driver simulation constants
const START_DISTANCE_OFFSET_LAT = 0.045; // ~5km north
const START_DISTANCE_OFFSET_LNG = 0.045; // ~5km east
const MOVEMENT_STEP_SIZE = 0.005; // ~500m per update
const MIN_DISTANCE_THRESHOLD = 0.001; // Minimum distance to keep updating

interface DeliveryTrackingProps {
  order: Order;
  onNotification?: (type: string, message: string) => void;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}

export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ 
  order, 
  onNotification 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState({
    pickedUp: false,
    fiveMinutesAway: false,
    arrived: false,
  });

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA based on distance and average speed
  const calculateETA = (distanceKm: number, speedKmh: number = 30): number => {
    return Math.round((distanceKm / speedKmh) * 60); // Return minutes
  };

  // Simulate driver location updates
  useEffect(() => {
    if (!order.coordinates || order.status !== 'delivering') return;

    // Start with a location 5km away from the destination
    const startLat = order.coordinates.lat + START_DISTANCE_OFFSET_LAT;
    const startLng = order.coordinates.lng + START_DISTANCE_OFFSET_LNG;

    let currentLat = startLat;
    let currentLng = startLng;

    const updateInterval = setInterval(() => {
      // Move towards destination
      const latDiff = order.coordinates.lat - currentLat;
      const lngDiff = order.coordinates.lng - currentLng;

      if (Math.abs(latDiff) > MIN_DISTANCE_THRESHOLD || Math.abs(lngDiff) > MIN_DISTANCE_THRESHOLD) {
        currentLat += latDiff > 0 ? Math.min(MOVEMENT_STEP_SIZE, latDiff) : Math.max(-MOVEMENT_STEP_SIZE, latDiff);
        currentLng += lngDiff > 0 ? Math.min(MOVEMENT_STEP_SIZE, lngDiff) : Math.max(-MOVEMENT_STEP_SIZE, lngDiff);

        const dist = calculateDistance(currentLat, currentLng, order.coordinates.lat, order.coordinates.lng);
        const estimatedTime = calculateETA(dist);

        setDriverLocation({
          lat: currentLat,
          lng: currentLng,
          heading: Math.atan2(lngDiff, latDiff) * (180 / Math.PI),
          speed: 30, // 30 km/h average
        });
        setDistance(dist);
        setEta(estimatedTime);

        // Send notifications at key milestones
        if (!notificationsSent.pickedUp && dist < 5) {
          setNotificationsSent(prev => ({ ...prev, pickedUp: true }));
          onNotification?.('info', '📦 Votre commande a été prise en charge par le livreur');
        }
        if (!notificationsSent.fiveMinutesAway && estimatedTime <= 5 && estimatedTime > 0) {
          setNotificationsSent(prev => ({ ...prev, fiveMinutesAway: true }));
          onNotification?.('warning', '🚚 Le livreur arrive dans 5 minutes !');
        }
        if (!notificationsSent.arrived && dist < 0.05) {
          setNotificationsSent(prev => ({ ...prev, arrived: true }));
          onNotification?.('success', '✅ Le livreur est arrivé à votre adresse');
          clearInterval(updateInterval);
        }
      } else {
        clearInterval(updateInterval);
      }
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(updateInterval);
  }, [order, onNotification, notificationsSent]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !order.coordinates || !MAPBOX_TOKEN) {
      if (!MAPBOX_TOKEN) {
        setMapError(true);
      }
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [order.coordinates.lng, order.coordinates.lat],
        zoom: 13,
      });

      // Add destination marker
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([order.coordinates.lng, order.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Adresse de livraison</h3>'))
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      setMapError(false);
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [order.coordinates]);

  // Update driver marker position
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    if (!driverMarker.current) {
      // Create driver marker with custom icon
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundImage = `url(${DRIVER_MARKER_ICON})`;
      el.style.backgroundSize = 'contain';
      el.style.transform = `rotate(${driverLocation.heading}deg)`;

      driverMarker.current = new mapboxgl.Marker(el)
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current);
    } else {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
      const el = driverMarker.current.getElement();
      el.style.transform = `rotate(${driverLocation.heading}deg)`;
    }

    // Update map bounds to show both markers
    if (order.coordinates) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([driverLocation.lng, driverLocation.lat])
        .extend([order.coordinates.lng, order.coordinates.lat]);
      
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [driverLocation, order.coordinates]);

  // Check for geolocation support
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setHasLocationPermission(false);
    }
  }, []);

  if (order.status !== 'delivering') {
    return null;
  }

  if (!hasLocationPermission) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">Service de localisation non disponible</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Votre navigateur ne supporte pas la géolocalisation. Le suivi en temps réel n'est pas disponible, 
              mais vous pouvez toujours suivre l'état de votre commande ci-dessous.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Carte non disponible</h4>
            <p className="text-sm text-blue-700 mt-1">
              La carte interactive ne peut pas être chargée pour le moment. 
              Vous pouvez toujours suivre l'état de votre commande ci-dessous.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            Suivi en temps réel
          </h3>
        </div>

        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-[400px]" />

        {/* Delivery Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distance */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="text-lg font-bold text-gray-900">
                  {distance !== null ? `${distance.toFixed(1)} km` : 'Calcul...'}
                </p>
              </div>
            </div>

            {/* ETA */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Temps estimé</p>
                <p className="text-lg font-bold text-gray-900">
                  {eta !== null ? `${eta} min` : 'Calcul...'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">État</p>
                <p className="text-lg font-bold text-green-600">En route</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {distance !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>{Math.round(Math.max(0, 100 - (distance * PROGRESS_MULTIPLIER)))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(Math.max(0, 100 - (distance * PROGRESS_MULTIPLIER)))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Notifications */}
      <div className="mt-4 space-y-2">
        {notificationsSent.pickedUp && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-800 font-medium">✓ Commande prise en charge</p>
          </div>
        )}
        {notificationsSent.fiveMinutesAway && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
            <p className="text-sm text-orange-800 font-medium">✓ Arrivée dans 5 minutes</p>
          </div>
        )}
        {notificationsSent.arrived && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-sm text-green-800 font-medium">✓ Livreur arrivé</p>
          </div>
        )}
      </div>
    </div>
  );
};
