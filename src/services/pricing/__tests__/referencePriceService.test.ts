import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getReferencePrices,
  getReferencePrice,
  createReferencePrice,
  updateReferencePrice,
  deleteReferencePrice,
} from '../referencePriceService';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-admin-id' } }
    }),
  },
};

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('referencePriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReferencePrices', () => {
    it('should fetch all reference prices', async () => {
      const mockData = [
        {
          id: '1',
          product_id: 'p1',
          reference_unit_price: 300,
          reference_crate_price: 7200,
          reference_consign_price: 3000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: vi.fn().mockReturnThis(),
      });

      const result = await getReferencePrices();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
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
          id: '1',
          product_id: 'p1',
          reference_unit_price: 300,
          reference_crate_price: 7200,
          reference_consign_price: 3000,
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

      expect(mockEq).toHaveBeenCalledWith('product_id', 'p1');
    });

    it('should handle errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(getReferencePrices()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
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
