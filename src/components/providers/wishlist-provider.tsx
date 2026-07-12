"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  EMPTY_WISHLIST,
  loadWishlistFromStorage,
  saveWishlistToStorage,
  type StoredWishlist,
} from "@/lib/wishlist-storage";

interface WishlistContextValue {
  productIds: string[];
  count: number;
  isHydrated: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

let listeners: Array<() => void> = [];
let snapshot: StoredWishlist = EMPTY_WISHLIST;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function getServerSnapshot(): StoredWishlist {
  return EMPTY_WISHLIST;
}

function getClientSnapshot(): StoredWishlist {
  if (typeof window === "undefined") {
    return EMPTY_WISHLIST;
  }
  return snapshot;
}

function setSnapshot(next: StoredWishlist): void {
  snapshot = next;
  saveWishlistToStorage(next);
  emit();
}

if (typeof window !== "undefined") {
  snapshot = loadWishlistFromStorage();
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const toggleWishlist = useCallback((productId: string) => {
    const current = loadWishlistFromStorage();
    const exists = current.productIds.includes(productId);
    setSnapshot({
      productIds: exists
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    const current = loadWishlistFromStorage();
    setSnapshot({
      productIds: current.productIds.filter((id) => id !== productId),
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setSnapshot(EMPTY_WISHLIST);
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      productIds: stored.productIds,
      count: stored.productIds.length,
      isHydrated,
      isWishlisted: (productId) => stored.productIds.includes(productId),
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
    }),
    [stored.productIds, isHydrated, toggleWishlist, removeFromWishlist, clearWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
