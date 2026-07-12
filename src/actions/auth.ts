"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  loginActionSchema,
  registerActionSchema,
} from "@/lib/validations/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sanitizeCallbackUrl } from "@/lib/safe-redirect";
import { fail, toFieldErrors, type ActionResult } from "@/lib/action-result";

const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

// A valid bcrypt hash (of a random string) used as a decoy so that login
// attempts for non-existent emails still perform a full bcrypt comparison,
// keeping response timing consistent and reducing user-enumeration leaks.
const DECOY_PASSWORD_HASH =
  "$2b$12$1cyXnZkFYMi/2f5gCCnW7uMEIfwrkS7C8z6wt9ZoRfcNlKmUEbN9K";

export async function register(input: unknown): Promise<ActionResult> {
  const rate = await enforceRateLimit(
    "register",
    AUTH_RATE_LIMIT.limit,
    AUTH_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many attempts. Please wait a moment and try again.");
  }

  const parsed = registerActionSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { name, email, password, callbackUrl } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      // Generic message to avoid revealing whether the email is registered.
      return fail(
        "Unable to create account. If you already have an account, try signing in.",
      );
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
  } catch {
    return fail("Something went wrong. Please try again.");
  }

  redirect(sanitizeCallbackUrl(callbackUrl));
}

export async function login(input: unknown): Promise<ActionResult> {
  const rate = await enforceRateLimit(
    "login",
    AUTH_RATE_LIMIT.limit,
    AUTH_RATE_LIMIT.windowMs,
  );
  if (!rate.ok) {
    return fail("Too many attempts. Please wait a moment and try again.");
  }

  const parsed = loginActionSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { email, password, callbackUrl } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    // Always run the hash comparison path to reduce user-enumeration timing leaks.
    const passwordOk = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, DECOY_PASSWORD_HASH);

    if (!user || !passwordOk) {
      return fail("Invalid email or password.");
    }

    if (user.status === "SUSPENDED") {
      return fail("This account has been suspended. Contact support.");
    }

    await createSession({ userId: user.id, email: user.email, role: user.role });
  } catch {
    return fail("Something went wrong. Please try again.");
  }

  redirect(sanitizeCallbackUrl(callbackUrl));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
