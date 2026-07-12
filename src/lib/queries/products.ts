import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ProductListItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  featured: boolean;
  stock: number;
  images: string[];
  category: string;
  createdAt: Date;
  averageRating: number | null;
  reviewCount: number;
}

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "popular"
  | "stock-asc"
  | "stock-desc"
  | "title-asc"
  | "title-desc";

export type ProductStockFilter = "in-stock" | "low" | "out-of-stock";

import { LOW_STOCK_THRESHOLD } from "@/lib/product-constants";

export interface AdminProductStats {
  total: number;
  featured: number;
  lowStock: number;
  outOfStock: number;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  sort?: ProductSort;
  inStockOnly?: boolean;
  stockFilter?: ProductStockFilter;
  minPriceCents?: number;
  maxPriceCents?: number;
  featured?: boolean;
  dealsOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 12;

type ProductRow = Prisma.ProductGetPayload<{
  include: {
    reviews: { select: { rating: true } };
  };
}>;

function serializeProduct(product: ProductRow): ProductListItem {
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : null;

  return {
    id: product.id,
    sku: product.sku,
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    featured: product.featured,
    stock: product.stock,
    images: product.images,
    category: product.category,
    createdAt: product.createdAt,
    averageRating,
    reviewCount,
  };
}

const productInclude = {
  reviews: { select: { rating: true } },
} as const;

function orderByForSort(sort: ProductSort = "newest") {
  switch (sort) {
    case "price-asc":
      return { priceCents: "asc" as const };
    case "price-desc":
      return { priceCents: "desc" as const };
    case "stock-asc":
      return { stock: "asc" as const };
    case "stock-desc":
      return { stock: "desc" as const };
    case "title-asc":
      return { title: "asc" as const };
    case "title-desc":
      return { title: "desc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const {
    search,
    category,
    inStockOnly,
    stockFilter,
    minPriceCents,
    maxPriceCents,
    featured,
    dealsOnly,
  } = query;

  const stockWhere =
    stockFilter === "in-stock"
      ? { stock: { gt: 0 } }
      : stockFilter === "low"
        ? { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } }
        : stockFilter === "out-of-stock"
          ? { stock: 0 }
          : inStockOnly
            ? { stock: { gt: 0 } }
            : {};

  return {
    ...(category ? { category } : {}),
    ...(featured ? { featured: true } : {}),
    ...stockWhere,
    ...(dealsOnly
      ? {
          compareAtPriceCents: { not: null },
          AND: [
            { compareAtPriceCents: { not: null } },
            // compareAt > price handled in app layer for Prisma simplicity
          ],
        }
      : {}),
    ...(minPriceCents !== undefined || maxPriceCents !== undefined
      ? {
          priceCents: {
            ...(minPriceCents !== undefined ? { gte: minPriceCents } : {}),
            ...(maxPriceCents !== undefined ? { lte: maxPriceCents } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/** List products with optional search, category filter, sort, and pagination. */
export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductListItem[]> {
  const result = await getProductsPaginated(query);
  return result.items;
}

export async function getProductsPaginated(
  query: ProductQuery = {},
): Promise<PaginatedProducts> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  const sort = query.sort ?? "newest";
  const where = buildWhere(query);

  let products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: orderByForSort(sort),
  });

  if (query.dealsOnly) {
    products = products.filter(
      (product) =>
        product.compareAtPriceCents !== null &&
        product.compareAtPriceCents > product.priceCents,
    );
  }

  if (sort === "rating") {
    products = [...products].sort((a, b) => {
      const avgA =
        a.reviews.length > 0
          ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length
          : 0;
      const avgB =
        b.reviews.length > 0
          ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
          : 0;
      return avgB - avgA;
    });
  }

  if (sort === "popular") {
    products = [...products].sort(
      (a, b) => b.reviews.length - a.reviews.length,
    );
  }

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = products.slice(start, start + pageSize).map(serializeProduct);

  return { items, total, page, pageSize, totalPages };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { featured: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProduct);
}

export async function getNewArrivals(limit = 8): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProduct);
}

export async function getDealProducts(limit = 8): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { compareAtPriceCents: { not: null } },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  return products
    .filter(
      (product) =>
        product.compareAtPriceCents !== null &&
        product.compareAtPriceCents > product.priceCents,
    )
    .slice(0, limit)
    .map(serializeProduct);
}

export async function getRelatedProducts(
  productId: string,
  category: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { category, id: { not: productId } },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProduct);
}

/** Fetch a single product by id, or null if not found. */
export async function getProductById(
  id: string,
): Promise<ProductListItem | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  return product ? serializeProduct(product) : null;
}

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

/** Category summaries with product counts for homepage tiles. */
export async function getCategorySummaries(): Promise<
  { category: string; count: number }[]
> {
  const rows = await prisma.product.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => ({
    category: row.category,
    count: row._count.category,
  }));
}

export async function getProductsByIds(ids: string[]): Promise<ProductListItem[]> {
  if (ids.length === 0) {
    return [];
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productInclude,
  });
  return products.map(serializeProduct);
}

export async function getAllProductIds(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { id: true } });
  return products.map((product) => product.id);
}

/** Summary counts for the admin products dashboard. */
export async function getAdminProductStats(): Promise<AdminProductStats> {
  const [total, featured, lowStock, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { featured: true } }),
    prisma.product.count({
      where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
    }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);

  return { total, featured, lowStock, outOfStock };
}
