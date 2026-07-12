import { z } from "zod";
import { productImageUrlSchema } from "@/lib/validations/image-url";
import { dollarsToCents } from "@/lib/money";

const stockSchema = z.coerce
  .number("Stock must be a number.")
  .int("Stock must be a whole number.")
  .min(0, "Stock cannot be negative.")
  .max(1_000_000, "Stock is too large.");

const categorySchema = z
  .string()
  .trim()
  .min(1, "Category is required.")
  .max(64)
  .transform((value) => value.toLowerCase());

/** Admin forms accept dollar strings; stored as integer cents. */
const priceInputSchema = z
  .union([z.string(), z.number()])
  .transform((value) => dollarsToCents(value))
  .refine((cents) => cents > 0, "Price must be greater than 0.")
  .refine((cents) => cents <= 100_000_000, "Price is too large.");

const optionalPriceInputSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return dollarsToCents(value);
  })
  .refine(
    (cents) => cents === null || cents > 0,
    "Compare-at price must be greater than 0.",
  );

export const productBaseSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required.").max(64),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  price: priceInputSchema,
  compareAtPrice: optionalPriceInputSchema.optional(),
  featured: z.coerce.boolean().optional(),
  stock: stockSchema,
  category: categorySchema,
  images: z.array(productImageUrlSchema).max(10),
});

export const createProductSchema = productBaseSchema.extend({
  images: z.array(productImageUrlSchema).max(10).default([]),
});

export const updateProductSchema = productBaseSchema
  .partial()
  .extend({ id: z.string().min(1, "Product id is required.") });

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Product id is required."),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
