import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCartOnMount } from "@/components/checkout/clear-cart-on-mount";
import { BankDetailsCard } from "@/components/checkout/bank-details-card";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getBankTransferDetails } from "@/lib/commerce-config";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { getOrderById } from "@/lib/queries/orders";

export const metadata = { title: "Order confirmed" };

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;
  const [order, user] = await Promise.all([
    getOrderById(orderId),
    getCurrentUser(),
  ]);
  if (!order) {
    notFound();
  }

  const bankDetails =
    order.paymentMethod === "BANK_TRANSFER" ? getBankTransferDetails() : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ClearCartOnMount />

      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Order placed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Thank you for your order
        </h1>
        <p className="mt-2 text-zinc-500">
          Reference <span className="font-mono">#{order.id.slice(-8)}</span> ·{" "}
          {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </span>
      </div>

      {order.paymentMethod === "BANK_TRANSFER" && bankDetails && (
        <section className="mb-8 flex flex-col gap-4">
          <BankDetailsCard
            bankDetails={bankDetails}
            totalLabel={formatCurrencyFromCents(order.totalCents)}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Use order reference{" "}
            <strong className="font-mono">#{order.id.slice(-8)}</strong> in your
            transfer description.
          </p>
          {order.paymentProofUrl && (
            <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
              <h3 className="mb-2 text-sm font-semibold">Receipt uploaded</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.paymentProofUrl}
                alt="Uploaded bank transfer receipt"
                className="max-h-72 w-full rounded-md object-contain bg-zinc-100 dark:bg-zinc-900"
              />
            </div>
          )}
        </section>
      )}

      {order.paymentMethod === "COD" && (
        <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
          <h2 className="text-lg font-semibold">Cash on delivery</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Please have{" "}
            <strong>{formatCurrencyFromCents(order.totalCents)}</strong> ready in
            cash when your order is delivered. Our team will contact you if we
            need any delivery details.
          </p>
        </section>
      )}

      <section className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Order details</h2>
        {order.shippingAddress && (
          <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {order.shippingAddress.name}
            </p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state
                ? `, ${order.shippingAddress.state}`
                : ""}
              {order.shippingAddress.postalCode
                ? ` ${order.shippingAddress.postalCode}`
                : ""}
            </p>
            <p>{order.shippingAddress.phone}</p>
            {order.customerEmail && <p>{order.customerEmail}</p>}
          </div>
        )}
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span>
                {item.title}{" "}
                <span className="text-zinc-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatCurrencyFromCents(item.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold">
            {formatCurrencyFromCents(order.totalCents)}
          </span>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Continue shopping
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className="rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            View your orders
          </Link>
        )}
      </div>
    </div>
  );
}
