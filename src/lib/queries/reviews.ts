import { prisma } from "@/lib/prisma";

export interface ReviewView {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string;
  productTitle?: string;
}

export async function getReviewsForProduct(
  productId: string,
): Promise<ReviewView[]> {
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    authorName: review.user.name,
    authorEmail: review.user.email,
  }));
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string,
): Promise<ReviewView | null> {
  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!review) {
    return null;
  }
  return {
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    authorName: review.user.name,
    authorEmail: review.user.email,
  };
}

export async function getAllReviews(): Promise<ReviewView[]> {
  const result = await getReviewsPaginated();
  return result.items;
}

export type ReviewSort = "newest" | "oldest" | "rating-asc" | "rating-desc";

export interface ReviewQuery {
  search?: string;
  rating?: number;
  lowRatingOnly?: boolean;
  sort?: ReviewSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedReviews {
  items: ReviewView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminReviewStats {
  total: number;
  averageRating: number;
  fiveStar: number;
  lowRating: number;
}

const DEFAULT_REVIEW_PAGE_SIZE = 20;

function reviewOrderBy(sort: ReviewSort = "newest") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "rating-asc":
      return { rating: "asc" as const };
    case "rating-desc":
      return { rating: "desc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

function buildReviewWhere(query: ReviewQuery) {
  const search = query.search?.trim();

  return {
    ...(query.rating ? { rating: query.rating } : {}),
    ...(query.lowRatingOnly ? { rating: { lte: 2 } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { body: { contains: search, mode: "insensitive" as const } },
            { product: { title: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}

export async function getReviewsPaginated(
  query: ReviewQuery = {},
): Promise<PaginatedReviews> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    50,
    Math.max(1, query.pageSize ?? DEFAULT_REVIEW_PAGE_SIZE),
  );
  const where = buildReviewWhere(query);

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: reviewOrderBy(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      authorName: review.user.name,
      authorEmail: review.user.email,
      productTitle: review.product.title,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminReviewStats(): Promise<AdminReviewStats> {
  const [total, aggregate, fiveStar, lowRating] = await Promise.all([
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.count({ where: { rating: 5 } }),
    prisma.review.count({ where: { rating: { lte: 2 } } }),
  ]);

  return {
    total,
    averageRating: aggregate._avg.rating ?? 0,
    fiveStar,
    lowRating,
  };
}
