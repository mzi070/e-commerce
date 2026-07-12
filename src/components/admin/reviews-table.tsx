"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReview } from "@/actions/review";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  AdminFeedback,
  AdminPanel,
  FilterChip,
  StatCard,
  toolbarInputClass,
} from "@/components/admin/admin-ui";
import { StarRating } from "@/components/products/star-rating";
import { formatDate } from "@/lib/format";
import type {
  AdminReviewStats,
  PaginatedReviews,
  ReviewSort,
  ReviewView,
} from "@/lib/queries/reviews";

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "rating-desc", label: "Highest rating" },
  { value: "rating-asc", label: "Lowest rating" },
];

interface AdminReviewsTableProps {
  data: PaginatedReviews;
  stats: AdminReviewStats;
  filters: {
    search: string;
    rating: string;
    sort: ReviewSort;
    lowRatingOnly: boolean;
  };
}

export function AdminReviewsTable({ data, stats, filters }: AdminReviewsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewView | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [ratingInput, setRatingInput] = useState(filters.rating);
  const [sortInput, setSortInput] = useState<ReviewSort>(filters.sort);
  const [lowRatingOnly, setLowRatingOnly] = useState(filters.lowRatingOnly);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.rating) count += 1;
    if (filters.lowRatingOnly) count += 1;
    if (filters.sort !== "newest") count += 1;
    return count;
  }, [filters]);

  function buildQuery(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    const values = {
      q: overrides.q ?? searchInput.trim(),
      rating: overrides.rating ?? ratingInput,
      sort: overrides.sort ?? sortInput,
      low: overrides.low ?? (lowRatingOnly ? "1" : ""),
      page: overrides.page,
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `/admin/reviews?${query}` : "/admin/reviews";
  }

  function applyFilters(page = "1"): void {
    router.push(buildQuery({ page: page === "1" ? undefined : page }));
  }

  function clearFilters(): void {
    setSearchInput("");
    setRatingInput("");
    setSortInput("newest");
    setLowRatingOnly(false);
    router.push("/admin/reviews");
  }

  function confirmDelete(): void {
    if (!deleteTarget) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteReview({ reviewId: deleteTarget.id });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess("Review deleted.");
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total reviews" value={stats.total} />
        <StatCard
          label="Average rating"
          value={stats.averageRating.toFixed(1)}
          tone="amber"
        />
        <StatCard label="5-star reviews" value={stats.fiveStar} tone="emerald" />
        <StatCard label="Low ratings (1–2★)" value={stats.lowRating} tone="red" />
      </div>

      <AdminPanel
        title="Reviews"
        description={`${data.total} result${data.total === 1 ? "" : "s"}${activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}`}
      >
        <div className="border-b border-black/10 p-4 dark:border-white/10">
          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.7fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search product, reviewer, or review text"
              className={toolbarInputClass}
            />
            <select
              value={ratingInput}
              onChange={(event) => setRatingInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Rating filter"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={String(rating)}>
                  {rating} star{rating === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <select
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as ReviewSort)}
              className={toolbarInputClass}
              aria-label="Sort reviews"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Apply
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterChip
              active={lowRatingOnly}
              label="Low ratings only"
              onClick={() => {
                const next = !lowRatingOnly;
                setLowRatingOnly(next);
                router.push(buildQuery({ low: next ? "1" : "", page: undefined }));
              }}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <AdminFeedback error={error} success={success} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      No reviews match your filters
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Try adjusting search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((review) => {
                  const expanded = expandedId === review.id;
                  return (
                    <tr
                      key={review.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/products/${review.productId}`}
                          target="_blank"
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {review.productTitle ?? "Product"}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {formatDate(review.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {review.authorName ?? "Customer"}
                        </p>
                        <p className="text-xs text-zinc-500">{review.authorEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                        <p className="mt-1 text-xs text-zinc-500">{review.rating}/5</p>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        {review.title && (
                          <p className="font-medium">{review.title}</p>
                        )}
                        <p className={expanded ? "text-zinc-600 dark:text-zinc-300" : "line-clamp-2 text-zinc-500"}>
                          {review.body}
                        </p>
                        {review.body.length > 120 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : review.id)
                            }
                            className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
                          >
                            {expanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/products/${review.productId}`}
                            target="_blank"
                            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                          >
                            View product
                          </Link>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setDeleteTarget(review)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          buildHref={(page) => buildQuery({ page: String(page) })}
        />
      </AdminPanel>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete review"
        message={
          deleteTarget
            ? `Delete this ${deleteTarget.rating}-star review from ${deleteTarget.authorEmail}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete review"
        variant="danger"
        isPending={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
