"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import {
  createProductSchema,
  deleteProductSchema,
  updateProductSchema,
} from "@/lib/validations/product";
import { fail, ok, toFieldErrors, type ActionResult } from "@/lib/action-result";

function revalidateProductViews(productId?: string): void {
  revalidatePath("/");
  revalidatePath("/admin/products");
  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { sku, title, description, price, stock, images } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { sku },
    select: { id: true },
  });
  if (existing) {
    return fail("A product with this SKU already exists.", {
      sku: ["SKU is already in use."],
    });
  }

  const product = await prisma.product.create({
    data: { sku, title, description, price, stock, images },
    select: { id: true },
  });

  revalidateProductViews(product.id);
  return ok({ id: product.id });
}

export async function updateProduct(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  const { id, ...fields } = parsed.data;

  // If the SKU is being changed, ensure it stays unique.
  if (fields.sku !== undefined) {
    const duplicate = await prisma.product.findFirst({
      where: { sku: fields.sku, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      return fail("A product with this SKU already exists.", {
        sku: ["SKU is already in use."],
      });
    }
  }

  const updated = await prisma.product.updateMany({
    where: { id },
    data: fields,
  });
  if (updated.count === 0) {
    return fail("Product not found.");
  }

  revalidateProductViews(id);
  return ok(undefined);
}

export async function deleteProduct(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = deleteProductSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the errors below.", toFieldErrors(parsed.error));
  }

  try {
    await prisma.product.delete({ where: { id: parsed.data.id } });
  } catch {
    // onDelete: Restrict blocks deletion of products referenced by orders,
    // and delete throws if the record does not exist.
    return fail(
      "This product cannot be deleted because it belongs to existing orders, or it no longer exists.",
    );
  }

  revalidateProductViews();
  return ok(undefined);
}
