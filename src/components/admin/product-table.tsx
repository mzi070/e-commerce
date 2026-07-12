"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/actions/product";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import { ProductStatusBadges } from "@/components/admin/product-badges";
import { formatCategoryLabel } from "@/lib/categories";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import type {
  AdminProductStats,
  PaginatedProducts,
  ProductListItem,
  ProductSort,
  ProductStockFilter,
} from "@/lib/queries/products";
import { StarRating } from "@/components/products/star-rating";

type ModalState = { mode: "create" } | { mode: "edit"; product: ProductListItem };

interface ProductTableProps {
  data: PaginatedProducts;
  stats: AdminProductStats;
  categories: string[];
  filters: {
    search: string;
    category: string;
    stock: string;
    sort: ProductSort;
    featuredOnly: boolean;
    dealsOnly: boolean;
  };
}

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most reviewed" },
];

export function ProductTable({
  data,
  stats,
  categories,
  filters,
}: ProductTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [categoryInput, setCategoryInput] = useState(filters.category);
  const [stockInput, setStockInput] = useState(filters.stock);
  const [sortInput, setSortInput] = useState<ProductSort>(filters.sort);
  const [featuredOnly, setFeaturedOnly] = useState(filters.featuredOnly);
  const [dealsOnly, setDealsOnly] = useState(filters.dealsOnly);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.category) count += 1;
    if (filters.stock) count += 1;
    if (filters.featuredOnly) count += 1;
    if (filters.dealsOnly) count += 1;
    if (filters.sort !== "newest") count += 1;
    return count;
  }, [filters]);

  function buildQuery(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    const values = {
      q: overrides.q ?? searchInput.trim(),
      category: overrides.category ?? categoryInput,
      stock: overrides.stock ?? stockInput,
      sort: overrides.sort ?? sortInput,
      featured: overrides.featured ?? (featuredOnly ? "1" : ""),
      deals: overrides.deals ?? (dealsOnly ? "1" : ""),
      page: overrides.page,
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value);
      }
    }

    const query = params.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  function applyFilters(page = "1"): void {
    router.push(buildQuery({ page: page === "1" ? undefined : page }));
  }

  function clearFilters(): void {
    setSearchInput("");
    setCategoryInput("");
    setStockInput("");
    setSortInput("newest");
    setFeaturedOnly(false);
    setDealsOnly(false);
    router.push("/admin/products");
  }

  function confirmDelete(): void {
    if (!deleteTarget) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteProduct({ id: deleteTarget.id });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(`"${deleteTarget.title}" was deleted.`);
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total products" value={stats.total} />
        <StatCard label="Featured" value={stats.featured} tone="indigo" />
        <StatCard label="Low stock" value={stats.lowStock} tone="amber" />
        <StatCard label="Out of stock" value={stats.outOfStock} tone="red" />
      </div>

      <div className="rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="border-b border-black/10 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Catalog</h3>
              <p className="text-sm text-zinc-500">
                {data.total} result{data.total === 1 ? "" : "s"}
                {activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: "create" })}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon />
              Add product
            </button>
          </div>

          <form
            className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search title, SKU, or description"
              className={toolbarInputClass}
            />
            <select
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Category filter"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryLabel(category)}
                </option>
              ))}
            </select>
            <select
              value={stockInput}
              onChange={(event) => setStockInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Stock filter"
            >
              <option value="">All stock levels</option>
              <option value="in-stock">In stock</option>
              <option value="low">Low stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
            <select
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as ProductSort)}
              className={toolbarInputClass}
              aria-label="Sort products"
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
              active={featuredOnly}
              label="Featured only"
              onClick={() => {
                const next = !featuredOnly;
                setFeaturedOnly(next);
                router.push(buildQuery({ featured: next ? "1" : "", page: undefined }));
              }}
            />
            <FilterChip
              active={dealsOnly}
              label="Deals only"
              onClick={() => {
                const next = !dealsOnly;
                setDealsOnly(next);
                router.push(buildQuery({ deals: next ? "1" : "", page: undefined }));
              }}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {success && (
          <p className="mx-4 mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {success}
          </p>
        )}
        {error && (
          <p className="mx-4 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reviews</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      No products match your filters
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Try adjusting search or filters, or add a new product.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "create" })}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Add product
                    </button>
                  </td>
                </tr>
              ) : (
                data.items.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    isPending={isPending}
                    onEdit={() => setModal({ mode: "edit", product })}
                    onDelete={() => setDeleteTarget(product)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          buildHref={(page) => buildQuery({ page: String(page) })}
        />
      </div>

      {modal && (
        <ProductFormModal
          mode={modal.mode}
          product={modal.mode === "edit" ? modal.product : undefined}
          categories={categories}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This cannot be undone and will fail if the product is linked to existing orders.`
            : ""
        }
        confirmLabel="Delete product"
        variant="danger"
        isPending={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ProductRow({
  product,
  isPending,
  onEdit,
  onDelete,
}: {
  product: ProductListItem;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const image = product.images[0] ?? null;
  const hasDeal =
    product.compareAtPriceCents !== null &&
    product.compareAtPriceCents > product.priceCents;

  return (
    <tr className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-900">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={product.title}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{product.title}</p>
            <p className="text-xs text-zinc-500">
              {formatCategoryLabel(product.category)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{product.sku}</td>
      <td className="px-4 py-3">
        <p className="font-medium">{formatCurrencyFromCents(product.priceCents)}</p>
        {hasDeal && product.compareAtPriceCents !== null && (
          <p className="text-xs text-zinc-400 line-through">
            {formatCurrencyFromCents(product.compareAtPriceCents)}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <ProductStatusBadges product={product} />
      </td>
      <td className="px-4 py-3">
        {product.reviewCount > 0 && product.averageRating !== null ? (
          <div className="space-y-1">
            <StarRating rating={product.averageRating} size="sm" />
            <p className="text-xs text-zinc-500">{product.reviewCount} reviews</p>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">No reviews</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {formatDate(product.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1.5">
          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            View
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "indigo" | "amber" | "red";
}) {
  const toneClass =
    tone === "indigo"
      ? "text-indigo-600 dark:text-indigo-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "red"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "border border-black/15 text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

const toolbarInputClass =
  "rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15";

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
