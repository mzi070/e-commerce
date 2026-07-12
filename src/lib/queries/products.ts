import { prisma } from "@/lib/prisma";

export interface ProductListItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  images: string[];
  category: string;
  createdAt: Date;
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export interface ProductQuery {
  search?: string;
  category?: string;
  sort?: ProductSort;
}

function serializeProduct(
  product: Awaited<ReturnType<typeof prisma.product.findFirst>>,
): ProductListItem | null {
  if (!product) {
    return null;
  }
  return {
    id: product.id,
    sku: product.sku,
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    stock: product.stock,
    images: product.images,
    category: product.category,
    createdAt: product.createdAt,
  };
}

function orderByForSort(sort: ProductSort = "newest") {
  switch (sort) {
    case "price-asc":
      return { priceCents: "asc" as const };
    case "price-desc":
      return { priceCents: "desc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

/** List products with optional search, category filter, and sort. */
export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductListItem[]> {
  const { search, category, sort = "newest" } = query;

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: orderByForSort(sort),
  });

  return products.map((product) => serializeProduct(product)!);
}

/** Fetch a single product by id, or null if not found. */
export async function getProductById(
  id: string,
): Promise<ProductListItem | null> {
  const product = await prisma.product.findUnique({ where: { id } });
  return serializeProduct(product);
}

/** Alias matching the spec naming convention. */
export const getProduct = getProductById;

/** Distinct product categories for catalog filters. */
export async function getProductCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

/** Load products by id list — used for server-side re-pricing. */
export async function getProductsByIds(ids: string[]): Promise<ProductListItem[]> {
  if (ids.length === 0) {
    return [];
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  return products.map((product) => serializeProduct(product)!);
}

/** All product ids for static generation. */
export async function getAllProductIds(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { id: true } });
  return products.map((product) => product.id);
}
