import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { OrderProvider, useOrder } from '../OrderContext';
import { Order } from '../../types';
import * as orderService from '../../services/orderService';
import * as authContext from '../AuthContext';

// Mock the auth context
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the order service
vi.mock('../../services/orderService', () => ({
  createOrder: vi.fn(),
  getOrdersByClient: vi.fn(),
  getOrdersBySupplier: vi.fn(),
  getPendingOrders: vi.fn(),
  getAllOrders: vi.fn(),
  updateOrderStatus: vi.fn()
}));

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

// Mock email service
vi.mock('../../services/emailService', () => ({
  emailService: {
    sendDeliveryCodeEmail: vi.fn(),
    sendOrderPaidEmail: vi.fn()
  }
}));

const createMockOrder = (id: string, status: string = 'pending'): Order => ({
  id,
  clientId: 'client-1',
  supplierId: 'supplier-1',
  status: status as any,
  items: [],
  totalAmount: 1000,
  deliveryAddress: 'Test Address',
  deliveryCoordinates: { lat: 0, lng: 0 },
  paymentMethod: 'cash' as any,
  createdAt: new Date(),
  clientCommissionAmount: 50,
  supplierCommissionAmount: 50
});

describe('OrderContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin role - Duplicate prevention', () => {
    it('should deduplicate orders when pending orders are also in all orders', async () => {
      const mockPendingOrders = [
        createMockOrder('order-1', 'pending'),
        createMockOrder('order-2', 'pending')
      ];

      const mockAllOrders = [
        createMockOrder('order-1', 'pending'),
        createMockOrder('order-2', 'pending'),
        createMockOrder('order-3', 'paid'),
        createMockOrder('order-4', 'delivered')
      ];

      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' } as any,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      vi.mocked(orderService.getPendingOrders).mockResolvedValue(mockPendingOrders);
      vi.mocked(orderService.getAllOrders).mockResolvedValue(mockAllOrders);

      const { result } = renderHook(() => useOrder(), {
        wrapper: OrderProvider
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All orders should contain exactly 4 unique orders, not 6 (with duplicates)
      expect(result.current.allOrders).toHaveLength(4);
      
      // Verify each order ID appears only once
      const orderIds = result.current.allOrders.map(o => o.id);
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(4);
      expect(uniqueIds).toContain('order-1');
      expect(uniqueIds).toContain('order-2');
      expect(uniqueIds).toContain('order-3');
      expect(uniqueIds).toContain('order-4');
    });

    it('should keep the latest version of duplicate orders', async () => {
      const mockPendingOrders = [
        { ...createMockOrder('order-1', 'pending'), totalAmount: 1000 }
      ];

      const mockAllOrders = [
        { ...createMockOrder('order-1', 'pending'), totalAmount: 1500 }, // Updated version
        createMockOrder('order-2', 'paid')
      ];

      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' } as any,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      vi.mocked(orderService.getPendingOrders).mockResolvedValue(mockPendingOrders);
      vi.mocked(orderService.getAllOrders).mockResolvedValue(mockAllOrders);

      const { result } = renderHook(() => useOrder(), {
        wrapper: OrderProvider
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allOrders).toHaveLength(2);
      
      // Should keep the last version encountered (from adminAllOrders)
      const order1 = result.current.allOrders.find(o => o.id === 'order-1');
      expect(order1?.totalAmount).toBe(1500);
    });
  });

  describe('Supplier role - Optimized loading', () => {
    it('should call getOrdersBySupplier only once', async () => {
      const mockPendingOrders = [createMockOrder('order-1', 'pending')];
      const mockSupplierOrders = [
        createMockOrder('order-2', 'paid'),
        createMockOrder('order-3', 'preparing'),
        createMockOrder('order-4', 'delivering'),
        createMockOrder('order-5', 'delivered')
      ];

      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { id: 'supplier-1', role: 'supplier', email: 'supplier@test.com' } as any,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      vi.mocked(orderService.getPendingOrders).mockResolvedValue(mockPendingOrders);
      vi.mocked(orderService.getOrdersBySupplier).mockResolvedValue(mockSupplierOrders);

      const { result } = renderHook(() => useOrder(), {
        wrapper: OrderProvider
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify getOrdersBySupplier was called only once
      expect(orderService.getOrdersBySupplier).toHaveBeenCalledTimes(1);
      expect(orderService.getOrdersBySupplier).toHaveBeenCalledWith('supplier-1');

      // Verify orders are correctly filtered
      expect(result.current.availableOrders).toHaveLength(1);
      expect(result.current.supplierActiveDeliveries).toHaveLength(3); // paid, preparing, delivering
      expect(result.current.supplierCompletedDeliveries).toHaveLength(1); // delivered
    });

    it('should correctly filter active and completed deliveries', async () => {
      const mockSupplierOrders = [
        createMockOrder('order-1', 'paid'),
        createMockOrder('order-2', 'preparing'),
        createMockOrder('order-3', 'delivering'),
        createMockOrder('order-4', 'delivered'),
        createMockOrder('order-5', 'delivered')
      ];

      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { id: 'supplier-1', role: 'supplier', email: 'supplier@test.com' } as any,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      vi.mocked(orderService.getPendingOrders).mockResolvedValue([]);
      vi.mocked(orderService.getOrdersBySupplier).mockResolvedValue(mockSupplierOrders);

      const { result } = renderHook(() => useOrder(), {
        wrapper: OrderProvider
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Active deliveries should have paid, preparing, delivering
      expect(result.current.supplierActiveDeliveries).toHaveLength(3);
      expect(result.current.supplierActiveDeliveries.map(o => o.status)).toEqual(
        expect.arrayContaining(['paid', 'preparing', 'delivering'])
      );

      // Completed deliveries should have delivered
      expect(result.current.supplierCompletedDeliveries).toHaveLength(2);
      expect(result.current.supplierCompletedDeliveries.every(o => o.status === 'delivered')).toBe(true);
    });
  });

  describe('Client role - No duplicates', () => {
    it('should not have duplicates for client orders', async () => {
      const mockClientOrders = [
        createMockOrder('order-1', 'pending'),
        createMockOrder('order-2', 'paid'),
        createMockOrder('order-3', 'delivered')
      ];

      vi.mocked(authContext.useAuth).mockReturnValue({
        user: { id: 'client-1', role: 'client', email: 'client@test.com' } as any,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn()
      });

      vi.mocked(orderService.getOrdersByClient).mockResolvedValue(mockClientOrders);

      const { result } = renderHook(() => useOrder(), {
        wrapper: OrderProvider
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allOrders).toHaveLength(3);
      expect(result.current.clientOrders).toHaveLength(3);
      
      // Verify no duplicates
      const orderIds = result.current.allOrders.map(o => o.id);
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
