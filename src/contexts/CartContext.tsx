import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  product: Product;
  quantity: number;
}

const RESERVATION_DURATION = 60; // seconds

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: (skipRelease?: boolean) => void;
  totalDevices: number;
  totalAmount: number;
  reservationSecondsLeft: number;
  isReservationActive: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [reservationSecondsLeft, setReservationSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const { user } = useAuth();

  const isReservationActive = items.length > 0 && reservationSecondsLeft > 0;

  const startTimer = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    const expiresAt = Date.now() + RESERVATION_DURATION * 1000;
    expiresAtRef.current = expiresAt;
    setReservationSecondsLeft(RESERVATION_DURATION);

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setReservationSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        expiresAtRef.current = null;
      }
    }, 1000);
  }, []);

  const releaseReservations = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.rpc("release_user_reservations");
    } catch (e) {
      console.error("Failed to release reservations:", e);
    }
  }, [user]);

  // When timer expires, clear cart and release reservations
  useEffect(() => {
    if (reservationSecondsLeft === 0 && items.length > 0 && expiresAtRef.current === null) {
      // Timer just expired
      releaseReservations();
      setItems([]);
    }
  }, [reservationSecondsLeft, items.length, releaseReservations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const reserveProduct = async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await supabase.rpc("reserve_product", {
        p_product_id: productId,
        p_quantity: quantity,
      });
    } catch (e) {
      console.error("Failed to reserve product:", e);
    }
  };

  const resetTimerInDb = async () => {
    if (!user) return;
    try {
      await supabase.rpc("reset_reservation_timer");
    } catch (e) {
      console.error("Failed to reset timer:", e);
    }
  };

  const addItem = (product: Product, quantity = 1) => {
    setItems((current) => {
      const existingItem = current.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        const addedQuantity = Math.min(
          existingItem.quantity + quantity,
          product.availableUnits
        ) - existingItem.quantity;
        
        if (addedQuantity > 0) {
          reserveProduct(product.id, addedQuantity);
        }
        
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: existingItem.quantity + addedQuantity }
            : item
        );
      }

      const actualQuantity = Math.min(quantity, product.availableUnits);
      reserveProduct(product.id, actualQuantity);
      return [...current, { product, quantity: actualQuantity }];
    });

    // Reset timer on every add
    startTimer();
    resetTimerInDb();
  };

  const removeItem = (productId: string) => {
    setItems((current) => {
      const newItems = current.filter((item) => item.product.id !== productId);
      if (newItems.length === 0) {
        releaseReservations();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        expiresAtRef.current = null;
        setReservationSecondsLeft(0);
      }
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) => {
      const existingItem = current.find((item) => item.product.id === productId);
      if (!existingItem) return current;

      const newQuantity = Math.min(quantity, existingItem.product.availableUnits);
      const diff = newQuantity - existingItem.quantity;
      
      if (diff !== 0) {
        reserveProduct(productId, diff);
        startTimer();
        resetTimerInDb();
      }

      return current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const clearCart = (skipRelease = false) => {
    if (!skipRelease) {
      releaseReservations();
    }
    setItems([]);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    expiresAtRef.current = null;
    setReservationSecondsLeft(0);
  };

  const totalDevices = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalDevices,
        totalAmount,
        reservationSecondsLeft,
        isReservationActive,
      }}
    >
      {children}
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
