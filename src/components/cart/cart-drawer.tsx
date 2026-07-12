"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrencyFromCents } from "@/lib/format";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isOpen,
    isPending,
    error,
    closeCart,
    setItemQuantity,
    removeItem,
    isHydrated,
  } = useCart();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeCart();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-40 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 transition-opacity motion-reduce:transition-none ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 motion-reduce:transition-none dark:bg-zinc-950 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <h2 className="text-base font-semibold">
            Your cart{" "}
            {isHydrated && itemCount > 0 && (
              <span className="text-zinc-400">({itemCount})</span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-md p-1 text-zinc-500 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <p role="alert" className="mx-5 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!isHydrated ? (
            <p className="mt-10 text-center text-sm text-zinc-500">Loading cart…</p>
          ) : items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-500">
              Your cart is empty.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-900">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-medium">{item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatCurrencyFromCents(item.unitPriceCents)} each
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-black/10 dark:border-white/15">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setItemQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-sm hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.stock > 0 && item.quantity >= item.stock}
                          onClick={() => setItemQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-sm hover:bg-black/5 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrencyFromCents(item.lineTotalCents)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span className="text-lg font-semibold">${subtotal}</span>
          </div>
          <Link
            href="/checkout"
            onClick={closeCart}
            aria-disabled={!isHydrated || items.length === 0}
            className={`block w-full rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              !isHydrated || items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Checkout
          </Link>
          {isPending && (
            <p className="mt-2 text-center text-xs text-zinc-400">Updating…</p>
          )}
        </div>
      </aside>
    </div>
  );
}
