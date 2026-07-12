"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import {
  cartItemCount,
  cartSubtotalCents,
  clearCartStorage,
  EMPTY_STORED_CART,
  loadCartFromStorage,
  saveCartToStorage,
  type StoredCart,
  type StoredCartLine,
} from "@/lib/cart-storage";
import { formatCents } from "@/lib/money";

/** Minimal product info needed to render a cart line. */
export interface AddToCartMeta {
  productId: string;
  title: string;
  unitPriceCents: number;
  image: string | null;
  stock: number;
}

export interface CartLineItem {
  productId: string;
  title: string;
  unitPriceCents: number;
  lineTotalCents: number;
  quantity: number;
  stock: number;
  image: string | null;
}

interface CartContextValue {
  items: CartLineItem[];
  itemCount: number;
  subtotal: string;
  isHydrated: boolean;
  isOpen: boolean;
  isPending: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (meta: AddToCartMeta, quantity?: number) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getCheckoutLines: () => { productId: string; quantity: number }[];
}

const CartContext = createContext<CartContextValue | null>(null);

let cartListeners: Array<() => void> = [];
let cartSnapshot: StoredCart = EMPTY_STORED_CART;

function emitCartChange(): void {
  for (const listener of cartListeners) {
    listener();
  }
}

function subscribeCart(listener: () => void): () => void {
  cartListeners.push(listener);
  return () => {
    cartListeners = cartListeners.filter((item) => item !== listener);
  };
}

function getServerCartSnapshot(): StoredCart {
  return EMPTY_STORED_CART;
}

function writeCart(cart: StoredCart): void {
  cartSnapshot = cart;
  saveCartToStorage(cart);
  emitCartChange();
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}

function toLineItem(line: StoredCartLine): CartLineItem {
  return {
    productId: line.productId,
    title: line.title,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.unitPriceCents * line.quantity,
    quantity: line.quantity,
    stock: line.stock,
    image: line.image,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const storedCart = useSyncExternalStore(
    subscribeCart,
    () => {
      if (cartSnapshot === EMPTY_STORED_CART && typeof window !== "undefined") {
        cartSnapshot = loadCartFromStorage();
      }
      return cartSnapshot;
    },
    getServerCartSnapshot,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const updateCart = useCallback((updater: (cart: StoredCart) => StoredCart) => {
    const next = updater(cartSnapshot);
    writeCart(next);
  }, []);

  const items = useMemo(
    () => storedCart.lines.map(toLineItem),
    [storedCart.lines],
  );

  const itemCount = cartItemCount(storedCart);
  const subtotal = formatCents(cartSubtotalCents(storedCart));

  const addItem = useCallback(
    (meta: AddToCartMeta, quantity = 1) => {
      setError(null);
      startTransition(() => {
        updateCart((cart) => {
          const existing = cart.lines.find(
            (line) => line.productId === meta.productId,
          );
          const nextQty = (existing?.quantity ?? 0) + quantity;
          if (nextQty > meta.stock) {
            setError(`Only ${meta.stock} in stock.`);
            return cart;
          }
          if (existing) {
            return {
              lines: cart.lines.map((line) =>
                line.productId === meta.productId
                  ? { ...line, quantity: nextQty }
                  : line,
              ),
            };
          }
          return {
            lines: [
              ...cart.lines,
              {
                productId: meta.productId,
                quantity,
                title: meta.title,
                unitPriceCents: meta.unitPriceCents,
                image: meta.image,
                stock: meta.stock,
              },
            ],
          };
        });
        setIsOpen(true);
      });
    },
    [updateCart],
  );

  const setItemQuantity = useCallback(
    (productId: string, quantity: number) => {
      setError(null);
      startTransition(() => {
        updateCart((cart) => {
          const line = cart.lines.find((item) => item.productId === productId);
          if (!line) {
            return cart;
          }
          if (quantity <= 0) {
            return {
              lines: cart.lines.filter((item) => item.productId !== productId),
            };
          }
          if (quantity > line.stock) {
            setError(`Only ${line.stock} in stock.`);
            return cart;
          }
          return {
            lines: cart.lines.map((item) =>
              item.productId === productId ? { ...item, quantity } : item,
            ),
          };
        });
      });
    },
    [updateCart],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setError(null);
      startTransition(() => {
        updateCart((cart) => ({
          lines: cart.lines.filter((line) => line.productId !== productId),
        }));
      });
    },
    [updateCart],
  );

  const clearCart = useCallback(() => {
    writeCart(EMPTY_STORED_CART);
    clearCartStorage();
  }, []);

  const getCheckoutLines = useCallback(
    () =>
      storedCart.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    [storedCart.lines],
  );

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    isHydrated,
    isOpen,
    isPending,
    error,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    setItemQuantity,
    removeItem,
    clearCart,
    getCheckoutLines,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
