import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const db = localStorage.getItem('cart');
      return db ? JSON.parse(db) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const clearCart = () => setItems([]);

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    const defaultSize = size || (product.sizes?.length ? product.sizes[0] : undefined);
    const defaultColor = color || (product.colors?.length ? product.colors[0].name : undefined);
    
    // Create deterministic ID
    const cId = `${product.id}_${defaultSize || ''}_${defaultColor || ''}`;

    setItems(prev => {
      const existing = prev.find(item => item.id === cId);
      if (existing) {
        return prev.map(item => 
          item.id === cId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cId, product, quantity, size: defaultSize, color: defaultColor }];
    });
    
    setIsOpen(true); // BF-4.1.2 Drawer opens automatically
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, isOpen, openCart, closeCart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
