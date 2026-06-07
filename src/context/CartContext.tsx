import React, { createContext, useContext, useState, useEffect } from "react";
import type { MenuItem, MenuItemVariation } from "../services/menuService";
import { getDefaultMenuItemVariation } from "../services/menuService";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface Toast {
  id: string;
  message: string;
  itemName?: string;
  quantity?: number;
  image_url?: string;
}

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

const CART_STORAGE_KEY = "sumi-cart-items";

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartItemId(item: MenuItem, variation: MenuItemVariation): string {
  return `${item.id}::${variation.id}`;
}

function normalizeCartItem(cartItem: any): CartItem | null {
  if (!cartItem?.item?.id) return null;
  const variation =
    cartItem.variation || getDefaultMenuItemVariation(cartItem.item);
  return {
    ...cartItem,
    id: cartItem.id || getCartItemId(cartItem.item, variation),
    variation,
    quantity: Number(cartItem.quantity) || 1,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = window.sessionStorage.getItem(CART_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? (parsed.map(normalizeCartItem).filter(Boolean) as CartItem[])
        : [];
    } catch (e) {
      return [];
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToast = (
    message: string,
    itemName?: string,
    quantity?: number,
    image_url?: string,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [
      ...prev,
      { id, message, itemName, quantity, image_url },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const addToCart = (item: MenuItem, selectedVariation?: MenuItemVariation) => {
    const variation = selectedVariation || getDefaultMenuItemVariation(item);
    const cartItemId = getCartItemId(item, variation);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { id: cartItemId, item, variation, quantity: 1 }];
    });

    const variationText =
      variation.label !== "Regular" && variation.label !== "Normaali"
        ? ` (${variation.label})`
        : "";
    addToast(
      t("order.addedToOrder"),
      `${item.name}${variationText}`,
      1,
      item.image_url,
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const removeOneFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      return prev.filter((i) => i.id !== cartItemId);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, { variation, quantity }) => sum + variation.price * quantity,
    0,
  );

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

      {/* Global Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none max-w-[calc(100%-48px)] w-80">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.9,
                transition: { duration: 0.2 },
              }}
              className="pointer-events-auto flex items-center gap-3 bg-[var(--color-sumi)]/95 backdrop-blur-md px-4 py-3 shadow-2xl rounded-sm text-[var(--color-washi)] w-full"
            >
              {toast.image_url ? (
                <img
                  src={toast.image_url}
                  alt={toast.itemName}
                  className="w-10 h-10 object-cover rounded-sm shrink-0 border border-[var(--color-shu)]/10"
                />
              ) : (
                <div className="w-10 h-10 bg-[var(--color-washi)]/10 flex items-center justify-center shrink-0 rounded-sm">
                  <ShoppingBag size={18} className="text-[var(--color-shu)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--color-shu)] m-0 leading-none">
                  {toast.message}
                </p>
                <p className="text-xs font-serif font-bold truncate text-[var(--color-washi)] mt-1.5 mb-0 leading-tight">
                  {toast.itemName}
                </p>
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-[var(--color-washi)]/40 hover:text-[var(--color-washi)] p-1 transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
