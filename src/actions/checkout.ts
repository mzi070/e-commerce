"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { priceCartLines, PricingError, type PricedCart } from "@/lib/pricing";
import { placeOrderSchema } from "@/lib/validations/checkout";
import { enforceRateLimit } from "@/lib/rate-limit";
import { savePaymentProof } from "@/lib/payment-proof";
import { fail, toFieldErrors, type ActionResult } from "@/lib/action-result";

const CHECKOUT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

async function rollbackPlacedOrder(
  orderId: string,
  priced: PricedCart,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of priced.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.delete({ where: { id: orderId } });
  });
}

export async function placeOrder(input: unknown): Promise<ActionResult> {
  const rate = await enforceRateLimit(
    "checkout",
    CHECKOUT_RATE_LIMIT.limit,
    CHECKOUT_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many checkout attempts. Please wait a moment and try again.");
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { lines, email, shippingAddress, paymentMethod, paymentProof } =
    parsed.data;
  const user = await getCurrentUser();

  try {
    const productIds = [...new Set(lines.map((line) => line.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        sku: true,
        priceCents: true,
        stock: true,
        images: true,
      },
    });

    const priced = priceCartLines(lines, products);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of priced.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new PricingError(
            `Only limited stock remains for "${item.title}".`,
          );
        }
      }

      return tx.order.create({
        data: {
          userId: user?.id ?? null,
          guestEmail: user ? null : email,
          totalCents: priced.subtotalCents,
          paymentMethod,
          paymentStatus: "PENDING",
          shippingAddress,
          items: {
            create: priced.items.map((item) => ({
              productId: item.productId,
              productTitle: item.title,
              productSku: item.sku,
              priceAtPurchaseCents: item.unitPriceCents,
              quantity: item.quantity,
            })),
          },
        },
        select: { id: true },
      });
    });

    if (paymentMethod === "BANK_TRANSFER" && paymentProof) {
      try {
        const paymentProofUrl = await savePaymentProof(order.id, paymentProof);
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentProofUrl },
        });
      } catch (proofError) {
        await rollbackPlacedOrder(order.id, priced);
        const message =
          proofError instanceof Error
            ? proofError.message
            : "Could not save payment proof.";
        return fail(message);
      }
    }

    redirect(`/checkout/confirmation/${order.id}`);
  } catch (error) {
    if (error instanceof PricingError) {
      return fail(error.message);
    }
    return fail("Something went wrong placing your order. Please try again.");
  }
}
