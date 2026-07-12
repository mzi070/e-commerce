import { prisma } from "@/lib/prisma";
import type {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";
import type { ShippingAddressInput } from "@/lib/validations/checkout";

export interface OrderItemView {
  id: string;
  title: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl: string | null;
  totalCents: number;
  createdAt: string;
  itemCount: number;
  customerEmail: string | null;
  shippingAddress: ShippingAddressInput | null;
  items: OrderItemView[];
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; user: { select: { email: true } } };
}>;

function parseShippingAddress(
  value: Prisma.JsonValue | null,
): ShippingAddressInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.name !== "string" ||
    typeof record.phone !== "string" ||
    typeof record.line1 !== "string" ||
    typeof record.city !== "string"
  ) {
    return null;
  }
  return {
    name: record.name,
    phone: record.phone,
    line1: record.line1,
    city: record.city,
    line2: typeof record.line2 === "string" ? record.line2 : undefined,
    state: typeof record.state === "string" ? record.state : undefined,
    postalCode:
      typeof record.postalCode === "string" ? record.postalCode : undefined,
  };
}

function serializeOrder(order: OrderWithRelations): OrderView {
  let itemCount = 0;
  const items: OrderItemView[] = order.items.map((item) => {
    itemCount += item.quantity;
    const lineTotalCents = item.priceAtPurchaseCents * item.quantity;
    return {
      id: item.id,
      title: item.productTitle,
      sku: item.productSku,
      unitPriceCents: item.priceAtPurchaseCents,
      quantity: item.quantity,
      lineTotalCents,
    };
  });

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentProofUrl: order.paymentProofUrl,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    itemCount,
    customerEmail: order.user?.email ?? order.guestEmail ?? null,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    items,
  };
}

/** Orders belonging to a single customer, newest first. */
export async function getOrdersForUser(userId: string): Promise<OrderView[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true } } },
  });
  return orders.map(serializeOrder);
}

/** All orders across the store (admin), newest first. */
export async function getAllOrders(): Promise<OrderView[]> {
  const result = await getOrdersPaginated();
  return result.items;
}

export type OrderSort = "newest" | "oldest" | "total-asc" | "total-desc";

export interface OrderQuery {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  awaitingProof?: boolean;
  sort?: OrderSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrders {
  items: OrderView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminOrderStats {
  total: number;
  pendingFulfillment: number;
  pendingPayment: number;
  paidRevenueCents: number;
  awaitingProof: number;
}

const DEFAULT_ORDER_PAGE_SIZE = 20;

function orderByForSort(sort: OrderSort = "newest") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "total-asc":
      return { totalCents: "asc" as const };
    case "total-desc":
      return { totalCents: "desc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

function buildOrderWhere(query: OrderQuery): Prisma.OrderWhereInput {
  const { search, status, paymentStatus, paymentMethod, awaitingProof } = query;

  return {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(awaitingProof
      ? {
          paymentMethod: "BANK_TRANSFER",
          paymentStatus: "PENDING",
          paymentProofUrl: { not: null },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { guestEmail: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function getOrdersPaginated(
  query: OrderQuery = {},
): Promise<PaginatedOrders> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    50,
    Math.max(1, query.pageSize ?? DEFAULT_ORDER_PAGE_SIZE),
  );
  const where = buildOrderWhere(query);

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: orderByForSort(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true, user: { select: { email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: orders.map(serializeOrder),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminOrderStats(): Promise<AdminOrderStats> {
  const [total, pendingFulfillment, pendingPayment, paidAggregate, awaitingProof] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { paymentStatus: "PENDING" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalCents: true },
      }),
      prisma.order.count({
        where: {
          paymentMethod: "BANK_TRANSFER",
          paymentStatus: "PENDING",
          paymentProofUrl: { not: null },
        },
      }),
    ]);

  return {
    total,
    pendingFulfillment,
    pendingPayment,
    paidRevenueCents: paidAggregate._sum.totalCents ?? 0,
    awaitingProof,
  };
}

/** Single order for confirmation / receipt views. */
export async function getOrderById(orderId: string): Promise<OrderView | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true } } },
  });
  return order ? serializeOrder(order) : null;
}

export function orderTotalDisplay(order: OrderView): string {
  return formatCents(order.totalCents);
}
