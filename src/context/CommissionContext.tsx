import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types';

interface CommissionSettings {
  clientCommission: number;
  supplierCommission: number;
}

interface CommissionContextType {
  commissionSettings: CommissionSettings;
  isLoading: boolean;
  getCartTotalWithCommission: (cart: CartItem[], cartSubtotal: number, cartConsigneTotal: number) => {
    subtotal: number;
    consigneTotal: number;
    clientCommission: number;
    total: number;
    cart: CartItem[]
  };
  getSupplierNetAmount: (orderAmount: number) => {
    grossAmount: number;
    commission: number;
    netAmount: number
  };
  refreshCommissionSettings: () => Promise<void>;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export const useCommission = () => {
  const context = useContext(CommissionContext);
  if (context === undefined) {
    throw new Error('useCommission must be used within a CommissionProvider');
  }
  return context;
};

export const CommissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    clientCommission: 8,
    supplierCommission: 2
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadCommissionSettings = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading commission settings:', error);
        return;
      }

      if (data) {
        setCommissionSettings({
          clientCommission: Number(data.client_commission_percentage),
          supplierCommission: Number(data.supplier_commission_percentage)
        });
      }
    } catch (error) {
      console.error('Exception loading commission settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommissionSettings();
  }, []);

  const getCartTotalWithCommission = (
    cart: CartItem[],
    cartSubtotal: number,
    cartConsigneTotal: number
  ) => {
    const orderTotal = cartSubtotal + cartConsigneTotal;
    const clientCommission = Math.round(orderTotal * (commissionSettings.clientCommission / 100));
    const total = orderTotal + clientCommission;

    return {
      subtotal: cartSubtotal,
      consigneTotal: cartConsigneTotal,
      clientCommission,
      total,
      cart
    };
  };

  const getSupplierNetAmount = (orderAmount: number) => {
    const baseAmount = orderAmount / (1 + commissionSettings.clientCommission / 100);
    const commission = Math.round(baseAmount * (commissionSettings.supplierCommission / 100));
    const netAmount = orderAmount - commission;

    return {
      grossAmount: baseAmount,
      commission,
      netAmount
    };
  };

  const refreshCommissionSettings = async () => {
    await loadCommissionSettings();
  };

  return (
    <CommissionContext.Provider value={{
      commissionSettings,
      isLoading,
      getCartTotalWithCommission,
      getSupplierNetAmount,
      refreshCommissionSettings
    }}>
      {children}
    </CommissionContext.Provider>
  );
};
