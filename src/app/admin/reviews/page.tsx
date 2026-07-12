import { AdminReviewsTable } from "@/components/admin/reviews-table";
import {
  getAdminReviewStats,
  getReviewsPaginated,
  type ReviewSort,
} from "@/lib/queries/reviews";

export const metadata = { title: "Manage reviews" };

export const dynamic = "force-dynamic";

const SORT_VALUES: ReviewSort[] = [
  "newest",
  "oldest",
  "rating-asc",
  "rating-desc",
];

interface AdminReviewsPageProps {
  searchParams: Promise<{
    q?: string;
    rating?: string;
    sort?: string;
    low?: string;
    page?: string;
  }>;
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const rating = [1, 2, 3, 4, 5].includes(Number(params.rating))
    ? Number(params.rating)
    : undefined;
  const sort = SORT_VALUES.includes(params.sort as ReviewSort)
    ? (params.sort as ReviewSort)
    : "newest";
  const lowRatingOnly = params.low === "1";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [data, stats] = await Promise.all([
    getReviewsPaginated({
      search: search || undefined,
      rating,
      lowRatingOnly: lowRatingOnly || undefined,
      sort,
      page,
    }),
    getAdminReviewStats(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Reviews</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Moderate customer feedback, filter by rating, and remove inappropriate reviews.
        </p>
      </div>
      <AdminReviewsTable
        data={data}
        stats={stats}
        filters={{
          search,
          rating: rating ? String(rating) : "",
          sort,
          lowRatingOnly,
        }}
      />
    </section>
  );
}
