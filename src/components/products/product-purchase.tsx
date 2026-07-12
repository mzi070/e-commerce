"use client";

import { useState } from "react";
import { useCart, type AddToCartMeta } from "@/components/providers/cart-provider";

export function ProductPurchase({ meta }: { meta: AddToCartMeta }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const soldOut = meta.stock <= 0;
  const maxReached = meta.stock > 0 && quantity >= meta.stock;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">Quantity</span>
        <div className="flex items-center rounded-md border border-black/15 dark:border-white/15">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
          >
            -
          </button>
          <span className="min-w-10 text-center">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={soldOut || maxReached}
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-1.5 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => addItem(meta, quantity)}
        className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
      >
        {soldOut ? "Sold out" : "Add to cart"}
      </button>
    </div>
  );
}
