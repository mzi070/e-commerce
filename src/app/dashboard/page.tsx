import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getOrdersForUser } from "@/lib/queries/orders";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/orders/status-badge";

export const metadata = { title: "Your orders" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
          <p>You have not placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-indigo-600 hover:underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
                <div>
                  <p className="font-mono text-sm text-zinc-500">
                    #{order.id.slice(-8)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-lg font-semibold">
                    {formatCurrencyFromCents(order.totalCents)}
                  </span>
                </div>
              </div>
              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-zinc-600 dark:text-zinc-300">
                    <span>
                      {item.title}{" "}
                      <span className="text-zinc-400">x {item.quantity}</span>
                    </span>
                    <span>{formatCurrencyFromCents(item.lineTotalCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
