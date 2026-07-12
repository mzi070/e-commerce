"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createReview, deleteReview } from "@/actions/review";
import { StarRating } from "@/components/products/star-rating";
import { formatDate } from "@/lib/format";
import type { ReviewView } from "@/lib/queries/reviews";

export function ReviewForm({
  productId,
  existingReview,
}: {
  productId: string;
  existingReview: ReviewView | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (existingReview) {
    return (
      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm text-zinc-500">You already reviewed this product.</p>
        <div className="mt-2">
          <StarRating rating={existingReview.rating} size="md" />
          <p className="mt-2 font-medium">{existingReview.title}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {existingReview.body}
          </p>
        </div>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createReview({
        productId,
        rating: Number(form.get("rating")),
        title: String(form.get("title") ?? "").trim() || undefined,
        body: String(form.get("body") ?? ""),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const inputClass =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <h3 className="font-semibold">Write a review</h3>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Rating</span>
          <select name="rating" defaultValue="5" className={inputClass}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} stars
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title (optional)</span>
          <input name="title" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Review</span>
          <textarea name="body" required rows={4} className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </form>
  );
}

export function ReviewsList({
  reviews,
  canModerate = false,
}: {
  reviews: ReviewView[];
  canModerate?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete(reviewId: string): void {
    if (!window.confirm("Delete this review?")) {
      return;
    }
    startTransition(async () => {
      await deleteReview({ reviewId });
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No reviews yet. Be the first to review.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">
                {review.authorName ?? review.authorEmail}
              </p>
              <p className="text-xs text-zinc-500">{formatDate(review.createdAt)}</p>
            </div>
            <StarRating rating={review.rating} size="md" />
          </div>
          {review.title && <p className="mt-2 font-medium">{review.title}</p>}
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {review.body}
          </p>
          {canModerate && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onDelete(review.id)}
              className="mt-3 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Delete review
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
