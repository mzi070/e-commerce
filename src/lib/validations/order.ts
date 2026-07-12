import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order id is required."),
  status: z.enum(["PENDING", "SHIPPED", "DELIVERED"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
