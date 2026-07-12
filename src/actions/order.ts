"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatusSchema } from "@/lib/validations/order";
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
  const updated = await prisma.order.updateMany({
    where: { id: orderId },
    data: { status },
  });
  if (updated.count === 0) {
    return fail("Order not found.");
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard");
  return ok(undefined);
}
