import {
  getAdminOrderStats,
  getOrdersPaginated,
  type OrderSort,
} from "@/lib/queries/orders";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { OrderBoard } from "@/components/admin/order-board";

export const metadata = { title: "Manage orders" };

export const dynamic = "force-dynamic";

const SORT_VALUES: OrderSort[] = ["newest", "oldest", "total-asc", "total-desc"];
const STATUS_VALUES: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];
const PAYMENT_STATUS_VALUES: PaymentStatus[] = ["PENDING", "PAID", "FAILED"];
const METHOD_VALUES: PaymentMethod[] = ["BANK_TRANSFER", "COD"];

interface AdminOrdersPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    method?: string;
    sort?: string;
    proof?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = STATUS_VALUES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const paymentStatus = PAYMENT_STATUS_VALUES.includes(
    params.payment as PaymentStatus,
  )
    ? (params.payment as PaymentStatus)
    : undefined;
  const paymentMethod = METHOD_VALUES.includes(params.method as PaymentMethod)
    ? (params.method as PaymentMethod)
    : undefined;
  const sort = SORT_VALUES.includes(params.sort as OrderSort)
    ? (params.sort as OrderSort)
    : "newest";
  const awaitingProof = params.proof === "1";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [data, stats] = await Promise.all([
    getOrdersPaginated({
      search: search || undefined,
      status,
      paymentStatus,
      paymentMethod,
      awaitingProof: awaitingProof || undefined,
      sort,
      page,
    }),
    getAdminOrderStats(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Track fulfillment, payments, transfer proofs, and order details.
        </p>
      </div>
      <OrderBoard
        data={data}
        stats={stats}
        filters={{
          search,
          status: status ?? "",
          paymentStatus: paymentStatus ?? "",
          paymentMethod: paymentMethod ?? "",
          sort,
          awaitingProof,
        }}
      />
    </section>
  );
}
