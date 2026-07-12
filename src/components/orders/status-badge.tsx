import type { OrderStatus } from "@/generated/prisma/enums";

const STYLES: Record<OrderStatus, string> = {
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SHIPPED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DELIVERED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
