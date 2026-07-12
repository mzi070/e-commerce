import { z } from "zod";
import { productImageUrlSchema } from "@/lib/validations/image-url";

/** Money value with at most two decimal places, tolerant of float rounding. */
const hasAtMostTwoDecimals = (value: number): boolean =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;

const priceSchema = z.coerce
  .number("Price must be a number.")
  .positive("Price must be greater than 0.")
  .max(1_000_000, "Price is too large.")
  .refine(hasAtMostTwoDecimals, "Price supports at most 2 decimal places.");

const stockSchema = z.coerce
  .number("Stock must be a number.")
  .int("Stock must be a whole number.")
  .min(0, "Stock cannot be negative.")
  .max(1_000_000, "Stock is too large.");

export const productBaseSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required.").max(64),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  price: priceSchema,
  stock: stockSchema,
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
