/**
 * PricingContext - Gestion globale de l'état pricing
 * Fournit l'accès aux prix de référence, grilles fournisseur et analytics
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  ReferencePrice,
  getReferencePrices,
  getActiveReferencePrice,
} from '../services/pricing/referencePriceService';
import {
  SupplierPriceGrid,
  getSupplierPriceGrids,
  getActiveSupplierPriceGrid,
} from '../services/pricing/supplierPriceService';
import {
  PriceAnalytics,
  getPriceAnalytics,
  calculatePriceVariance,
  PriceVarianceAnalysis,
} from '../services/pricing/priceAnalyticsService';

interface PricingContextType {
  // Reference Prices
  referencePrices: ReferencePrice[];
  isLoadingReferencePrices: boolean;
  refreshReferencePrices: () => Promise<void>;
  getReferencePrice: (productId: string, zoneId?: string) => Promise<ReferencePrice | null>;

  // Supplier Price Grids
  supplierPriceGrids: SupplierPriceGrid[];
  isLoadingSupplierGrids: boolean;
  refreshSupplierGrids: () => Promise<void>;
  getSupplierGrid: (productId: string, zoneId?: string) => Promise<SupplierPriceGrid | null>;

  // Analytics
  priceAnalytics: PriceAnalytics[];
  isLoadingAnalytics: boolean;
  refreshAnalytics: () => Promise<void>;
  getPriceVariance: (productId: string, zoneId?: string) => Promise<PriceVarianceAnalysis | null>;

  // Utility
  getProductPricing: (productId: string, zoneId?: string) => Promise<{
    referencePrice: ReferencePrice | null;
    supplierPrice: SupplierPriceGrid | null;
    variance?: number;
  }>;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
};

export const PricingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [referencePrices, setReferencePrices] = useState<ReferencePrice[]>([]);
  const [isLoadingReferencePrices, setIsLoadingReferencePrices] = useState(false);

  const [supplierPriceGrids, setSupplierPriceGrids] = useState<SupplierPriceGrid[]>([]);
  const [isLoadingSupplierGrids, setIsLoadingSupplierGrids] = useState(false);

  const [priceAnalytics, setPriceAnalytics] = useState<PriceAnalytics[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Charger les prix de référence
  const loadReferencePrices = async () => {
    try {
      setIsLoadingReferencePrices(true);
      const prices = await getReferencePrices({ isActive: true });
      setReferencePrices(prices);
    } catch (error) {
      console.error('Error loading reference prices:', error);
    } finally {
      setIsLoadingReferencePrices(false);
    }
  };

  // Charger les grilles fournisseur (si l'utilisateur est fournisseur)
  const loadSupplierGrids = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Vérifier le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'supplier') {
        setIsLoadingSupplierGrids(true);
        const grids = await getSupplierPriceGrids(user.id, { isActive: true });
        setSupplierPriceGrids(grids);
      }
    } catch (error) {
      console.error('Error loading supplier grids:', error);
    } finally {
      setIsLoadingSupplierGrids(false);
    }
  };

  // Charger les analytics
  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      const analytics = await getPriceAnalytics(undefined, undefined, true);
      setPriceAnalytics(analytics);
    } catch (error) {
      console.error('Error loading price analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Initialisation
  useEffect(() => {
    loadReferencePrices();
    loadSupplierGrids();
    loadAnalytics();
  }, []);

  // Setup realtime subscriptions pour les prix de référence
  useEffect(() => {
    const channel = supabase
      .channel('reference_prices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reference_prices',
        },
        () => {
          loadReferencePrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Setup realtime subscriptions pour les grilles fournisseur
  useEffect(() => {
    const channel = supabase
      .channel('supplier_price_grids_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_price_grids',
        },
        () => {
          loadSupplierGrids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fonctions helper
  const getReferencePrice = async (
    productId: string,
    zoneId?: string
  ): Promise<ReferencePrice | null> => {
    try {
      return await getActiveReferencePrice(productId, zoneId);
    } catch (error) {
      console.error('Error getting reference price:', error);
      return null;
    }
  };

  const getSupplierGrid = async (
    productId: string,
    zoneId?: string
  ): Promise<SupplierPriceGrid | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await getActiveSupplierPriceGrid(user.id, productId, zoneId);
    } catch (error) {
      console.error('Error getting supplier grid:', error);
      return null;
    }
  };

  const getPriceVariance = async (
    productId: string,
    zoneId?: string
  ): Promise<PriceVarianceAnalysis | null> => {
    try {
      return await calculatePriceVariance(productId, zoneId);
    } catch (error) {
      console.error('Error calculating price variance:', error);
      return null;
    }
  };

  const getProductPricing = async (
    productId: string,
    zoneId?: string
  ) => {
    try {
      const referencePrice = await getReferencePrice(productId, zoneId);
      const supplierPrice = await getSupplierGrid(productId, zoneId);

      let variance: number | undefined;
      if (referencePrice && supplierPrice) {
        variance = ((supplierPrice.cratePrice - referencePrice.referenceCratePrice) / 
                   referencePrice.referenceCratePrice) * 100;
      }

      return {
        referencePrice,
        supplierPrice,
        variance,
      };
    } catch (error) {
      console.error('Error getting product pricing:', error);
      return {
        referencePrice: null,
        supplierPrice: null,
      };
    }
  };

  const refreshReferencePrices = async () => {
    await loadReferencePrices();
  };

  const refreshSupplierGrids = async () => {
    await loadSupplierGrids();
  };

  const refreshAnalytics = async () => {
    await loadAnalytics();
  };

  return (
    <PricingContext.Provider
      value={{
        referencePrices,
        isLoadingReferencePrices,
        refreshReferencePrices,
        getReferencePrice,
        supplierPriceGrids,
        isLoadingSupplierGrids,
        refreshSupplierGrids,
        getSupplierGrid,
        priceAnalytics,
        isLoadingAnalytics,
        refreshAnalytics,
        getPriceVariance,
        getProductPricing,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
};
