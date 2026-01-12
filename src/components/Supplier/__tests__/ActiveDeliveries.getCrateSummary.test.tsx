import { describe, it, expect } from 'vitest';
import { Order, CrateType } from '../../../types';

// Extract the getCrateSummary logic for testing
function getCrateSummary(order: Order) {
  const crateSummary: { [key: string]: { withConsigne: number; toReturn: number } } = {
    B33: { withConsigne: 0, toReturn: 0 },
    B65: { withConsigne: 0, toReturn: 0 },
    B100: { withConsigne: 0, toReturn: 0 },
    B50V: { withConsigne: 0, toReturn: 0 },
    B100V: { withConsigne: 0, toReturn: 0 }
  };
  
  // Verify that order.items exists and is an array
  if (!order.items || !Array.isArray(order.items)) {
    return crateSummary;
  }
  
  order.items.forEach(item => {
    // Triple verification: item exists, product exists, crateType exists and is valid
    if (!item || !item.product) return;
    
    const crateType = item.product.crateType;
    
    // Verify that the crateType is a valid key of crateSummary
    if (!crateType || !(crateType in crateSummary)) return;
    
    const quantity = item.quantity || 0;
    
    if (item.withConsigne) {
      crateSummary[crateType].withConsigne += quantity;
    } else {
      crateSummary[crateType].toReturn += quantity;
    }
  });
  return crateSummary;
}

describe('ActiveDeliveries - getCrateSummary', () => {
  const mockProduct = {
    id: 'prod-1',
    reference: 'REF-001',
    name: 'Test Product',
    category: 'biere' as const,
    brand: 'Test Brand',
    crateType: 'B33' as CrateType,
    unitPrice: 1000,
    cratePrice: 24000,
    consignPrice: 3000,
    volume: '33cl',
    isActive: true,
    imageUrl: 'test.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const baseOrder: Order = {
    id: 'order-1',
    clientId: 'client-1',
    supplierId: 'supplier-1',
    items: [],
    totalAmount: 24000,
    status: 'paid',
    consigneTotal: 0,
    deliveryAddress: 'Test Address',
    coordinates: { lat: 0, lng: 0 },
    paymentMethod: 'orange',
    createdAt: new Date()
  };

  it('should handle order with undefined items', () => {
    const order = { ...baseOrder, items: undefined as any };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
    expect(result.B65).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle order with null items', () => {
    const order = { ...baseOrder, items: null as any };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
    expect(result.B65).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle item with undefined product', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: undefined as any, quantity: 10, withConsigne: false }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle item with null product', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: null as any, quantity: 10, withConsigne: false }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle product with invalid crateType', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        {
          product: { ...mockProduct, crateType: 'INVALID' as any },
          quantity: 10,
          withConsigne: false
        }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle item with undefined quantity', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        {
          product: mockProduct,
          quantity: undefined as any,
          withConsigne: false
        }
      ]
    };
    const result = getCrateSummary(order);
    
    // Should default quantity to 0
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should correctly count items with consigne', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: mockProduct, quantity: 5, withConsigne: true }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 5, toReturn: 0 });
  });

  it('should correctly count items without consigne', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: mockProduct, quantity: 3, withConsigne: false }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 0, toReturn: 3 });
  });

  it('should handle mixed items with different crate types', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: { ...mockProduct, crateType: 'B33' }, quantity: 5, withConsigne: true },
        { product: { ...mockProduct, crateType: 'B33' }, quantity: 3, withConsigne: false },
        { product: { ...mockProduct, crateType: 'B65' }, quantity: 2, withConsigne: true },
        { product: { ...mockProduct, crateType: 'B100V' }, quantity: 4, withConsigne: false }
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 5, toReturn: 3 });
    expect(result.B65).toEqual({ withConsigne: 2, toReturn: 0 });
    expect(result.B100V).toEqual({ withConsigne: 0, toReturn: 4 });
    expect(result.B50V).toEqual({ withConsigne: 0, toReturn: 0 });
  });

  it('should handle mixed valid and invalid items', () => {
    const order: Order = {
      ...baseOrder,
      items: [
        { product: mockProduct, quantity: 5, withConsigne: true },
        { product: undefined as any, quantity: 10, withConsigne: false },
        { product: { ...mockProduct, crateType: 'B65' }, quantity: 2, withConsigne: false },
        null as any
      ]
    };
    const result = getCrateSummary(order);
    
    expect(result.B33).toEqual({ withConsigne: 5, toReturn: 0 });
    expect(result.B65).toEqual({ withConsigne: 0, toReturn: 2 });
  });
});
