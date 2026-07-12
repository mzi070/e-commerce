import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { createOrder } from "@/lib/queries/orders";
import {
  deletePaymentReference,
  getPaymentReference,
} from "@/lib/queries/payment-references";
import { getProductsByIds } from "@/lib/queries/products";
import { priceCartLines } from "@/lib/pricing";
import { centsToSwipezAmount, verifyResponseChecksum } from "@/lib/swipe";

export interface SwipezPaymentNotification {
  reference_no: string;
  transaction_id: string;
  status: string;
  amount: string;
  billing_email: string;
  billing_name?: string;
  billing_mobile?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  checksum?: string;
}

/**
 * Fulfill a paid Swipez transaction. Idempotent via unique paymentReferenceNo.
 * Called from the webhook handler (primary) — not the client return page.
 */
export async function fulfillSwipezPayment(
  notification: SwipezPaymentNotification,
  webhookId: string,
): Promise<void> {
  if (notification.status.toLowerCase() !== "success") {
    return;
  }

  if (notification.checksum) {
    const valid = verifyResponseChecksum({
      amount: notification.amount,
      referenceNo: notification.reference_no,
      billingEmail: notification.billing_email,
      checksum: notification.checksum,
    });
    if (!valid) {
      throw new Error("Invalid Swipez payment checksum.");
    }
  }

  const pending = await getPaymentReference(notification.reference_no);
  if (!pending) {
    // Already fulfilled or unknown reference.
    const existing = await prisma.order.findUnique({
      where: { paymentReferenceNo: notification.reference_no },
      select: { id: true },
    });
    if (existing) {
      return;
    }
    throw new Error("Payment reference not found.");
  }

  const products = await getProductsByIds(
    pending.lines.map((line) => line.productId),
  );
  const priced = priceCartLines(pending.lines, products);
  const expectedAmount = centsToSwipezAmount(
    pending.totalCents + pending.shippingCents,
  );

  if (notification.amount !== expectedAmount) {
    throw new Error("Paid amount does not match server-computed total.");
  }

  const shippingAddress: Prisma.InputJsonValue | undefined =
    notification.billing_address
      ? ({
          name: notification.billing_name,
          mobile: notification.billing_mobile,
          address: notification.billing_address,
          city: notification.billing_city,
          state: notification.billing_state,
          postalCode: notification.billing_postal_code,
        } as Prisma.InputJsonValue)
      : undefined;

  await createOrder({
    userId: pending.userId,
    guestEmail: pending.payerEmail,
    totalCents: pending.totalCents + pending.shippingCents,
    paymentReferenceNo: pending.referenceNo,
    swipeTransactionId: notification.transaction_id,
    swipeWebhookId: webhookId,
    shippingAddress,
    items: priced.items.map((item) => ({
      productId: item.productId,
      productTitle: item.title,
      productSku: item.sku,
      priceAtPurchaseCents: item.unitPriceCents,
      quantity: item.quantity,
    })),
  });

  await deletePaymentReference(pending.referenceNo);

  if (pending.userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId: pending.userId },
      select: { id: true },
    });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}
