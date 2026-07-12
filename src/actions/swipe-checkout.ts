"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { commerceConfig } from "@/lib/config/commerce";
import { getProductsByIds } from "@/lib/queries/products";
import { createPaymentReference } from "@/lib/queries/payment-references";
import { getOrderByPaymentReference } from "@/lib/queries/orders";
import { priceCartLines, PricingError } from "@/lib/pricing";
import { createSwipeCheckoutSchema } from "@/lib/validations/swipe-checkout";
import {
  buildCheckoutFields,
  isSwipezConfigured,
  type SwipezCheckoutFields,
} from "@/lib/swipe";
import { enforceRateLimit } from "@/lib/rate-limit";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

const CHECKOUT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

export interface SwipeCheckoutPayload {
  actionUrl: string;
  fields: SwipezCheckoutFields;
}

export async function createSwipeCheckout(
  input: unknown,
): Promise<ActionResult<SwipeCheckoutPayload>> {
  const rate = await enforceRateLimit(
    "swipe-checkout",
    CHECKOUT_RATE_LIMIT.limit,
    CHECKOUT_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many checkout attempts. Please wait and try again.");
  }

  if (!isSwipezConfigured()) {
    return fail("Payments are not configured. Contact the store administrator.");
  }

  const parsed = createSwipeCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid checkout details.", toFieldErrors(parsed.error));
  }

  const { lines, payer } = parsed.data;

  let priced;
  try {
    const products = await getProductsByIds(lines.map((line) => line.productId));
    priced = priceCartLines(lines, products);
  } catch (error) {
    if (error instanceof PricingError) {
      return fail(error.message);
    }
    return fail("Unable to price your cart. Please try again.");
  }

  const user = await getCurrentUser();
  const shippingCents = commerceConfig.flatShippingCents;
  const totalCents = priced.subtotalCents + shippingCents;
  const referenceNo = `NS-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  await createPaymentReference({
    referenceNo,
    userId: user?.id ?? null,
    payerName: payer.name,
    payerPhone: payer.phone,
    payerEmail: payer.email,
    payerAddress: payer.address ?? null,
    payerCity: payer.city ?? null,
    payerState: payer.state ?? null,
    payerPostalCode: payer.postalCode ?? null,
    lines,
    totalCents: priced.subtotalCents,
    shippingCents,
  });

  const description =
    priced.items.length === 1
      ? priced.items[0]!.title
      : `NextShop order (${priced.itemCount} items)`;

  const checkout = buildCheckoutFields({
    referenceNo,
    amountCents: totalCents,
    description,
    payer: {
      name: payer.name,
      phone: payer.phone,
      email: payer.email,
      address: payer.address,
      city: payer.city,
      state: payer.state,
      postalCode: payer.postalCode,
    },
    userId: user?.id,
  });

  return ok(checkout);
}

/** Verify payment server-side before showing the success page. */
export async function verifySwipePayment(
  referenceNo: string,
): Promise<ActionResult<{ orderId: string; totalCents: number }>> {
  if (!referenceNo) {
    return fail("Missing payment reference.");
  }

  const order = await getOrderByPaymentReference(referenceNo);
  if (!order) {
    return fail(
      "Your payment was received. Order confirmation is processing — refresh shortly.",
    );
  }

  if (order.paymentStatus !== "PAID") {
    return fail("Payment has not been completed yet.");
  }

  return ok({ orderId: order.id, totalCents: order.totalCents });
}
