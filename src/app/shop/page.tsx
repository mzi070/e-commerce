import { Suspense } from "react";
import {
  getProductCategories,
  getProductsPaginated,
  type ProductSort,
} from "@/lib/queries/products";
import { CatalogToolbar } from "@/components/products/catalog-toolbar";
import { CatalogGrid } from "@/components/shop/catalog-grid";

export const metadata = {
  title: "Shop all products",
  description: "Browse the full NextShop catalog.",
};

export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: ProductSort;
    page?: string;
    inStock?: string;
    deals?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const [result, categories] = await Promise.all([
    getProductsPaginated({
      search: params.q,
      category: params.category,
      sort: params.sort ?? "newest",
      page: Number.isFinite(page) ? page : 1,
      inStockOnly: params.inStock === "1",
      dealsOnly: params.deals === "1",
    }),
    getProductCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-1 text-zinc-500">
          {result.total} product{result.total === 1 ? "" : "s"} found.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-400">Loading filters…</p>}>
        <CatalogToolbar
          basePath="/shop"
          categories={categories}
          currentCategory={params.category}
          currentSort={params.sort ?? "newest"}
          currentQuery={params.q ?? ""}
          currentInStock={params.inStock === "1"}
          currentDeals={params.deals === "1"}
        />
      </Suspense>

      <CatalogGrid result={result} />
    </div>
  );
}
