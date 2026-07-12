"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import {
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "@/lib/validations/order";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

export async function updateOrderStatus(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid input.", toFieldErrors(parsed.error));
  }

  const { orderId, status } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true },
  });
  if (!order) {
    return fail("Order not found.");
  }

  const data: { status: typeof status; paymentStatus?: "PAID" } = { status };
  if (status === "DELIVERED" && order.paymentMethod === "COD") {
    data.paymentStatus = "PAID";
  }

  await prisma.order.update({
    where: { id: orderId },
    data,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/checkout/confirmation/${orderId}`);
  return ok(undefined);
}

export async function updatePaymentStatus(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updatePaymentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid input.", toFieldErrors(parsed.error));
  }

  const { orderId, paymentStatus } = parsed.data;
  const updated = await prisma.order.updateMany({
    where: { id: orderId },
    data: { paymentStatus },
  });
  if (updated.count === 0) {
    return fail("Order not found.");
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  revalidatePath(`/checkout/confirmation/${orderId}`);
  return ok(undefined);
}
