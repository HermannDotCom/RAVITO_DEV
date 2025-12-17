import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PricingProvider, usePricing } from '../PricingContext';
import * as referencePriceService from '../../services/pricing/referencePriceService';
import * as supplierPriceService from '../../services/pricing/supplierPriceService';
import * as priceAnalyticsService from '../../services/pricing/priceAnalyticsService';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'supplier' } }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock services
vi.mock('../../services/pricing/referencePriceService');
vi.mock('../../services/pricing/supplierPriceService');
vi.mock('../../services/pricing/priceAnalyticsService');

describe('PricingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => usePricing(), {
      wrapper: PricingProvider,
    });

    expect(result.current.referencePrices).toEqual([]);
    expect(result.current.supplierPriceGrids).toEqual([]);
    expect(result.current.priceAnalytics).toEqual([]);
  });

  it('should load reference prices on mount', async () => {
    const mockPrices = [
      {
        id: '1',
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(referencePriceService.getReferencePrices).mockResolvedValue(mockPrices);
    vi.mocked(supplierPriceService.getSupplierPriceGrids).mockResolvedValue([]);
    vi.mocked(priceAnalyticsService.getPriceAnalytics).mockResolvedValue([]);

    const { result } = renderHook(() => usePricing(), {
      wrapper: PricingProvider,
    });

    await waitFor(() => {
      expect(result.current.referencePrices).toHaveLength(1);
    });

    expect(result.current.referencePrices[0]).toMatchObject({
      id: '1',
      productId: 'p1',
      referenceUnitPrice: 300,
    });
  });

  it('should refresh reference prices', async () => {
    const mockPrices = [
      {
        id: '1',
        productId: 'p1',
        referenceUnitPrice: 300,
        referenceCratePrice: 7200,
        referenceConsignPrice: 3000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(referencePriceService.getReferencePrices).mockResolvedValue(mockPrices);
    vi.mocked(supplierPriceService.getSupplierPriceGrids).mockResolvedValue([]);
    vi.mocked(priceAnalyticsService.getPriceAnalytics).mockResolvedValue([]);

    const { result } = renderHook(() => usePricing(), {
      wrapper: PricingProvider,
    });

    await act(async () => {
      await result.current.refreshReferencePrices();
    });

    expect(referencePriceService.getReferencePrices).toHaveBeenCalled();
  });

  it('should get product pricing with reference and supplier prices', async () => {
    const mockReferencePrice = {
      id: '1',
      productId: 'p1',
      referenceUnitPrice: 300,
      referenceCratePrice: 7200,
      referenceConsignPrice: 3000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSupplierPrice = {
      id: '2',
      supplierId: 's1',
      productId: 'p1',
      unitPrice: 320,
      cratePrice: 7500,
      consignPrice: 3000,
      discountPercentage: 0,
      minimumOrderQuantity: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(referencePriceService.getActiveReferencePrice).mockResolvedValue(mockReferencePrice);
    vi.mocked(supplierPriceService.getActiveSupplierPriceGrid).mockResolvedValue(mockSupplierPrice);
    vi.mocked(referencePriceService.getReferencePrices).mockResolvedValue([]);
    vi.mocked(supplierPriceService.getSupplierPriceGrids).mockResolvedValue([]);
    vi.mocked(priceAnalyticsService.getPriceAnalytics).mockResolvedValue([]);

    const { result } = renderHook(() => usePricing(), {
      wrapper: PricingProvider,
    });

    let pricing;
    await act(async () => {
      pricing = await result.current.getProductPricing('p1');
    });

    expect(pricing.referencePrice).toBeDefined();
    expect(pricing.supplierPrice).toBeDefined();
    expect(pricing.variance).toBeDefined();
    
    // Variance should be approximately +4.17% ((7500-7200)/7200 * 100)
    expect(pricing.variance).toBeCloseTo(4.17, 1);
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(referencePriceService.getReferencePrices).mockRejectedValue(new Error('Network error'));
    vi.mocked(supplierPriceService.getSupplierPriceGrids).mockResolvedValue([]);
    vi.mocked(priceAnalyticsService.getPriceAnalytics).mockResolvedValue([]);

    const { result } = renderHook(() => usePricing(), {
      wrapper: PricingProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoadingReferencePrices).toBe(false);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current.referencePrices).toEqual([]);

    consoleErrorSpy.mockRestore();
  });
});
