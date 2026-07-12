import { Suspense } from "react";
import { getProducts, getProductCategories } from "@/lib/queries/products";
import { ProductCard } from "@/components/products/product-card";
import { CatalogToolbar } from "@/components/products/catalog-toolbar";

export const metadata = {
  title: "Shop all products",
  description: "Browse the full NextShop catalog.",
};

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "newest" | "price-asc" | "price-desc";
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({
      search: params.q,
      category: params.category,
      sort: params.sort ?? "newest",
    }),
    getProductCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-1 text-zinc-500">
          {products.length} product{products.length === 1 ? "" : "s"} found.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-400">Loading filters…</p>}>
        <CatalogToolbar
          categories={categories}
          currentCategory={params.category}
          currentSort={params.sort ?? "newest"}
          currentQuery={params.q ?? ""}
        />
      </Suspense>

      {products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
          <p>No products match your search.</p>
          <p className="mt-1 text-sm">Try clearing filters or browse all items.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
