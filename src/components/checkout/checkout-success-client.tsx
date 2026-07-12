"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/providers/cart-provider";

export function CheckoutSuccessClient({
  orderId,
  totalDisplay,
}: {
  orderId: string;
  totalDisplay: string;
}) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950">
      <h1 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">
        Thank you — your order is confirmed
      </h1>
      <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
        Order <span className="font-mono">{orderId}</span> for {totalDisplay}{" "}
        has been placed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Continue shopping
      </Link>
    </div>
  );
}
