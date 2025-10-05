import React, { createContext, useContext, ReactNode } from 'react';

interface CommissionContextType {
  calculateClientCommission: (amount: number) => number;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export const useCommission = () => {
  const context = useContext(CommissionContext);
  if (!context) throw new Error('useCommission must be used within CommissionProvider');
  return context;
};

export const CommissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const calculateClientCommission = (amount: number) => Math.round(amount * 0.08);

  return (
    <CommissionContext.Provider value={{ calculateClientCommission }}>
      {children}
    </CommissionContext.Provider>
  );
};
