"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updatePaymentStatus } from "@/actions/order";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import type { OrderView } from "@/lib/queries/orders";

const ALL_STATUSES: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];
const ALL_PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED"];

interface OrderDetailModalProps {
  order: OrderView;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function changeStatus(status: OrderStatus): void {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId: order.id, status });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Fulfillment status updated.");
      router.refresh();
    });
  }

  function changePaymentStatus(paymentStatus: PaymentStatus): void {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updatePaymentStatus({ orderId: order.id, paymentStatus });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Payment status updated.");
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Order details
            </p>
            <h2 className="font-mono text-xl font-semibold">#{order.id.slice(-8)}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Placed {formatDate(order.createdAt)} · {order.customerEmail ?? "Unknown customer"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {success}
            </p>
          )}

          <section className="rounded-xl border border-black/10 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
              <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrencyFromCents(order.totalCents)}
            </p>
            <p className="text-sm text-zinc-500">
              {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Fulfillment status</span>
              <select
                value={order.status}
                disabled={isPending}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  changeStatus(event.target.value as OrderStatus)
                }
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15"
              >
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Payment status</span>
              <select
                value={order.paymentStatus}
                disabled={isPending}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  changePaymentStatus(event.target.value as PaymentStatus)
                }
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15"
              >
                {ALL_PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {order.shippingAddress && (
            <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <h3 className="text-sm font-semibold">Shipping address</h3>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {order.shippingAddress.name}
                </p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                  {order.shippingAddress.postalCode
                    ? ` ${order.shippingAddress.postalCode}`
                    : ""}
                </p>
                <p className="mt-1 text-zinc-500">{order.shippingAddress.phone}</p>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <h3 className="text-sm font-semibold">Line items</h3>
            <ul className="mt-3 divide-y divide-black/10 dark:divide-white/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-zinc-500">
                      SKU {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrencyFromCents(item.lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {order.paymentProofUrl && (
            <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Payment proof</h3>
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open full size
                </a>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.paymentProofUrl}
                  alt="Payment proof"
                  className="max-h-72 w-full object-contain bg-zinc-100 dark:bg-zinc-900"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
