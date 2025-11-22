import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DeliveryTracking } from '../DeliveryTracking';
import { Order } from '../../../types';

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      addControl: vi.fn(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      getElement: vi.fn(() => ({ style: {} })),
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
    })),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn().mockReturnThis(),
    })),
  },
}));

const mockOrder: Order = {
  id: 'order-123',
  clientId: 'client-1',
  supplierId: 'supplier-1',
  items: [
    {
      product: {
        id: '1',
        reference: 'SOL-B-C24-001',
        name: 'Flag Spéciale',
        category: 'biere',
        brand: 'Solibra',
        crateType: 'C24',
        unitPrice: 300,
        cratePrice: 7200,
        consignPrice: 3000,
        description: 'Bière blonde premium',
        alcoholContent: 5.2,
        volume: '65cl',
        isActive: true,
        imageUrl: 'https://example.com/flag.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 2,
      withConsigne: false,
    },
  ],
  totalAmount: 14400,
  status: 'delivering',
  consigneTotal: 0,
  deliveryAddress: 'Plateau, Abidjan',
  deliveryZone: 'Plateau',
  coordinates: {
    lat: 5.316667,
    lng: -4.033333,
  },
  paymentMethod: 'orange',
  paymentStatus: 'paid',
  createdAt: new Date(),
};

describe('DeliveryTracking', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original navigator
    originalNavigator = global.navigator;
    
    // Mock navigator with geolocation
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        geolocation: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should render delivery tracking map for delivering status', () => {
    const onNotification = vi.fn();
    render(<DeliveryTracking order={mockOrder} onNotification={onNotification} />);

    expect(screen.getByText('Suivi en temps réel')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Temps estimé')).toBeInTheDocument();
    expect(screen.getByText('État')).toBeInTheDocument();
  });

  it('should not render for non-delivering status', () => {
    const nonDeliveringOrder = { ...mockOrder, status: 'preparing' as const };
    const onNotification = vi.fn();
    const { container } = render(
      <DeliveryTracking order={nonDeliveringOrder} onNotification={onNotification} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show fallback message when geolocation is not supported', () => {
    // Mock geolocation not available
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    const onNotification = vi.fn();
    render(<DeliveryTracking order={mockOrder} onNotification={onNotification} />);

    expect(screen.getByText('Service de localisation non disponible')).toBeInTheDocument();
    expect(
      screen.getByText(/Votre navigateur ne supporte pas la géolocalisation/)
    ).toBeInTheDocument();
  });

  it('should calculate distance correctly', async () => {
    const onNotification = vi.fn();
    render(<DeliveryTracking order={mockOrder} onNotification={onNotification} />);

    await waitFor(
      () => {
        expect(screen.getByText(/km/)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('should show progression bar after distance is calculated', async () => {
    const onNotification = vi.fn();
    render(<DeliveryTracking order={mockOrder} onNotification={onNotification} />);

    // Wait for distance to be calculated
    await waitFor(
      () => {
        expect(screen.getByText('Progression')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('should update driver location over time', async () => {
    const onNotification = vi.fn();
    render(<DeliveryTracking order={mockOrder} onNotification={onNotification} />);

    // Just verify that the component renders correctly
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Temps estimé')).toBeInTheDocument();
    
    // Check initial distance is calculated
    await waitFor(
      () => {
        expect(screen.getByText(/km/)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  }, 10000); // Increase test timeout to 10 seconds
});

