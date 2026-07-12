import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order id is required."),
  status: z.enum(["PENDING", "SHIPPED", "DELIVERED"]),
});

export const updatePaymentStatusSchema = z.object({
  orderId: z.string().min(1, "Order id is required."),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
