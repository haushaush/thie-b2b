import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

const RESERVATION_DURATION = 600; // seconds (10 minutes) - matches server-side

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: (skipRelease?: boolean) => void;
  submitRequest: (expressShipping: boolean, shippingCost: number) => Promise<string>;
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
  const operationLocksRef = useRef<Set<string>>(new Set());
  const submitPromiseRef = useRef<Promise<string> | null>(null);
  const { user } = useAuth();

  const isReservationActive = items.length > 0 && reservationSecondsLeft > 0;

  const startTimer = useCallback(() => {
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
    const { error } = await supabase.rpc("reserve_product", {
      p_product_id: productId,
      p_quantity: quantity,
    });
    if (error) {
      console.error("Failed to reserve product:", error);
      throw error;
    }
  };

  const releaseProductUnits = async (productId: string, quantity: number) => {
    if (!user) return;
    const { error } = await supabase.rpc("release_product_units", {
      p_product_id: productId,
      p_quantity: quantity,
    });
    if (error) {
      console.error("Failed to release product units:", error);
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

  const addItem = async (product: Product, quantity = 1) => {
    const lockKey = `product:${product.id}`;
    if (operationLocksRef.current.has(lockKey)) return;
    operationLocksRef.current.add(lockKey);

    try {
      const currentItems = items;
      const existingItem = currentItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        const addedQuantity = Math.min(
          existingItem.quantity + quantity,
          product.availableUnits
        ) - existingItem.quantity;
        
        if (addedQuantity > 0) {
          await reserveProduct(product.id, addedQuantity);
          setItems((current) =>
            current.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + addedQuantity }
                : item
            )
          );
        }
      } else {
        const actualQuantity = Math.min(quantity, product.availableUnits);
        await reserveProduct(product.id, actualQuantity);
        setItems((current) => [...current, { product, quantity: actualQuantity }]);
      }

      startTimer();
      resetTimerInDb();
    } catch (e: any) {
      toast.error("Nicht genug Einheiten verfügbar");
    } finally {
      operationLocksRef.current.delete(lockKey);
    }
  };

  const removeItem = async (productId: string) => {
    const lockKey = `product:${productId}`;
    if (operationLocksRef.current.has(lockKey)) return;
    operationLocksRef.current.add(lockKey);

    const item = items.find((i) => i.product.id === productId);
    try {
      if (item) {
        await releaseProductUnits(productId, item.quantity);
      }

      setItems((current) => {
        const newItems = current.filter((i) => i.product.id !== productId);
        if (newItems.length === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          expiresAtRef.current = null;
          setReservationSecondsLeft(0);
        }
        return newItems;
      });
    } finally {
      operationLocksRef.current.delete(lockKey);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const lockKey = `product:${productId}`;
    if (operationLocksRef.current.has(lockKey)) return;
    operationLocksRef.current.add(lockKey);

    const existingItem = items.find((item) => item.product.id === productId);
    if (!existingItem) {
      operationLocksRef.current.delete(lockKey);
      return;
    }

    const newQuantity = Math.min(quantity, existingItem.product.availableUnits);
    const diff = newQuantity - existingItem.quantity;

    if (diff === 0) {
      operationLocksRef.current.delete(lockKey);
      return;
    }

    try {
      if (diff > 0) {
        await reserveProduct(productId, diff);
      } else {
        await releaseProductUnits(productId, Math.abs(diff));
      }

      setItems((current) =>
        current.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );

      startTimer();
      resetTimerInDb();
    } catch (e: any) {
      toast.error("Nicht genug Einheiten verfügbar");
    } finally {
      operationLocksRef.current.delete(lockKey);
    }
  };

  const clearCart = async (skipRelease = false) => {
    if (!skipRelease) {
      await releaseReservations();
    }
    setItems([]);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    expiresAtRef.current = null;
    setReservationSecondsLeft(0);
  };

  const submitRequest = async (expressShipping: boolean, shippingCost: number): Promise<string> => {
    if (submitPromiseRef.current) {
      return submitPromiseRef.current;
    }

    const submitPromise = (async () => {
      if (!user || items.length === 0) throw new Error("No items");

      const itemsPayload = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_per_unit: item.product.pricePerUnit,
      }));

      const { data, error } = await supabase.rpc("create_request_atomic", {
        p_items: itemsPayload as any,
        p_express_shipping: expressShipping,
        p_shipping_cost: shippingCost,
      });

      if (error) throw error;

      // Clear cart without releasing reservations (they were consumed by the request)
      await clearCart(true);

      return data as string;
    })();

    submitPromiseRef.current = submitPromise;

    try {
      return await submitPromise;
    } finally {
      submitPromiseRef.current = null;
    }
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
        submitRequest,
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
