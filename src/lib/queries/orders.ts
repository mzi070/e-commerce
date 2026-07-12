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

export interface CreateOrderItemInput {
  productId: string;
  productTitle: string;
  productSku: string;
  priceAtPurchaseCents: number;
  quantity: number;
}

export interface CreateOrderInput {
  userId?: string | null;
  guestEmail?: string | null;
  totalCents: number;
  stripeSessionId: string;
  stripeEventId: string;
  shippingAddress?: Prisma.InputJsonValue;
  items: CreateOrderItemInput[];
}

/** Idempotent order creation keyed by stripeSessionId. */
export async function createOrder(input: CreateOrderInput): Promise<OrderView> {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
    include: { items: true, user: { select: { email: true } } },
  });
  if (existing) {
    return serializeOrder(existing);
  }

  const order = await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      const decremented = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        throw new Error(`Insufficient stock for ${item.productSku}.`);
      }
    }

    return tx.order.create({
      data: {
        userId: input.userId ?? null,
        guestEmail: input.guestEmail ?? null,
        totalCents: input.totalCents,
        paymentStatus: "PAID",
        stripeSessionId: input.stripeSessionId,
        stripeEventId: input.stripeEventId,
        shippingAddress: input.shippingAddress,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productTitle: item.productTitle,
            productSku: item.productSku,
            priceAtPurchaseCents: item.priceAtPurchaseCents,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true, user: { select: { email: true } } },
    });
  });

  return serializeOrder(order);
}

export async function getOrderByStripeSessionId(
  sessionId: string,
): Promise<OrderView | null> {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { items: true, user: { select: { email: true } } },
  });
  return order ? serializeOrder(order) : null;
}

/** Format order total for display. */
export function orderTotalDisplay(order: OrderView): string {
  return formatCents(order.totalCents);
}
