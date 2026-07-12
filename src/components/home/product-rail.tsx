import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import type { ProductListItem } from "@/lib/queries/products";

export function ProductRail({
  title,
  products,
  href,
}: {
  title: string;
  products: ProductListItem[];
  href?: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-indigo-600 hover:underline">
            See more
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
