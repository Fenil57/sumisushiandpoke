import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, MenuItemVariation } from '../services/menuService';
import { getDefaultMenuItemVariation } from '../services/menuService';

export interface CartItem {
  id: string;
  item: MenuItem;
  variation: MenuItemVariation;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, variation?: MenuItemVariation) => void;
  removeFromCart: (cartItemId: string) => void;
  removeOneFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = 'sumi-cart-items';

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartItemId(item: MenuItem, variation: MenuItemVariation): string {
  return `${item.id}::${variation.id}`;
}

function normalizeCartItem(cartItem: any): CartItem | null {
  if (!cartItem?.item?.id) return null;
  const variation = cartItem.variation || getDefaultMenuItemVariation(cartItem.item);
  return {
    ...cartItem,
    id: cartItem.id || getCartItemId(cartItem.item, variation),
    variation,
    quantity: Number(cartItem.quantity) || 1,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = window.sessionStorage.getItem(CART_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter(Boolean) as CartItem[] : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, selectedVariation?: MenuItemVariation) => {
    const variation = selectedVariation || getDefaultMenuItemVariation(item);
    const cartItemId = getCartItemId(item, variation);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: cartItemId, item, variation, quantity: 1 }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const removeOneFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== cartItemId);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, { variation, quantity }) => sum + variation.price * quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        removeOneFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
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
