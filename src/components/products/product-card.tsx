import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductPrice } from "@/components/products/product-price";
import { StarRating } from "@/components/products/star-rating";
import { WishlistButton } from "@/components/products/wishlist-button";
import { formatCategoryLabel, categoryToSlug } from "@/lib/categories";
import type { ProductListItem } from "@/lib/queries/products";

export function ProductCard({ product }: { product: ProductListItem }) {
  const image = product.images[0] ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-950">
      <div className="relative">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105 motion-reduce:transition-none"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                No image
              </div>
            )}
          </div>
        </Link>
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} compact />
        </div>
        {product.featured && (
          <span className="absolute left-2 top-2 rounded bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/categories/${categoryToSlug(product.category)}`}
          className="text-xs uppercase tracking-wide text-indigo-600 hover:underline"
        >
          {formatCategoryLabel(product.category)}
        </Link>
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="line-clamp-2 font-medium">{product.title}</h3>
          {product.averageRating !== null && product.reviewCount > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={product.averageRating} />
              <span className="text-xs text-zinc-500">
                ({product.reviewCount})
              </span>
            </div>
          )}
        </Link>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <ProductPrice
            priceCents={product.priceCents}
            compareAtPriceCents={product.compareAtPriceCents}
            size="sm"
          />
          <span
            className={`text-xs ${
              product.stock > 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
          </span>
          <AddToCartButton
            meta={{
              productId: product.id,
              title: product.title,
              unitPriceCents: product.priceCents,
              image,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}
