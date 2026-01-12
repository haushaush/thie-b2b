import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/data/mockProducts";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalDevices: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((current) => {
      const existingItem = current.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.availableUnits
        );
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      return [...current, { product, quantity: Math.min(quantity, product.availableUnits) }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.availableUnits) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
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
