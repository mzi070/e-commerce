"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updatePaymentStatus } from "@/actions/order";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdminFeedback,
  AdminPanel,
  FilterChip,
  StatCard,
  toolbarInputClass,
} from "@/components/admin/admin-ui";
import { OrderDetailModal } from "@/components/admin/order-detail-modal";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import type {
  AdminOrderStats,
  OrderSort,
  OrderView,
  PaginatedOrders,
} from "@/lib/queries/orders";

const SORT_OPTIONS: { value: OrderSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "total-desc", label: "Highest total" },
  { value: "total-asc", label: "Lowest total" },
];

const ALL_STATUSES: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];
const ALL_PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED"];

interface OrderBoardProps {
  data: PaginatedOrders;
  stats: AdminOrderStats;
  filters: {
    search: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    sort: OrderSort;
    awaitingProof: boolean;
  };
}

export function OrderBoard({ data, stats, filters }: OrderBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderView | null>(null);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [statusInput, setStatusInput] = useState(filters.status);
  const [paymentStatusInput, setPaymentStatusInput] = useState(filters.paymentStatus);
  const [paymentMethodInput, setPaymentMethodInput] = useState(filters.paymentMethod);
  const [sortInput, setSortInput] = useState<OrderSort>(filters.sort);
  const [awaitingProof, setAwaitingProof] = useState(filters.awaitingProof);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.status) count += 1;
    if (filters.paymentStatus) count += 1;
    if (filters.paymentMethod) count += 1;
    if (filters.awaitingProof) count += 1;
    if (filters.sort !== "newest") count += 1;
    return count;
  }, [filters]);

  function buildQuery(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    const values = {
      q: overrides.q ?? searchInput.trim(),
      status: overrides.status ?? statusInput,
      payment: overrides.payment ?? paymentStatusInput,
      method: overrides.method ?? paymentMethodInput,
      sort: overrides.sort ?? sortInput,
      proof: overrides.proof ?? (awaitingProof ? "1" : ""),
      page: overrides.page,
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  function applyFilters(page = "1"): void {
    router.push(buildQuery({ page: page === "1" ? undefined : page }));
  }

  function clearFilters(): void {
    setSearchInput("");
    setStatusInput("");
    setPaymentStatusInput("");
    setPaymentMethodInput("");
    setSortInput("newest");
    setAwaitingProof(false);
    router.push("/admin/orders");
  }

  function changeStatus(orderId: string, status: OrderStatus): void {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status });
      if (!result.success) setError(result.error);
      else setSuccess("Order updated.");
      router.refresh();
    });
  }

  function changePaymentStatus(orderId: string, paymentStatus: PaymentStatus): void {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentStatus({ orderId, paymentStatus });
      if (!result.success) setError(result.error);
      else setSuccess("Payment status updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total orders" value={stats.total} />
        <StatCard
          label="Pending fulfillment"
          value={stats.pendingFulfillment}
          tone="amber"
        />
        <StatCard
          label="Pending payment"
          value={stats.pendingPayment}
          tone="amber"
        />
        <StatCard
          label="Proof to review"
          value={stats.awaitingProof}
          tone="indigo"
        />
        <StatCard
          label="Paid revenue"
          value={formatCurrencyFromCents(stats.paidRevenueCents)}
          tone="emerald"
        />
      </div>

      <AdminPanel
        title="Orders"
        description={`${data.total} result${data.total === 1 ? "" : "s"}${activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}`}
      >
        <div className="border-b border-black/10 p-4 dark:border-white/10">
          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search order ID or customer email"
              className={toolbarInputClass}
            />
            <select
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Fulfillment status"
            >
              <option value="">All fulfillment</option>
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={paymentStatusInput}
              onChange={(event) => setPaymentStatusInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Payment status"
            >
              <option value="">All payments</option>
              {ALL_PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={paymentMethodInput}
              onChange={(event) => setPaymentMethodInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Payment method"
            >
              <option value="">All methods</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="COD">Cash on delivery</option>
            </select>
            <select
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as OrderSort)}
              className={toolbarInputClass}
              aria-label="Sort orders"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Apply
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterChip
              active={awaitingProof}
              label="Proof uploaded"
              onClick={() => {
                const next = !awaitingProof;
                setAwaitingProof(next);
                router.push(buildQuery({ proof: next ? "1" : "", page: undefined }));
              }}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <AdminFeedback error={error} success={success} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      No orders match your filters
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Try adjusting search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium">#{order.id.slice(-8)}</p>
                      <p className="text-xs text-zinc-500">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </p>
                      {order.paymentProofUrl && (
                        <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Proof attached
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[180px] truncate">
                        {order.customerEmail ?? "Unknown"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrencyFromCents(order.totalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          disabled={isPending}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            changeStatus(order.id, event.target.value as OrderStatus)
                          }
                          className="w-full rounded-lg border border-black/15 bg-transparent px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-white/15"
                        >
                          {ALL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <select
                          value={order.paymentStatus}
                          disabled={isPending}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            changePaymentStatus(
                              order.id,
                              event.target.value as PaymentStatus,
                            )
                          }
                          className="w-full rounded-lg border border-black/15 bg-transparent px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-white/15"
                        >
                          {ALL_PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(order)}
                        className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          buildHref={(page) => buildQuery({ page: String(page) })}
        />
      </AdminPanel>

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  );
}
