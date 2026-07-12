import { prisma } from "@/lib/prisma";
import type { PaymentStatus, OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";

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
  totalCents: number;
  createdAt: string;
  itemCount: number;
  customerEmail: string | null;
  items: OrderItemView[];
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; user: { select: { email: true } } };
}>;

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
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    itemCount,
    customerEmail: order.user?.email ?? order.guestEmail ?? null,
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

export function orderTotalDisplay(order: OrderView): string {
  return formatCents(order.totalCents);
}
