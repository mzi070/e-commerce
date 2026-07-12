import { z } from "zod";
import { cartLineInputSchema } from "@/lib/validations/checkout";

export const payerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Phone must be at least 10 digits.")
    .max(12, "Phone must be at most 12 digits.")
    .regex(/^[0-9+]+$/, "Phone must contain only digits."),
  email: z.email("Please enter a valid email address.").max(255),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(255).optional(),
  state: z.string().trim().max(255).optional(),
  postalCode: z.string().trim().max(10).optional(),
});

export const createSwipeCheckoutSchema = z.object({
  lines: z
    .array(cartLineInputSchema)
    .min(1, "Your cart is empty.")
    .max(50, "Too many line items."),
  payer: payerSchema,
});

export type CreateSwipeCheckoutInput = z.infer<typeof createSwipeCheckoutSchema>;
