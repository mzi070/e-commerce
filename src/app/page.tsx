import { getProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/products/product-card";

export const metadata = {
  title: "Shop all products",
  description: "Browse the full NextShop catalog.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-1 text-zinc-500">
          {products.length} product{products.length === 1 ? "" : "s"} available.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500 dark:border-white/15">
          No products yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
