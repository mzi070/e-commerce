"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

/** Return the id of the current user's cart, creating it if necessary. */
async function getOrCreateCartId(userId: string): Promise<string> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return cart.id;
}

function revalidateCartViews(): void {
  revalidatePath("/", "layout");
  revalidatePath("/checkout");
}

export async function addToCart(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }
  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });
  if (!product) {
    return fail("Product not found.");
  }

  const cartId = await getOrCreateCartId(user.id);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { quantity: true },
  });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock) {
    return fail(`Only ${product.stock} in stock.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: nextQuantity },
    create: { cartId, productId, quantity },
  });

  revalidateCartViews();
  return ok(undefined);
}

export async function updateCartItemQuantity(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }
  const { productId, quantity } = parsed.data;

  const cartId = await getOrCreateCartId(user.id);

  // A quantity of 0 removes the line item.
  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId, productId } });
    revalidateCartViews();
    return ok(undefined);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  if (!product) {
    return fail("Product not found.");
  }
  if (quantity > product.stock) {
    return fail(`Only ${product.stock} in stock.`);
  }

  const updated = await prisma.cartItem.updateMany({
    where: { cartId, productId },
    data: { quantity },
  });
  if (updated.count === 0) {
    return fail("Item is not in your cart.");
  }

  revalidateCartViews();
  return ok(undefined);
}

export async function removeCartItem(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = removeCartItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const cartId = await getOrCreateCartId(user.id);
  await prisma.cartItem.deleteMany({
    where: { cartId, productId: parsed.data.productId },
  });

  revalidateCartViews();
  return ok(undefined);
}
