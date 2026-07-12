"use client";

import { useCart, type AddToCartMeta } from "@/components/providers/cart-provider";

interface AddToCartButtonProps {
  meta: AddToCartMeta;
  quantity?: number;
  className?: string;
  label?: string;
}

export function AddToCartButton({
  meta,
  quantity = 1,
  className,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const soldOut = meta.stock <= 0;

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => addItem(meta, quantity)}
      className={
        className ??
        "w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {soldOut ? "Sold out" : label}
    </button>
  );
}
