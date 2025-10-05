import React, { createContext, useContext, ReactNode } from 'react';

interface RatingContextType {
  submitRating: (data: any) => Promise<boolean>;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) throw new Error('useRating must be used within RatingProvider');
  return context;
};

export const RatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const submitRating = async () => true;

  return (
    <RatingContext.Provider value={{ submitRating }}>
      {children}
    </RatingContext.Provider>
  );
};
