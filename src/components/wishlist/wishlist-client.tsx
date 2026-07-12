"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { ProductCard } from "@/components/products/product-card";
import type { ProductListItem } from "@/lib/queries/products";

export function WishlistClient() {
  const { productIds, isHydrated, clearWishlist } = useWishlist();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/wishlist?ids=${productIds.join(",")}`)
      .then((res) => res.json())
      .then((data: { products: ProductListItem[] }) => {
        setProducts(data.products ?? []);
      })
      .finally(() => setLoading(false));
  }, [productIds, isHydrated]);

  if (!isHydrated || loading) {
    return <p className="text-zinc-500">Loading your wishlist…</p>;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 p-12 text-center text-zinc-500">
        <p>Your wishlist is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block font-medium text-indigo-600 hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{products.length} saved items</p>
        <button
          type="button"
          onClick={clearWishlist}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Clear wishlist
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
