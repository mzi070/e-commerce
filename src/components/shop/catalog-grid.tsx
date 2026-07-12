import { ProductCard } from "@/components/products/product-card";
import { CatalogPagination } from "@/components/shop/catalog-pagination";
import type { PaginatedProducts } from "@/lib/queries/products";

export function CatalogGrid({ result }: { result: PaginatedProducts }) {
  if (result.items.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
        <p>No products match your search.</p>
        <p className="mt-1 text-sm">Try clearing filters or browse all items.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <CatalogPagination result={result} />
    </>
  );
}
