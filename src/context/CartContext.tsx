import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, withConsigne: boolean) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number, withConsigne: boolean) => {
    setItems(prev => [...prev, { product, quantity, withConsigne }]);
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setItems([]);

  const getTotalAmount = () => {
    return items.reduce((total, item) => {
      return total + (item.product.cratePrice * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getTotalAmount }}>
      {children}
    </CartContext.Provider>
  );
};
