"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/product";
import type { FieldErrors } from "@/lib/action-result";
import type { ProductListItem } from "@/lib/queries/products";

interface ProductFormModalProps {
  mode: "create" | "edit";
  product?: ProductListItem;
  onClose: () => void;
}

function fieldError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

export function ProductFormModal({
  mode,
  product,
  onClose,
}: ProductFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const images = String(form.get("images") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const base = {
      sku: String(form.get("sku") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      price: String(form.get("price") ?? ""),
      stock: String(form.get("stock") ?? ""),
      images,
    };

    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(base)
          : await updateProduct({ id: product?.id ?? "", ...base });
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const inputClass =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "New product" : "Edit product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-h-[70vh] overflow-y-auto px-5 py-4"
          noValidate
        >
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">SKU</span>
              <input name="sku" defaultValue={product?.sku} required className={inputClass} />
              {fieldError(fieldErrors, "sku") && (
                <span className="text-xs text-red-600">{fieldError(fieldErrors, "sku")}</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Title</span>
              <input name="title" defaultValue={product?.title} required className={inputClass} />
              {fieldError(fieldErrors, "title") && (
                <span className="text-xs text-red-600">{fieldError(fieldErrors, "title")}</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Price</span>
              <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required className={inputClass} />
              {fieldError(fieldErrors, "price") && (
                <span className="text-xs text-red-600">{fieldError(fieldErrors, "price")}</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Stock</span>
              <input name="stock" type="number" min="0" step="1" defaultValue={product?.stock} required className={inputClass} />
              {fieldError(fieldErrors, "stock") && (
                <span className="text-xs text-red-600">{fieldError(fieldErrors, "stock")}</span>
              )}
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea name="description" defaultValue={product?.description} required rows={3} className={inputClass} />
            {fieldError(fieldErrors, "description") && (
              <span className="text-xs text-red-600">{fieldError(fieldErrors, "description")}</span>
            )}
          </label>

          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="font-medium">Image URLs (one per line)</span>
            <textarea
              name="images"
              defaultValue={product?.images.join("\n")}
              rows={3}
              placeholder="https://example.com/image.jpg"
              className={inputClass}
            />
            {fieldError(fieldErrors, "images") && (
              <span className="text-xs text-red-600">{fieldError(fieldErrors, "images")}</span>
            )}
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
