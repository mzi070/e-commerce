"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, type FormEvent } from "react";

interface CatalogToolbarProps {
  categories: string[];
  currentCategory?: string;
  currentSort: string;
  currentQuery: string;
}

export function CatalogToolbar({
  categories,
  currentCategory,
  currentSort,
  currentQuery,
}: CatalogToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function onSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateParams({ q: String(form.get("q") ?? "").trim() || undefined });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-end">
      <form onSubmit={onSearch} className="flex flex-1 gap-2">
        <label className="sr-only" htmlFor="catalog-search">
          Search products
        </label>
        <input
          id="catalog-search"
          name="q"
          type="search"
          defaultValue={currentQuery}
          placeholder="Search by name, SKU, or description"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15"
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Category
          <select
            value={currentCategory ?? ""}
            onChange={(event) =>
              updateParams({ category: event.target.value || undefined })
            }
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Sort
          <select
            value={currentSort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      {isPending && (
        <p className="text-xs text-zinc-400" aria-live="polite">
          Updating results…
        </p>
      )}
    </div>
  );
}
