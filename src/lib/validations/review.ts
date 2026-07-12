import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(2000),
});

export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1),
});
