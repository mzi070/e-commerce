import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { createOrder, type CreateOrderInput } from "@/lib/queries/orders";
import { getProductsByIds } from "@/lib/queries/products";
import { priceCartLines, type CartLineInput } from "@/lib/pricing";
import type Stripe from "stripe";

/**
 * Fulfill a paid Stripe Checkout session. Idempotent via unique stripeSessionId.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }

  const sessionId = session.id;
  const metadata = session.metadata ?? {};
  const linesRaw = metadata.lines;

  if (!linesRaw) {
    throw new Error("Checkout session missing line metadata.");
  }

  let lines: CartLineInput[];
  try {
    lines = JSON.parse(linesRaw) as CartLineInput[];
  } catch {
    throw new Error("Invalid line metadata on checkout session.");
  }

  const products = await getProductsByIds(lines.map((line) => line.productId));
  const priced = priceCartLines(lines, products);

  const shippingCents = Number(metadata.shippingCents ?? "0");
  const totalCents = priced.subtotalCents + shippingCents;

  const shippingAddress: Prisma.InputJsonValue | undefined =
    session.customer_details?.address
      ? (session.customer_details.address as unknown as Prisma.InputJsonValue)
      : undefined;

  const input: CreateOrderInput = {
    userId: metadata.userId || null,
    guestEmail: session.customer_details?.email ?? session.customer_email ?? null,
    totalCents,
    stripeSessionId: sessionId,
    stripeEventId: eventId,
    shippingAddress,
    items: priced.items.map((item) => ({
      productId: item.productId,
      productTitle: item.title,
      productSku: item.sku,
      priceAtPurchaseCents: item.unitPriceCents,
      quantity: item.quantity,
    })),
  };

  await createOrder(input);

  // Clear authenticated user's DB cart if applicable.
  if (metadata.userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId: metadata.userId },
      select: { id: true },
    });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}
