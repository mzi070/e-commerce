"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { placeOrder } from "@/actions/checkout";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  paymentMethodDescription,
} from "@/lib/payment-methods";
import type { BankTransferDetails } from "@/lib/commerce-config";
import type { PaymentProofInput } from "@/lib/validations/checkout";
import { BankDetailsCard } from "@/components/checkout/bank-details-card";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";

import type { FieldErrors } from "@/lib/action-result";
import type { PaymentMethod } from "@/generated/prisma/enums";

const PAYMENT_OPTIONS: PaymentMethod[] = ["BANK_TRANSFER", "COD"];

interface CheckoutClientProps {
  userEmail: string | null;
  bankDetails: BankTransferDetails;
}

export function CheckoutClient({ userEmail, bankDetails }: CheckoutClientProps) {
  const { items, itemCount, isHydrated, getCheckoutLines } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [paymentProof, setPaymentProof] = useState<PaymentProofInput | null>(
    null,
  );

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

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setFieldErrors({});

    const payload = {
      lines: getCheckoutLines(),
      email: String(form.get("email") ?? ""),
      paymentMethod,
      paymentProof: paymentMethod === "BANK_TRANSFER" ? paymentProof ?? undefined : undefined,
      shippingAddress: {
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        line1: String(form.get("line1") ?? ""),
        line2: String(form.get("line2") ?? "").trim() || undefined,
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? "").trim() || undefined,
        postalCode: String(form.get("postalCode") ?? "").trim() || undefined,
      },
    };

    startTransition(async () => {
      const result = await placeOrder(payload);
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const inputClass =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-white/15";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col gap-8 md:col-span-2">
        <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-4 text-lg font-semibold">Contact</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={userEmail ?? ""}
              readOnly={!!userEmail}
              autoComplete="email"
              className={inputClass}
            />
            {fieldErrors.email?.[0] && (
              <span className="text-xs text-red-600">{fieldErrors.email[0]}</span>
            )}
          </label>
        </section>

        <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-4 text-lg font-semibold">Shipping address</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Full name</span>
              <input name="name" required autoComplete="name" className={inputClass} />
              {fieldErrors["shippingAddress.name"]?.[0] && (
                <span className="text-xs text-red-600">
                  {fieldErrors["shippingAddress.name"][0]}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Phone</span>
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className={inputClass}
              />
              {fieldErrors["shippingAddress.phone"]?.[0] && (
                <span className="text-xs text-red-600">
                  {fieldErrors["shippingAddress.phone"][0]}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Address line 1</span>
              <input
                name="line1"
                required
                autoComplete="address-line1"
                className={inputClass}
              />
              {fieldErrors["shippingAddress.line1"]?.[0] && (
                <span className="text-xs text-red-600">
                  {fieldErrors["shippingAddress.line1"][0]}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Address line 2 (optional)</span>
              <input
                name="line2"
                autoComplete="address-line2"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">City</span>
              <input
                name="city"
                required
                autoComplete="address-level2"
                className={inputClass}
              />
              {fieldErrors["shippingAddress.city"]?.[0] && (
                <span className="text-xs text-red-600">
                  {fieldErrors["shippingAddress.city"][0]}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">State / atoll (optional)</span>
              <input name="state" autoComplete="address-level1" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Postal code (optional)</span>
              <input
                name="postalCode"
                autoComplete="postal-code"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-4 text-lg font-semibold">Payment method</h2>
          <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors ${
                  paymentMethod === method
                    ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => {
                    setPaymentMethod(method);
                    if (method !== "BANK_TRANSFER") {
                      setPaymentProof(null);
                    }
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-500">
                    {paymentMethodDescription(method)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {fieldErrors.paymentMethod?.[0] && (
            <p className="mt-2 text-xs text-red-600">
              {fieldErrors.paymentMethod[0]}
            </p>
          )}

          {paymentMethod === "BANK_TRANSFER" && (
            <div className="mt-4 flex flex-col gap-4">
              <BankDetailsCard
                bankDetails={bankDetails}
                totalLabel={formatCurrencyFromCents(subtotalCents)}
              />
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Upload transfer receipt
                </h3>
                <PaymentProofUpload
                  value={paymentProof}
                  onChange={setPaymentProof}
                  error={fieldErrors.paymentProof?.[0]}
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Items</h2>
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
        </section>
      </div>

      <div className="h-fit rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
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
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Placing order…" : "Place order"}
        </button>
        <Link
          href="/"
          className="mt-3 block w-full rounded-md border border-black/15 px-4 py-2.5 text-center text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Continue shopping
        </Link>
      </div>
    </form>
  );
}
