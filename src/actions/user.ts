"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { countActiveAdmins } from "@/lib/queries/users";
import {
  resetUserPasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "@/lib/validations/user";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

function revalidateUserViews(): void {
  revalidatePath("/admin/users");
}

async function getActorId(): Promise<string> {
  const actor = await requireAdmin();
  return actor.id;
}

export async function updateUser(input: unknown): Promise<ActionResult> {
  await getActorId();

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { userId, name, email, role } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) {
    return fail("User not found.");
  }

  if (target.role === "ADMIN" && role === "CUSTOMER") {
    const remainingAdmins = await countActiveAdmins(userId);
    if (remainingAdmins === 0) {
      return fail("Cannot demote the last active admin.");
    }
  }

  if (email !== target.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (emailTaken && emailTaken.id !== userId) {
      return fail("That email is already in use.", {
        email: ["Email is already registered."],
      });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      role,
      name: name && name.length > 0 ? name : null,
    },
  });

  revalidateUserViews();
  return ok(undefined);
}

export async function suspendUser(input: unknown): Promise<ActionResult> {
  const actorId = await getActorId();

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid input.", toFieldErrors(parsed.error));
  }

  const { userId } = parsed.data;
  if (userId === actorId) {
    return fail("You cannot suspend your own account.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!target) {
    return fail("User not found.");
  }
  if (target.status === "SUSPENDED") {
    return fail("User is already suspended.");
  }

  if (target.role === "ADMIN") {
    const remainingAdmins = await countActiveAdmins(userId);
    if (remainingAdmins === 0) {
      return fail("Cannot suspend the last active admin.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });

  revalidateUserViews();
  return ok(undefined);
}

export async function reactivateUser(input: unknown): Promise<ActionResult> {
  await getActorId();

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid input.", toFieldErrors(parsed.error));
  }

  const { userId } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });
  if (!target) {
    return fail("User not found.");
  }
  if (target.status === "ACTIVE") {
    return fail("User is already active.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", suspendedAt: null },
  });

  revalidateUserViews();
  return ok(undefined);
}

export async function resetUserPassword(input: unknown): Promise<ActionResult> {
  await getActorId();

  const parsed = resetUserPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { userId, password } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
    return fail("User not found.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidateUserViews();
  return ok(undefined);
}
