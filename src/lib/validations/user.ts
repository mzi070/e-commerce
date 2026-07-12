import { z } from "zod";

const emailSchema = z
  .email("Please enter a valid email address.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter.");

export const updateUserSchema = z.object({
  userId: z.string().min(1, "User id is required."),
  name: z.string().trim().max(100).optional(),
  email: emailSchema,
  role: z.enum(["CUSTOMER", "ADMIN"]),
});

export const resetUserPasswordSchema = z
  .object({
    userId: z.string().min(1, "User id is required."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm the password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const userIdSchema = z.object({
  userId: z.string().min(1, "User id is required."),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
