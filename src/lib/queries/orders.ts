import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export interface OrderItemView {
  id: string;
  title: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  total: string;
  createdAt: string;
  itemCount: number;
  customerEmail: string | null;
  items: OrderItemView[];
}

type OrderWithRelations = Prisma.OrderModel & {
  items: Prisma.OrderItemModel[];
  user?: { email: string } | null;
};

function serializeOrder(order: OrderWithRelations): OrderView {
  let itemCount = 0;
  const items: OrderItemView[] = order.items.map((item) => {
    itemCount += item.quantity;
    return {
      id: item.id,
      title: item.productTitle,
      sku: item.productSku,
      unitPrice: item.priceAtPurchase.toFixed(2),
      quantity: item.quantity,
      lineTotal: item.priceAtPurchase.mul(item.quantity).toFixed(2),
    };
  });

  return {
    id: order.id,
    status: order.status,
    total: order.total.toFixed(2),
    createdAt: order.createdAt.toISOString(),
    itemCount,
    customerEmail: order.user?.email ?? null,
    items,
  };
}

/** Orders belonging to a single customer, newest first. */
export async function getOrdersForUser(userId: string): Promise<OrderView[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
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
