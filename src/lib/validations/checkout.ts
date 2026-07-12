import { z } from "zod";

export const cartLineInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

export const checkoutLinesSchema = z
  .array(cartLineInputSchema)
  .min(1, "Your cart is empty.")
  .max(50, "Too many line items.");

const emailSchema = z
  .email("Please enter a valid email address.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

export const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required.")
    .max(30, "Phone number is too long."),
  line1: z.string().trim().min(1, "Address is required.").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "City is required.").max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
});

export const paymentProofSchema = z.object({
  data: z.string().min(1, "Payment proof image data is missing."),
  mimeType: z.string().min(1, "Payment proof image type is missing."),
});

export const placeOrderSchema = z
  .object({
    lines: checkoutLinesSchema,
    email: emailSchema,
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(["BANK_TRANSFER", "COD"], {
      error: "Please choose a payment method.",
    }),
    paymentProof: paymentProofSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod === "BANK_TRANSFER" && !value.paymentProof) {
      ctx.addIssue({
        code: "custom",
        message: "Upload a photo of your bank transfer receipt.",
        path: ["paymentProof"],
      });
    }
  });

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
