"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/actions/product";
import { formatCurrency } from "@/lib/format";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import type { ProductListItem } from "@/lib/queries/products";

type ModalState = { mode: "create" } | { mode: "edit"; product: ProductListItem };

export function ProductTable({ products }: { products: ProductListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onDelete(product: ProductListItem): void {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct({ id: product.id });
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{products.length} products</p>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New product
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium">{product.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock > 0 ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", product })}
                        className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onDelete(product)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductFormModal
          mode={modal.mode}
          product={modal.mode === "edit" ? modal.product : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
