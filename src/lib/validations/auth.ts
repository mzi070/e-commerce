import { z } from "zod";

/** Normalizes emails to a trimmed, lowercase form for consistent lookups. */
const emailSchema = z
  .email("Please enter a valid email address.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100).optional(),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
