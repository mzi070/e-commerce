import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getProductCategories,
  getProductsPaginated,
  type ProductSort,
} from "@/lib/queries/products";
import { formatCategoryLabel, slugToCategory } from "@/lib/categories";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CatalogToolbar } from "@/components/products/catalog-toolbar";
import { CatalogGrid } from "@/components/shop/catalog-grid";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: ProductSort;
    page?: string;
    inStock?: string;
    deals?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  return {
    title: `${formatCategoryLabel(slugToCategory(slug))} | NextShop`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = slugToCategory(slug);
  const categories = await getProductCategories();

  if (!categories.includes(category)) {
    notFound();
  }

  const page = Number(query.page ?? "1");
  const basePath = `/categories/${slug}`;
  const result = await getProductsPaginated({
    category,
    search: query.q,
    sort: query.sort ?? "newest",
    page: Number.isFinite(page) ? page : 1,
    inStockOnly: query.inStock === "1",
    dealsOnly: query.deals === "1",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          { label: formatCategoryLabel(category) },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {formatCategoryLabel(category)}
        </h1>
        <p className="mt-1 text-zinc-500">
          {result.total} product{result.total === 1 ? "" : "s"} in this category.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-400">Loading filters…</p>}>
        <CatalogToolbar
          basePath={basePath}
          categories={categories}
          currentCategory={category}
          currentSort={query.sort ?? "newest"}
          currentQuery={query.q ?? ""}
          currentInStock={query.inStock === "1"}
          currentDeals={query.deals === "1"}
        />
      </Suspense>

      <CatalogGrid result={result} />
    </div>
  );
}
