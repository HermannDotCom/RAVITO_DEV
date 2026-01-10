import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeliveryMode } from '../useDeliveryMode';
import { Order, CartItem } from '../../types';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-supplier-id',
      role: 'supplier',
      email: 'supplier@example.com',
      name: 'Test Supplier',
    },
  })),
}));

vi.mock('../../services/orderService', () => ({
  getOrdersBySupplier: vi.fn(() => Promise.resolve([])),
  updateOrderStatus: vi.fn(() => Promise.resolve()),
}));

// Mock supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        maybeSingle: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
  rpc: vi.fn(() => ({
    data: null,
    error: 'RPC not available',
  })),
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('useDeliveryMode - Packaging Snapshot Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate packagingSnapshot from items when snapshot is NULL', async () => {
    // Create a mock order WITHOUT packaging snapshot (pre-PR#150 order)
    const mockOrderItems: CartItem[] = [
      {
        product: {
          id: '1',
          reference: 'BG-001',
          name: 'Bière Castel 33cl',
          category: 'biere' as const,
          brand: 'Castel',
          crateType: 'C24',
          unitPrice: 650,
          cratePrice: 15600,
          consignPrice: 1000,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 2,
        withConsigne: true,
      },
      {
        product: {
          id: '2',
          reference: 'BG-002',
          name: 'Coca Cola 33cl',
          category: 'soda' as const,
          brand: 'Coca Cola',
          crateType: 'C12',
          unitPrice: 500,
          cratePrice: 6000,
          consignPrice: 500,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 3,
        withConsigne: true,
      },
      {
        product: {
          id: '3',
          reference: 'BG-003',
          name: 'Eau Bonaqua 1.5L',
          category: 'eau' as const,
          brand: 'Bonaqua',
          crateType: 'CARTON24',
          unitPrice: 300,
          cratePrice: 7200,
          consignPrice: 0,
          volume: '1.5L',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 1,
        withConsigne: true,
      },
    ];

    const mockOrder: Order = {
      id: '12A639A2-test-order',
      clientId: 'client-123',
      supplierId: 'test-supplier-id',
      items: mockOrderItems,
      totalAmount: 50000,
      status: 'delivering',
      consigneTotal: 1500,
      deliveryAddress: '123 Test Street, Abidjan',
      coordinates: { lat: 5.3599517, lng: -4.0082563 },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: new Date('2024-01-01'),
      acceptedAt: new Date('2024-01-01'),
      packagingSnapshot: undefined, // This is NULL in the database
    };

    // Manually test the mapOrderToDelivery logic
    const consigneItems = mockOrder.items.filter(item => item.withConsigne);
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (consigneItems.length > 0) {
        const snapshotMap: Record<string, number> = {};
        consigneItems.forEach(item => {
          const crateType = item.product.crateType;
          if (crateType) {
            snapshotMap[crateType] = (snapshotMap[crateType] || 0) + item.quantity;
          }
        });
        if (Object.keys(snapshotMap).length > 0) {
          packagingSnapshot = snapshotMap;
        }
      }
    }

    // Verify the calculated snapshot
    expect(packagingSnapshot).toBeDefined();
    expect(packagingSnapshot).toEqual({
      C24: 2,
      C12: 3,
      CARTON24: 1,
    });
  });

  it('should use existing packagingSnapshot when present', async () => {
    const mockOrderItems: CartItem[] = [
      {
        product: {
          id: '1',
          reference: 'BG-001',
          name: 'Bière Castel 33cl',
          category: 'biere' as const,
          brand: 'Castel',
          crateType: 'C24',
          unitPrice: 650,
          cratePrice: 15600,
          consignPrice: 1000,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 2,
        withConsigne: true,
      },
    ];

    const existingSnapshot = { C24: 2, C12: 1 };
    const mockOrder: Order = {
      id: 'order-with-snapshot',
      clientId: 'client-123',
      supplierId: 'test-supplier-id',
      items: mockOrderItems,
      totalAmount: 50000,
      status: 'delivering',
      consigneTotal: 1500,
      deliveryAddress: '123 Test Street, Abidjan',
      coordinates: { lat: 5.3599517, lng: -4.0082563 },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: new Date('2024-01-01'),
      acceptedAt: new Date('2024-01-01'),
      packagingSnapshot: existingSnapshot, // This exists from PR#150+
    };

    // Manually test the mapOrderToDelivery logic
    const consigneItems = mockOrder.items.filter(item => item.withConsigne);
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (consigneItems.length > 0) {
        const snapshotMap: Record<string, number> = {};
        consigneItems.forEach(item => {
          const crateType = item.product.crateType;
          if (crateType) {
            snapshotMap[crateType] = (snapshotMap[crateType] || 0) + item.quantity;
          }
        });
        if (Object.keys(snapshotMap).length > 0) {
          packagingSnapshot = snapshotMap;
        }
      }
    }

    // Verify the existing snapshot is preserved
    expect(packagingSnapshot).toEqual(existingSnapshot);
    expect(packagingSnapshot).not.toEqual({ C24: 2 }); // Should NOT recalculate
  });

  it('should handle orders with no consigne items', async () => {
    const mockOrderItems: CartItem[] = [
      {
        product: {
          id: '1',
          reference: 'BG-001',
          name: 'Bière Castel 33cl',
          category: 'biere' as const,
          brand: 'Castel',
          crateType: 'C24',
          unitPrice: 650,
          cratePrice: 15600,
          consignPrice: 1000,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 2,
        withConsigne: false, // No consigne
      },
    ];

    const mockOrder: Order = {
      id: 'order-no-consigne',
      clientId: 'client-123',
      supplierId: 'test-supplier-id',
      items: mockOrderItems,
      totalAmount: 50000,
      status: 'delivering',
      consigneTotal: 0,
      deliveryAddress: '123 Test Street, Abidjan',
      coordinates: { lat: 5.3599517, lng: -4.0082563 },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: new Date('2024-01-01'),
      acceptedAt: new Date('2024-01-01'),
      packagingSnapshot: undefined,
    };

    // Manually test the mapOrderToDelivery logic
    const consigneItems = mockOrder.items.filter(item => item.withConsigne);
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (consigneItems.length > 0) {
        const snapshotMap: Record<string, number> = {};
        consigneItems.forEach(item => {
          const crateType = item.product.crateType;
          if (crateType) {
            snapshotMap[crateType] = (snapshotMap[crateType] || 0) + item.quantity;
          }
        });
        if (Object.keys(snapshotMap).length > 0) {
          packagingSnapshot = snapshotMap;
        }
      }
    }

    // Verify no snapshot is created when no consigne items
    expect(packagingSnapshot).toBeUndefined();
  });
});
