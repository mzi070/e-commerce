import { z } from "zod";

const productIdSchema = z.string().min(1, "Product id is required.");

const quantitySchema = z.coerce
  .number("Quantity must be a number.")
  .int("Quantity must be a whole number.")
  .max(999, "Quantity is too large.");

export const addToCartSchema = z.object({
  productId: productIdSchema,
  quantity: quantitySchema.positive("Quantity must be at least 1.").default(1),
});

export const updateCartItemSchema = z.object({
  productId: productIdSchema,
  // 0 (or less) signals removal of the line item.
  quantity: quantitySchema.min(0, "Quantity cannot be negative."),
});

export const removeCartItemSchema = z.object({
  productId: productIdSchema,
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
