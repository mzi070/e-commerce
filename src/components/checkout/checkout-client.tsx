"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createSwipeCheckout } from "@/actions/swipe-checkout";
import { useCart } from "@/components/providers/cart-provider";
import { SwipezPaymentForm } from "@/components/checkout/swipez-payment-form";
import { formatCurrencyFromCents } from "@/lib/format";
import type { SwipeCheckoutPayload } from "@/actions/swipe-checkout";

interface CheckoutClientProps {
  flatShippingCents: number;
  collectShipping: boolean;
}

export function CheckoutClient({
  flatShippingCents,
  collectShipping,
}: CheckoutClientProps) {
  const { items, itemCount, subtotal, getCheckoutLines, isHydrated } =
    useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<SwipeCheckoutPayload | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  function payWithSwipe(): void {
    setError(null);
    const lines = getCheckoutLines();
    startTransition(async () => {
      const result = await createSwipeCheckout({
        lines,
        payer: {
          name,
          phone,
          email,
          ...(collectShipping
            ? { address, city, state, postalCode }
            : {}),
        },
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRedirect(result.data);
    });
  }

  if (redirect) {
    return (
      <div className="text-center">
        <p className="text-sm text-zinc-500">Redirecting to Swipez…</p>
        <SwipezPaymentForm
          actionUrl={redirect.actionUrl}
          fields={redirect.fields}
        />
      </div>
    );
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

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0,
  );
  const totalCents = subtotalCents + flatShippingCents;
  const inputClass =
    "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
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

        <fieldset className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <legend className="px-1 text-sm font-semibold">Contact details</legend>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Full name</span>
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Phone</span>
              <input
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            {collectShipping && (
              <>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="font-medium">Address</span>
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">City</span>
                  <input
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">State</span>
                  <input
                    name="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Postal code</span>
                  <input
                    name="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            )}
          </div>
        </fieldset>
      </div>

      <div className="h-fit rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Summary</h2>
        <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/10">
          <span className="text-zinc-500">Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-zinc-500">Subtotal</span>
          <span>${subtotal}</span>
        </div>
        {flatShippingCents > 0 && (
          <div className="flex items-center justify-between border-b border-black/10 pb-3 text-sm dark:border-white/10">
            <span className="text-zinc-500">Shipping</span>
            <span>{formatCurrencyFromCents(flatShippingCents)}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <span className="text-zinc-500">Total</span>
          <span className="text-xl font-bold">
            {formatCurrencyFromCents(totalCents)}
          </span>
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
          onClick={payWithSwipe}
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Preparing payment…" : "Pay with Swipez"}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Secure checkout powered by Swipez. No account required.
        </p>
      </div>
    </div>
  );
}
