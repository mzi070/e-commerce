"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/order";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/orders/status-badge";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { OrderView } from "@/lib/queries/orders";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

const ALL_STATUSES: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];

export function OrderBoard({ orders }: { orders: OrderView[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeStatus(orderId: string, status: OrderStatus): void {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status });
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter(
            (order) => order.status === column.status,
          );
          return (
            <div
              key={column.status}
              className="rounded-lg border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="text-xs text-zinc-400">
                  {columnOrders.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {columnOrders.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-zinc-400">
                    No orders
                  </p>
                ) : (
                  columnOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-md border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-950"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-500">
                          #{order.id.slice(-8)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {order.customerEmail ?? "Unknown"}
                      </p>
                      <p className="mt-2 text-sm">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"} -{" "}
                        <span className="font-semibold">
                          {formatCurrency(order.total)}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(order.createdAt)}
                      </p>

                      <label className="mt-3 block text-xs text-zinc-500">
                        Update status
                        <select
                          value={order.status}
                          disabled={isPending}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            changeStatus(
                              order.id,
                              event.target.value as OrderStatus,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-white/15"
                        >
                          {ALL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
