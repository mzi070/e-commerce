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
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true } } },
  });
  return orders.map(serializeOrder);
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
