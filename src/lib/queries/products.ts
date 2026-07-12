import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ProductListItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: string;
  stock: number;
  images: string[];
  createdAt: Date;
}

/** Serialize a Prisma product (Decimal price) into plain, client-safe data. */
function serializeProduct(product: Prisma.ProductModel): ProductListItem {
  return {
    id: product.id,
    sku: product.sku,
    title: product.title,
    description: product.description,
    price: product.price.toFixed(2),
    stock: product.stock,
    images: product.images,
    createdAt: product.createdAt,
  };
}

/** List products for the storefront/admin, newest first. */
export async function getProducts(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return products.map(serializeProduct);
}

/** Fetch a single product by id, or null if not found. */
export async function getProductById(
  id: string,
): Promise<ProductListItem | null> {
  const product = await prisma.product.findUnique({ where: { id } });
  return product ? serializeProduct(product) : null;
}
