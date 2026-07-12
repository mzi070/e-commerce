import { LOW_STOCK_THRESHOLD } from "@/lib/product-constants";
import type { ProductListItem } from "@/lib/queries/products";

const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className={`${badgeBase} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`}>
        Out of stock
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={`${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`}
      >
        Low stock ({stock})
      </span>
    );
  }

  return (
    <span
      className={`${badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}
    >
      In stock ({stock})
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span
      className={`${badgeBase} bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300`}
    >
      Featured
    </span>
  );
}

export function DealBadge({
  priceCents,
  compareAtPriceCents,
}: {
  priceCents: number;
  compareAtPriceCents: number | null;
}) {
  if (
    compareAtPriceCents === null ||
    compareAtPriceCents <= priceCents
  ) {
    return null;
  }

  const discount = Math.round(
    ((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100,
  );

  return (
    <span
      className={`${badgeBase} bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300`}
    >
      {discount}% off
    </span>
  );
}

export function ProductStatusBadges({ product }: { product: ProductListItem }) {
  const hasDeal =
    product.compareAtPriceCents !== null &&
    product.compareAtPriceCents > product.priceCents;

  return (
    <div className="flex flex-wrap gap-1.5">
      {product.featured && <FeaturedBadge />}
      {hasDeal && (
        <DealBadge
          priceCents={product.priceCents}
          compareAtPriceCents={product.compareAtPriceCents}
        />
      )}
      <StockBadge stock={product.stock} />
    </div>
  );
}
