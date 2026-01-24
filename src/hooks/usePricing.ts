/**
 * usePricing Hook - Hooks réutilisables pour les opérations pricing
 * Fournit des utilitaires pour formatter, comparer et calculer les prix
 */

import { useState, useCallback } from 'react';
import { ReferencePrice } from '../services/pricing/referencePriceService';
import {
  SupplierPriceGrid,
  CreateSupplierPriceGridInput,
  UpdateSupplierPriceGridInput,
  createSupplierPriceGrid,
  updateSupplierPriceGrid,
  deleteSupplierPriceGrid,
  bulkCreateSupplierPriceGrids,
  getSupplierPriceGridHistory,
} from '../services/pricing/supplierPriceService';

/**
 * Hook pour la gestion des grilles tarifaires fournisseur
 */
export function useSupplierPriceGridManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateSupplierPriceGridInput): Promise<SupplierPriceGrid | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await createSupplierPriceGrid(input);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating price grid';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (
    id: string,
    input: UpdateSupplierPriceGridInput
  ): Promise<SupplierPriceGrid | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await updateSupplierPriceGrid(id, input);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating price grid';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteSupplierPriceGrid(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting price grid';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkCreate = useCallback(async (grids: CreateSupplierPriceGridInput[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await bulkCreateSupplierPriceGrids(grids);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error bulk creating price grids';
      setError(message);
      return { success: 0, errors: grids.length, errorDetails: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHistory = useCallback(async (gridId?: string, supplierId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getSupplierPriceGridHistory(gridId, supplierId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching price grid history';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    create,
    update,
    remove,
    bulkCreate,
    getHistory,
    isLoading,
    error,
  };
}

/**
 * Hook pour formater les prix
 */
export function usePriceFormatter() {
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatVariance = useCallback((variance: number): string => {
    const sign = variance >= 0 ? '+' : '';
    return `${sign}${variance.toFixed(2)}%`;
  }, []);

  const formatCompactPrice = useCallback((price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M FCFA`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K FCFA`;
    }
    return `${price} FCFA`;
  }, []);

  return {
    formatPrice,
    formatVariance,
    formatCompactPrice,
  };
}

/**
 * Hook pour comparer les prix
 */
export function usePriceComparison() {
  const compareToReference = useCallback((
    supplierPrice: number,
    referencePrice: number
  ) => {
    const variance = supplierPrice - referencePrice;
    const variancePercentage = (variance / referencePrice) * 100;
    
    return {
      variance,
      variancePercentage,
      isAbove: variance > 0,
      isBelow: variance < 0,
      isEqual: variance === 0,
    };
  }, []);

  const getPriceStatus = useCallback((
    variance: number,
    thresholdLow: number = -5,
    thresholdHigh: number = 5
  ): 'low' | 'normal' | 'high' => {
    if (variance < thresholdLow) return 'low';
    if (variance > thresholdHigh) return 'high';
    return 'normal';
  }, []);

  const getPriceStatusColor = useCallback((status: 'low' | 'normal' | 'high'): string => {
    switch (status) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  }, []);

  return {
    compareToReference,
    getPriceStatus,
    getPriceStatusColor,
  };
}

/**
 * Hook pour calculer les totaux avec commissions
 */
export function usePriceCalculations() {
  const calculateOrderTotal = useCallback((
    items: Array<{ quantity: number; cratePrice: number; consignPrice: number; withConsigne: boolean }>,
    clientCommissionRate: number = 4
  ) => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.cratePrice,
      0
    );

    const consigneTotal = items.reduce(
      (sum, item) => sum + (item.withConsigne ? item.quantity * item.consignPrice : 0),
      0
    );

    const orderTotal = subtotal + consigneTotal;
    const clientCommission = Math.round(orderTotal * (clientCommissionRate / 100));
    const total = orderTotal + clientCommission;

    return {
      subtotal,
      consigneTotal,
      orderTotal,
      clientCommission,
      total,
    };
  }, []);

  const calculateSupplierNet = useCallback((
    grossAmount: number,
    supplierCommissionRate: number = 2,
    clientCommissionRate: number = 4
  ) => {
    const baseAmount = grossAmount / (1 + (clientCommissionRate / 100)); // Retire commission client
    const commission = Math.round(baseAmount * (supplierCommissionRate / 100));
    const netAmount = grossAmount - commission;

    return {
      grossAmount,
      commission,
      netAmount,
    };
  }, []);

  return {
    calculateOrderTotal,
    calculateSupplierNet,
  };
}

/**
 * Hook pour valider les prix
 */
export function usePriceValidation() {
  const validatePrice = useCallback((price: number, min: number = 0, max?: number): {
    isValid: boolean;
    error?: string;
  } => {
    if (price < min) {
      return { isValid: false, error: `Le prix doit être supérieur ou égal à ${min}` };
    }
    if (max !== undefined && price > max) {
      return { isValid: false, error: `Le prix doit être inférieur ou égal à ${max}` };
    }
    if (!Number.isFinite(price)) {
      return { isValid: false, error: 'Le prix doit être un nombre valide' };
    }
    return { isValid: true };
  }, []);

  const validatePriceGrid = useCallback((grid: CreateSupplierPriceGridInput): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    const unitValidation = validatePrice(grid.unitPrice);
    if (!unitValidation.isValid) {
      errors.push(`Prix unitaire: ${unitValidation.error}`);
    }

    const crateValidation = validatePrice(grid.cratePrice);
    if (!crateValidation.isValid) {
      errors.push(`Prix casier: ${crateValidation.error}`);
    }

    const consignValidation = validatePrice(grid.consignPrice);
    if (!consignValidation.isValid) {
      errors.push(`Prix consigne: ${consignValidation.error}`);
    }

    if (grid.discountPercentage !== undefined) {
      const discountValidation = validatePrice(grid.discountPercentage, 0, 100);
      if (!discountValidation.isValid) {
        errors.push(`Remise: ${discountValidation.error}`);
      }
    }

    if (grid.minimumOrderQuantity !== undefined && grid.minimumOrderQuantity < 1) {
      errors.push('La quantité minimale doit être au moins 1');
    }

    if (
      grid.maximumOrderQuantity !== undefined &&
      grid.minimumOrderQuantity !== undefined &&
      grid.maximumOrderQuantity < grid.minimumOrderQuantity
    ) {
      errors.push('La quantité maximale doit être supérieure à la quantité minimale');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validatePrice]);

  return {
    validatePrice,
    validatePriceGrid,
  };
}
