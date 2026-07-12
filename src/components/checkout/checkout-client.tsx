"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCheckoutSession } from "@/actions/stripe-checkout";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrencyFromCents } from "@/lib/format";

export function CheckoutClient() {
  const { items, itemCount, subtotal, getCheckoutLines, isHydrated } =
    useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function payWithStripe(): void {
    setError(null);
    const lines = getCheckoutLines();
    startTransition(async () => {
      const result = await createCheckoutSession({ lines });
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  if (!isHydrated) {
    return (
      <div
        className="rounded-lg border border-black/10 p-12 text-center text-zinc-500 dark:border-white/10"
        aria-live="polite"
      >
        Loading your cart…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
        <p>Your cart is empty.</p>
        <Link
          href="/"
          className="mt-4 inline-block font-medium text-indigo-600 hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-zinc-500">
                  {formatCurrencyFromCents(item.unitPriceCents)} ×{" "}
                  {item.quantity}
                </p>
              </div>
              <span className="font-semibold">
                {formatCurrencyFromCents(item.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Summary</h2>
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/10">
          <span className="text-zinc-500">Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-zinc-500">Subtotal</span>
          <span className="text-xl font-bold">${subtotal}</span>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={payWithStripe}
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Redirecting to Stripe…" : "Pay with Stripe"}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Secure checkout powered by Stripe. No account required.
        </p>
      </div>
    </div>
  );
}
