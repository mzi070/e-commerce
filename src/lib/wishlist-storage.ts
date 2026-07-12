const WISHLIST_STORAGE_KEY = "nextshop:wishlist:v1";

export interface StoredWishlist {
  productIds: string[];
}

export const EMPTY_WISHLIST: StoredWishlist = { productIds: [] };

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadWishlistFromStorage(): StoredWishlist {
  if (!isBrowser()) {
    return EMPTY_WISHLIST;
  }
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return EMPTY_WISHLIST;
    }
    const parsed = JSON.parse(raw) as StoredWishlist;
    if (!Array.isArray(parsed.productIds)) {
      return EMPTY_WISHLIST;
    }
    return {
      productIds: parsed.productIds.filter((id) => typeof id === "string"),
    };
  } catch {
    return EMPTY_WISHLIST;
  }
}

export function saveWishlistToStorage(wishlist: StoredWishlist): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
}

export function clearWishlistStorage(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
}
