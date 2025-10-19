import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { CommissionProvider } from '../context/CommissionContext';
import { OrderProvider } from '../context/OrderContext';
import { RatingProvider } from '../context/RatingContext';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <CommissionProvider>
          <OrderProvider>
            <RatingProvider>
              {children}
            </RatingProvider>
          </OrderProvider>
        </CommissionProvider>
      </CartProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
