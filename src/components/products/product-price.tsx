import { formatCurrencyFromCents } from "@/lib/format";

export function ProductPrice({
  priceCents,
  compareAtPriceCents,
  size = "md",
}: {
  priceCents: number;
  compareAtPriceCents?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const hasDeal =
    compareAtPriceCents !== null &&
    compareAtPriceCents !== undefined &&
    compareAtPriceCents > priceCents;

  const sizeClass =
    size === "lg"
      ? "text-3xl"
      : size === "sm"
        ? "text-base"
        : "text-lg";

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-semibold text-zinc-900 dark:text-zinc-100 ${sizeClass}`}>
        {formatCurrencyFromCents(priceCents)}
      </span>
      {hasDeal && (
        <>
          <span className="text-sm text-zinc-400 line-through">
            {formatCurrencyFromCents(compareAtPriceCents)}
          </span>
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            Deal
          </span>
        </>
      )}
    </div>
  );
}
