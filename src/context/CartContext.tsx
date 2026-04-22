import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  img: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "flora_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const changeQty = (id: number, delta: number) => {
    setItems(prev => prev.flatMap(i => {
      if (i.id !== id) return [i];
      const next = i.quantity + delta;
      return next <= 0 ? [] : [{ ...i, quantity: next }];
    }));
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalCount, totalPrice, addItem, removeItem, changeQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
