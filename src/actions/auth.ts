"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

// A valid bcrypt hash (of a random string) used as a decoy so that login
// attempts for non-existent emails still perform a full bcrypt comparison,
// keeping response timing consistent and reducing user-enumeration leaks.
const DECOY_PASSWORD_HASH =
  "$2b$12$1cyXnZkFYMi/2f5gCCnW7uMEIfwrkS7C8z6wt9ZoRfcNlKmUEbN9K";

export async function register(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return fail("An account with this email already exists.", {
      email: ["Email is already registered."],
    });
  }

  const passwordHash = await hashPassword(password);

  // Create the user together with an empty cart in one write.
  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
      cart: { create: {} },
    },
    select: { id: true, email: true, role: true },
  });

  await createSession({ userId: user.id, email: user.email, role: user.role });
  return ok(undefined);
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, passwordHash: true },
  });

  // Always run the hash comparison path to reduce user-enumeration timing leaks.
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, DECOY_PASSWORD_HASH);

  if (!user || !passwordOk) {
    return fail("Invalid email or password.");
  }

  await createSession({ userId: user.id, email: user.email, role: user.role });
  return ok(undefined);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
