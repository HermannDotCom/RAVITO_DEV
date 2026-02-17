import React, { createContext, useContext } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionInvoice
} from '../types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  invoices: SubscriptionInvoice[];
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  isPendingPayment: boolean;
  isSuspended: boolean;
  canAccessGestionActivity: boolean;
  daysLeftInTrial: number | null;
  loading: boolean;
  error: string | null;
  createSubscription: (planId: string) => Promise<boolean>;
  cancelSubscription: (reason?: string) => Promise<boolean>;
  submitPaymentClaim: (invoiceId: string, paymentMethod: string, transactionReference: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscriptionData = useSubscription();

  return (
    <SubscriptionContext.Provider value={subscriptionData}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};
