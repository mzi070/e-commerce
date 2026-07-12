"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/auth/session";
import { createReviewSchema, deleteReviewSchema } from "@/lib/validations/review";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

export async function createReview(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { productId, rating, title, body } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return fail("Product not found.");
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  });
  if (existing) {
    return fail("You have already reviewed this product.");
  }

  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      rating,
      title: title ?? null,
      body,
    },
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/shop");
  return ok(undefined);
}

export async function deleteReview(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return fail("You must be signed in.");
  }

  const parsed = deleteReviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid input.", toFieldErrors(parsed.error));
  }

  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    select: { id: true, productId: true, userId: true },
  });
  if (!review) {
    return fail("Review not found.");
  }

  const isOwner = review.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return fail("You do not have permission to delete this review.");
  }

  await prisma.review.delete({ where: { id: review.id } });

  revalidatePath(`/products/${review.productId}`);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/shop");
  return ok(undefined);
}
