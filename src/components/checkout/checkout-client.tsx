"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkout } from "@/actions/checkout";
import { formatCurrency } from "@/lib/format";
import type { CartView } from "@/lib/queries/cart";

export function CheckoutClient({ cart }: { cart: CartView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    orderId: string;
    total: string;
  } | null>(null);

  function placeOrder(): void {
    setError(null);
    startTransition(async () => {
      const result = await checkout();
      if (!result.success) {
        setError(result.error);
        router.refresh();
        return;
      }
      setConfirmed(result.data);
      router.refresh();
    });
  }

  if (confirmed) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950">
        <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">
          Order placed!
        </h2>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Order <span className="font-mono">{confirmed.orderId}</span> for{" "}
          {formatCurrency(confirmed.total)} was created successfully.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View orders
          </Link>
          <Link
            href="/"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
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
          {cart.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-zinc-500">
                  {formatCurrency(item.unitPrice)} x {item.quantity}
                </p>
              </div>
              <span className="font-semibold">
                {formatCurrency(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Summary</h2>
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/10">
          <span className="text-zinc-500">Items</span>
          <span>{cart.itemCount}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-zinc-500">Total</span>
          <span className="text-xl font-bold">{formatCurrency(cart.total)}</span>
        </div>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={placeOrder}
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Placing order..." : "Place order"}
        </button>
      </div>
    </div>
  );
}
