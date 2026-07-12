const CART_STORAGE_KEY = "nextshop:cart:v1";

/** Client-side cart line — only productId + quantity are trusted at checkout. */
export interface StoredCartLine {
  productId: string;
  quantity: number;
  /** UI cache only — not used for payment. */
  title: string;
  unitPriceCents: number;
  image: string | null;
  stock: number;
}

export interface StoredCart {
  lines: StoredCartLine[];
}

export const EMPTY_STORED_CART: StoredCart = { lines: [] };

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadCartFromStorage(): StoredCart {
  if (!isBrowser()) {
    return EMPTY_STORED_CART;
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return EMPTY_STORED_CART;
    }
    const parsed = JSON.parse(raw) as StoredCart;
    if (!Array.isArray(parsed.lines)) {
      return EMPTY_STORED_CART;
    }
    return {
      lines: parsed.lines.filter(
        (line) =>
          typeof line.productId === "string" &&
          typeof line.quantity === "number" &&
          line.quantity > 0,
      ),
    };
  } catch {
    return EMPTY_STORED_CART;
  }
}

export function saveCartToStorage(cart: StoredCart): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage may be disabled; cart still works for the session.
  }
}

export function clearCartStorage(): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function cartItemCount(cart: StoredCart): number {
  return cart.lines.reduce((count, line) => count + line.quantity, 0);
}

export function cartSubtotalCents(cart: StoredCart): number {
  return cart.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
}
