import { z } from "zod";

export const cartLineInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

export const checkoutLinesSchema = z
  .array(cartLineInputSchema)
  .min(1, "Your cart is empty.")
  .max(50, "Too many line items.");

export const createCheckoutSessionSchema = z.object({
  lines: checkoutLinesSchema,
});

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
