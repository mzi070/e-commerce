"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrencyFromCents } from "@/lib/format";

export function CheckoutClient() {
  const { items, itemCount, isHydrated } = useCart();

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

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );

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
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/10">
          <span className="text-zinc-500">Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-zinc-500">Subtotal</span>
          <span className="text-xl font-bold">
            {formatCurrencyFromCents(subtotalCents)}
          </span>
        </div>

        <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Payment is not connected yet. Review your cart here — checkout will be
          enabled when you add your payment provider.
        </div>

        <Link
          href="/"
          className="mt-4 block w-full rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
