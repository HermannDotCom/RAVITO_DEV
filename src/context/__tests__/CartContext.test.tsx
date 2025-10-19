import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { Product } from '../../types';

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

describe('CartContext', () => {
  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.cart).toEqual([]);
    const totals = result.current.getCartTotal();
    expect(totals.subtotal).toBe(0);
    expect(totals.consigneTotal).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, true);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toMatchObject({
      product: mockProduct,
      quantity: 2,
      withConsigne: true,
    });
  });

  it('should calculate total amount correctly without consigne', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
    });

    const totals = result.current.getCartTotal();
    const expectedSubtotal = mockProduct.cratePrice * 2;
    expect(totals.subtotal).toBe(expectedSubtotal);
    expect(totals.consigneTotal).toBe(0);
    expect(totals.total).toBe(expectedSubtotal);
  });

  it('should calculate total amount correctly with consigne', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, true);
    });

    const totals = result.current.getCartTotal();
    const expectedSubtotal = mockProduct.cratePrice * 2;
    const expectedConsigne = mockProduct.consignPrice * 2;
    expect(totals.subtotal).toBe(expectedSubtotal);
    expect(totals.consigneTotal).toBe(expectedConsigne);
    expect(totals.total).toBe(expectedSubtotal + expectedConsigne);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
    });

    const productId = result.current.cart[0].product.id;

    act(() => {
      result.current.updateCartItem(productId, 5);
    });

    expect(result.current.cart[0].quantity).toBe(5);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
    });

    const productId = result.current.cart[0].product.id;

    act(() => {
      result.current.removeFromCart(productId);
    });

    expect(result.current.cart).toHaveLength(0);
  });

  it('should toggle consigne for item', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
    });

    const productId = result.current.cart[0].product.id;

    act(() => {
      result.current.updateCartItem(productId, 2, true);
    });

    expect(result.current.cart[0].withConsigne).toBe(true);

    act(() => {
      result.current.updateCartItem(productId, 2, false);
    });

    expect(result.current.cart[0].withConsigne).toBe(false);
  });

  it('should clear entire cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
      result.current.addToCart({ ...mockProduct, id: '2' }, 3, true);
    });

    expect(result.current.cart).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.cart).toHaveLength(0);
    const totals = result.current.getCartTotal();
    expect(totals.total).toBe(0);
  });

  it('should accumulate quantities when adding same product', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addToCart(mockProduct, 2, false);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);

    act(() => {
      result.current.addToCart(mockProduct, 3, false);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(5);
  });
});
