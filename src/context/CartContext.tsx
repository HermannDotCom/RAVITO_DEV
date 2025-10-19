import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, withConsigne: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number, withConsigne?: boolean) => void;
  clearCart: () => void;
  getCartTotal: () => {
    subtotal: number;
    consigneTotal: number;
    total: number;
    cart: CartItem[]
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number, withConsigne: boolean) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);

      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, withConsigne }
            : item
        );
      }

      return [...prev, { product, quantity, withConsigne }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartItem = (productId: string, quantity: number, withConsigne?: boolean) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity, ...(withConsigne !== undefined && { withConsigne }) }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) =>
      sum + (item.product.cratePrice * item.quantity), 0
    );

    const consigneTotal = cart.reduce((sum, item) =>
      sum + (item.withConsigne ? item.product.consignPrice * item.quantity : 0), 0
    );

    return {
      subtotal,
      consigneTotal,
      total: subtotal + consigneTotal,
      cart
    };
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
