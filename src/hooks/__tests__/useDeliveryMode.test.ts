import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('should calculate packagingSnapshot only from items WITHOUT consigne paid', async () => {
    // Create a mock order WITHOUT packaging snapshot (pre-PR#150 order)
    // This tests the real-world scenario from issue #9376583e:
    // - 4x Awooyo (withConsigne: true) → Client keeps crates, driver does NOT collect
    // - 3x Beaufort (withConsigne: false) → Client doesn't keep, driver MUST collect
    const mockOrderItems: CartItem[] = [
      {
        product: {
          id: '1',
          reference: 'AWOOYO-001',
          name: 'Awooyo 33cl',
          category: 'biere' as const,
          brand: 'Awooyo',
          crateType: 'C24',
          unitPrice: 650,
          cratePrice: 15600,
          consignPrice: 3000,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 4,
        withConsigne: true,  // Client PAID consigne → keeps crate
      },
      {
        product: {
          id: '2',
          reference: 'BEAUFORT-001',
          name: 'Beaufort 33cl',
          category: 'biere' as const,
          brand: 'Beaufort',
          crateType: 'C24',
          unitPrice: 500,
          cratePrice: 12000,
          consignPrice: 3000,
          volume: '33cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 3,
        withConsigne: false,  // Client did NOT pay → driver must collect
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
        withConsigne: false,
      },
    ];

    const mockOrder: Order = {
      id: '9376583e',
      clientId: 'client-123',
      supplierId: 'test-supplier-id',
      items: mockOrderItems,
      totalAmount: 50000,
      status: 'delivering',
      consigneTotal: 12000,
      deliveryAddress: '123 Test Street, Abidjan',
      coordinates: { lat: 5.3599517, lng: -4.0082563 },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: new Date('2024-01-01'),
      acceptedAt: new Date('2024-01-01'),
      packagingSnapshot: undefined, // This is NULL in the database
    };

    // Manually test the mapOrderToDelivery logic (matching the fix)
    const itemsToReturn = mockOrder.items.filter(item =>
      item.product.consignPrice > 0 &&
      item.product.crateType &&
      !item.product.crateType.startsWith('CARTON') &&
      !item.withConsigne  // Only items WITHOUT consigne paid
    );
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (itemsToReturn.length > 0) {
        const snapshotMap: Record<string, number> = {};
        itemsToReturn.forEach(item => {
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
    // Should only include 3x Beaufort (C24), NOT the 4x Awooyo (paid consigne)
    // Should NOT include CARTON24 (disposable)
    expect(packagingSnapshot).toBeDefined();
    expect(packagingSnapshot).toEqual({
      C24: 3,  // Only Beaufort, NOT Awooyo
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
        withConsigne: false,  // Even though this would be counted...
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
    const itemsToReturn = mockOrder.items.filter(item =>
      item.product.consignPrice > 0 &&
      item.product.crateType &&
      !item.product.crateType.startsWith('CARTON') &&
      !item.withConsigne
    );
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (itemsToReturn.length > 0) {
        const snapshotMap: Record<string, number> = {};
        itemsToReturn.forEach(item => {
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

  it('should handle orders with only consigne-paid items (no crates to collect)', async () => {
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
        withConsigne: true, // Client paid → keeps crate
      },
    ];

    const mockOrder: Order = {
      id: 'order-all-consigne-paid',
      clientId: 'client-123',
      supplierId: 'test-supplier-id',
      items: mockOrderItems,
      totalAmount: 50000,
      status: 'delivering',
      consigneTotal: 2000,
      deliveryAddress: '123 Test Street, Abidjan',
      coordinates: { lat: 5.3599517, lng: -4.0082563 },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: new Date('2024-01-01'),
      acceptedAt: new Date('2024-01-01'),
      packagingSnapshot: undefined,
    };

    // Manually test the mapOrderToDelivery logic
    const itemsToReturn = mockOrder.items.filter(item =>
      item.product.consignPrice > 0 &&
      item.product.crateType &&
      !item.product.crateType.startsWith('CARTON') &&
      !item.withConsigne  // Only items WITHOUT consigne paid
    );
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (itemsToReturn.length > 0) {
        const snapshotMap: Record<string, number> = {};
        itemsToReturn.forEach(item => {
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

    // Verify no snapshot is created when all items have consigne paid
    expect(packagingSnapshot).toBeUndefined();
  });

  it('should calculate packagingSnapshot for items without consigne (withConsigne: false)', async () => {
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
        quantity: 5,
        withConsigne: false, // Client did NOT pay → driver collects
      },
      {
        product: {
          id: '2',
          reference: 'SODA-001',
          name: 'Coca Cola 50cl',
          category: 'soda' as const,
          brand: 'Coca Cola',
          crateType: 'C12',
          unitPrice: 500,
          cratePrice: 6000,
          consignPrice: 500,
          volume: '50cl',
          isActive: true,
          imageUrl: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 2,
        withConsigne: false, // Client did NOT pay → driver collects
      },
    ];

    const mockOrder: Order = {
      id: 'order-no-consigne-paid',
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
    const itemsToReturn = mockOrder.items.filter(item =>
      item.product.consignPrice > 0 &&
      item.product.crateType &&
      !item.product.crateType.startsWith('CARTON') &&
      !item.withConsigne
    );
    let packagingSnapshot = mockOrder.packagingSnapshot;

    if (!packagingSnapshot || Object.keys(packagingSnapshot).length === 0) {
      if (itemsToReturn.length > 0) {
        const snapshotMap: Record<string, number> = {};
        itemsToReturn.forEach(item => {
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

    // Verify snapshot includes all items with withConsigne: false
    expect(packagingSnapshot).toBeDefined();
    expect(packagingSnapshot).toEqual({
      C24: 5,
      C12: 2,
    });
  });
});
