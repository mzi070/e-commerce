"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  addToCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/actions/cart";
import type { ActionResult } from "@/lib/action-result";
import type { CartLineItem } from "@/lib/queries/cart";
import { formatCents, multiplyMoney, parseMoneyToCents } from "@/lib/money";

/** Minimal product info needed to render an optimistic cart line. */
export interface AddToCartMeta {
  productId: string;
  title: string;
  unitPrice: string;
  image: string | null;
  stock: number;
}

type OptimisticAction =
  | { type: "add"; meta: AddToCartMeta; quantity: number }
  | { type: "set"; productId: string; quantity: number }
  | { type: "remove"; productId: string };

function lineTotalOf(unitPrice: string, quantity: number): string {
  return multiplyMoney(unitPrice, quantity);
}

function cartReducer(
  items: CartLineItem[],
  action: OptimisticAction,
): CartLineItem[] {
  switch (action.type) {
    case "add": {
      const existing = items.find(
        (item) => item.productId === action.meta.productId,
      );
      if (existing) {
        return items.map((item) =>
          item.productId === action.meta.productId
            ? {
                ...item,
                quantity: item.quantity + action.quantity,
                lineTotal: lineTotalOf(
                  item.unitPrice,
                  item.quantity + action.quantity,
                ),
              }
            : item,
        );
      }
      return [
        ...items,
        {
          productId: action.meta.productId,
          title: action.meta.title,
          sku: "",
          unitPrice: action.meta.unitPrice,
          lineTotal: lineTotalOf(action.meta.unitPrice, action.quantity),
          quantity: action.quantity,
          stock: action.meta.stock,
          image: action.meta.image,
        },
      ];
    }
    case "set": {
      if (action.quantity <= 0) {
        return items.filter((item) => item.productId !== action.productId);
      }
      return items.map((item) =>
        item.productId === action.productId
          ? {
              ...item,
              quantity: action.quantity,
              lineTotal: lineTotalOf(item.unitPrice, action.quantity),
            }
          : item,
      );
    }
    case "remove":
      return items.filter((item) => item.productId !== action.productId);
  }
}

interface CartContextValue {
  items: CartLineItem[];
  itemCount: number;
  subtotal: string;
  isAuthenticated: boolean;
  isOpen: boolean;
  isPending: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (meta: AddToCartMeta, quantity?: number) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}

interface CartProviderProps {
  initialItems: CartLineItem[];
  isAuthenticated: boolean;
  children: ReactNode;
}

export function CartProvider({
  initialItems,
  isAuthenticated,
  children,
}: CartProviderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, applyOptimistic] = useOptimistic(
    initialItems,
    cartReducer,
  );

  const itemCount = optimisticItems.reduce(
    (count, item) => count + item.quantity,
    0,
  );
  const subtotal = formatCents(
    optimisticItems.reduce(
      (sum, item) => sum + parseMoneyToCents(item.lineTotal),
      0,
    ),
  );

  function run(
    optimistic: OptimisticAction,
    action: () => Promise<ActionResult>,
  ): void {
    setError(null);
    startTransition(async () => {
      applyOptimistic(optimistic);
      const result = await action();
      if (!result.success) {
        setError(result.error);
      }
      // Re-sync with authoritative server state (revalidated by the action).
      router.refresh();
    });
  }

  const value: CartContextValue = {
    items: optimisticItems,
    itemCount,
    subtotal,
    isAuthenticated,
    isOpen,
    isPending,
    error,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem: (meta, quantity = 1) => {
      if (!isAuthenticated) {
        router.push("/login?callbackUrl=/");
        return;
      }
      setIsOpen(true);
      run({ type: "add", meta, quantity }, () =>
        addToCart({ productId: meta.productId, quantity }),
      );
    },
    setItemQuantity: (productId, quantity) =>
      run({ type: "set", productId, quantity }, () =>
        updateCartItemQuantity({ productId, quantity }),
      ),
    removeItem: (productId) =>
      run({ type: "remove", productId }, () => removeCartItem({ productId })),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
