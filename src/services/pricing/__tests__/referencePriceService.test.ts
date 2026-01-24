import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getReferencePrices,
  getReferencePrice,
  getActiveReferencePrice,
  getReferencePriceFromProduct,
  createReferencePrice,
  updateReferencePrice,
  deleteReferencePrice,
} from '../referencePriceService';

// Mock Supabase - create factory function to avoid hoisting issues
vi.mock('../../../lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-admin-id' } }
      }),
    },
  };
  
  return {
    supabase: mockSupabase,
  };
});

describe('referencePriceService', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked supabase instance
    const { supabase } = await import('../../../lib/supabase');
    mockSupabase = supabase;
  });

  describe('getReferencePrices', () => {
    it('should fetch all reference prices from products table', async () => {
      const mockData = [
        {
          id: 'p1',
          name: 'Product 1',
          unit_price: 300,
          crate_price: 7200,
          consign_price: 3000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const result = await getReferencePrices();

      expect(mockSupabase.from).toHaveBeenCalledWith('products');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'p1',
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
        isActive: true,
      });
    });

    it('should filter by productId', async () => {
      const mockData = [
        {
          id: 'p1',
          unit_price: 300,
          crate_price: 7200,
          consign_price: 3000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: mockEq,
      });

      await getReferencePrices({ productId: 'p1' });

      expect(mockSupabase.from).toHaveBeenCalledWith('products');
      expect(mockEq).toHaveBeenCalledWith('id', 'p1');
    });

    it('should handle errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      });

      await expect(getReferencePrices()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getActiveReferencePrice', () => {
    it('should fetch reference price from products table', async () => {
      const mockData = {
        id: 'p1',
        unit_price: 300,
        crate_price: 7200,
        consign_price: 3000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      });

      const result = await getActiveReferencePrice('p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('products');
      expect(result).toMatchObject({
        id: 'p1',
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
        isActive: true,
      });
    });

    it('should fallback to RPC if not found in products table', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      });

      const rpcData = {
        unit_price: 300,
        crate_price: 7200,
        consign_price: 3000,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [rpcData],
        error: null,
      });

      const result = await getActiveReferencePrice('p1', 'zone1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_reference_price', {
        p_product_id: 'p1',
        p_zone_id: 'zone1'
      });
      expect(result).toMatchObject({
        productId: 'p1',
        zoneId: 'zone1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
      });
    });

    it('should return null if not found anywhere', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getActiveReferencePrice('p1');

      expect(result).toBeNull();
    });
  });

  describe('getReferencePriceFromProduct', () => {
    it('should fetch simplified price from products table', async () => {
      const mockData = {
        unit_price: 300,
        crate_price: 7200,
        consign_price: 3000,
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      });

      const result = await getReferencePriceFromProduct('p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('products');
      expect(result).toEqual({
        unitPrice: 300,
        cratePrice: 7200,
        consignPrice: 3000,
      });
    });

    it('should return null if product not found', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      });

      const result = await getReferencePriceFromProduct('p1');

      expect(result).toBeNull();
    });
  });

  describe('createReferencePrice', () => {
    it('should create a new reference price', async () => {
      const mockData = {
        id: '1',
        product_id: 'p1',
        reference_unit_price: 300,
        reference_crate_price: 7200,
        reference_consign_price: 3000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: mockSingle,
      });

      const input = {
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
      };

      const result = await createReferencePrice(input);

      expect(result).toMatchObject({
        id: '1',
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
      });
    });
  });

  describe('updateReferencePrice', () => {
    it('should update a reference price', async () => {
      const mockData = {
        id: '1',
        product_id: 'p1',
        reference_unit_price: 350,
        reference_crate_price: 7500,
        reference_consign_price: 3000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: mockSingle,
      });

      const input = {
        referenceUnitPrice: 350,
        referenceCratePrice: 7500,
      };

      const result = await updateReferencePrice('1', input);

      expect(result.referenceUnitPrice).toBe(350);
      expect(result.referenceCratePrice).toBe(7500);
    });
  });

  describe('deleteReferencePrice', () => {
    it('should delete a reference price', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: mockDelete,
      });

      await expect(deleteReferencePrice('1')).resolves.not.toThrow();
      expect(mockDelete).toHaveBeenCalledWith('id', '1');
    });
  });
});
