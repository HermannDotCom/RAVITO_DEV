import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { CommissionProvider, useCommission } from '../CommissionContext';
import { CartItem, Product } from '../../types';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          client_commission_percentage: 4,
          supplier_commission_percentage: 1,
        },
        error: null,
      }),
    })),
  },
}));

const mockProduct: Product = {
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
};

const mockCartItem: CartItem = {
  id: '1',
  product: mockProduct,
  quantity: 2,
  withConsigne: false,
};

describe('CommissionContext', () => {
  it('should initialize with default commission settings', async () => {
    const { result } = renderHook(() => useCommission(), {
      wrapper: CommissionProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.commissionSettings.clientCommission).toBe(4);
    expect(result.current.commissionSettings.supplierCommission).toBe(1);
  });

  it('should calculate cart total with commission correctly', async () => {
    const { result } = renderHook(() => useCommission(), {
      wrapper: CommissionProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const cart = [mockCartItem];
    const cartSubtotal = mockCartItem.product.cratePrice * mockCartItem.quantity;
    const cartConsigneTotal = 0;

    const totals = result.current.getCartTotalWithCommission(cart, cartSubtotal, cartConsigneTotal);

    expect(totals.subtotal).toBe(cartSubtotal);
    expect(totals.consigneTotal).toBe(0);
    expect(totals.clientCommission).toBe(Math.round(cartSubtotal * 0.04));
    expect(totals.total).toBe(cartSubtotal + totals.clientCommission);
  });

  it('should calculate supplier net amount correctly', async () => {
    const { result } = renderHook(() => useCommission(), {
      wrapper: CommissionProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const orderAmount = 50000;
    const netCalculation = result.current.getSupplierNetAmount(orderAmount);

    const expectedBaseAmount = orderAmount / (1 + 0.04);
    const expectedCommission = Math.round(expectedBaseAmount * 0.01);
    const expectedNetAmount = orderAmount - expectedCommission;

    expect(netCalculation.grossAmount).toBeCloseTo(expectedBaseAmount, 0);
    expect(netCalculation.commission).toBe(expectedCommission);
    expect(netCalculation.netAmount).toBe(expectedNetAmount);
  });

  it('should include consigne in total when present', async () => {
    const { result } = renderHook(() => useCommission(), {
      wrapper: CommissionProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const cartWithConsigne: CartItem = { ...mockCartItem, withConsigne: true };
    const cart = [cartWithConsigne];
    const cartSubtotal = mockCartItem.product.cratePrice * mockCartItem.quantity;
    const cartConsigneTotal = mockCartItem.product.consignPrice * mockCartItem.quantity;

    const totals = result.current.getCartTotalWithCommission(cart, cartSubtotal, cartConsigneTotal);

    expect(totals.consigneTotal).toBe(cartConsigneTotal);
    expect(totals.total).toBe(cartSubtotal + cartConsigneTotal + totals.clientCommission);
  });
});
