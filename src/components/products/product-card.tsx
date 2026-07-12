import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { formatCurrency } from "@/lib/format";
import type { ProductListItem } from "@/lib/queries/products";

export function ProductCard({ product }: { product: ProductListItem }) {
  const image = product.images[0] ?? null;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-950">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="line-clamp-1 font-medium">{product.title}</h3>
          <p className="line-clamp-2 text-sm text-zinc-500">
            {product.description}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold">
            {formatCurrency(product.price)}
          </span>
          <span
            className={`text-xs ${
              product.stock > 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
          </span>
        </div>

        <AddToCartButton
          meta={{
            productId: product.id,
            title: product.title,
            unitPrice: product.price,
            image,
            stock: product.stock,
          }}
        />
      </div>
    </div>
  );
}
