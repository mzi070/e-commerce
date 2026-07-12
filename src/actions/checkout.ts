"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/action-result";

const CHECKOUT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

export interface CheckoutSuccess {
  orderId: string;
  total: string;
}

/**
 * Domain error thrown inside the transaction to trigger a rollback with a
 * user-safe message. Not exported: Server Action modules may only export
 * async functions.
 */
class CheckoutError extends Error {}

const MAX_SERIALIZATION_RETRIES = 3;

/**
 * Detect Prisma's transaction serialization/write-conflict error (P2034),
 * which is safe to retry. Uses a structural check to avoid depending on the
 * concrete error class export.
 */
function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

/**
 * Place an order for the current user's cart.
 *
 * Security / correctness properties:
 * - Totals are computed exclusively from authoritative DB prices (never trusts
 *   client input) using Decimal arithmetic.
 * - Runs inside a single Serializable `$transaction` so order creation, stock
 *   changes, and cart clearing all commit or roll back together.
 * - Stock is decremented with a conditional `updateMany` guarded by
 *   `stock >= quantity`. Because that predicate is evaluated atomically at the
 *   row level, concurrent checkouts cannot oversell inventory (a losing
 *   transaction sees `count === 0` and aborts).
 */
/** Runs the whole order placement in one Serializable transaction. */
function placeOrderTransaction(
  userId: string,
): Promise<{ id: string; total: Prisma.Decimal }> {
  return prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new CheckoutError("Your cart is empty.");
      }

      const products = await tx.product.findMany({
        where: { id: { in: cart.items.map((item) => item.productId) } },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      let total = new Prisma.Decimal(0);
      const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const item of cart.items) {
        const product = productById.get(item.productId);
        if (!product) {
          throw new CheckoutError(
            "A product in your cart is no longer available.",
          );
        }

        // Race-condition-safe decrement: only applies if enough stock remains.
        const decremented = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decremented.count === 0) {
          const current = await tx.product.findUnique({
            where: { id: product.id },
            select: { stock: true, title: true },
          });
          throw new CheckoutError(
            `Insufficient stock for "${current?.title ?? product.title}". Only ${current?.stock ?? 0} left.`,
          );
        }

        total = total.add(product.price.mul(item.quantity));
        orderItems.push({
          productId: product.id,
          productTitle: product.title,
          productSku: product.sku,
          priceAtPurchase: product.price,
          quantity: item.quantity,
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: { createMany: { data: orderItems } },
        },
        select: { id: true, total: true },
      });

      // Empty the cart as part of the same atomic unit.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function checkout(): Promise<ActionResult<CheckoutSuccess>> {
  const user = await requireUser();

  const rate = await enforceRateLimit(
    "checkout",
    CHECKOUT_RATE_LIMIT.limit,
    CHECKOUT_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many checkout attempts. Please wait a moment and try again.");
  }

  for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      const order = await placeOrderTransaction(user.id);

      revalidatePath("/", "layout");
      revalidatePath("/checkout");
      revalidatePath("/dashboard");

      return ok({ orderId: order.id, total: order.total.toFixed(2) });
    } catch (error) {
      // Business-rule failures (empty cart, stock) are terminal - never retry.
      if (error instanceof CheckoutError) {
        return fail(error.message);
      }
      // Serialization conflicts are transient; retry a bounded number of times.
      if (
        isSerializationConflict(error) &&
        attempt < MAX_SERIALIZATION_RETRIES - 1
      ) {
        continue;
      }
      return fail("We couldn't complete your order. Please try again.");
    }
  }

  return fail("We couldn't complete your order. Please try again.");
}
