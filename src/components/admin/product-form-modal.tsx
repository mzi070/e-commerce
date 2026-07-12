"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/product";
import { formatCategoryLabel } from "@/lib/categories";
import type { FieldErrors } from "@/lib/action-result";
import type { ProductListItem } from "@/lib/queries/products";
import { formatCents } from "@/lib/money";

interface ProductFormModalProps {
  mode: "create" | "edit";
  product?: ProductListItem;
  categories: string[];
  onClose: () => void;
}

function fieldError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15";

const sectionClass =
  "rounded-xl border border-black/10 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]";

export function ProductFormModal({
  mode,
  product,
  categories,
  onClose,
}: ProductFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageDraft, setImageDraft] = useState("");
  const [priceInput, setPriceInput] = useState(
    product ? formatCents(product.priceCents) : "",
  );
  const [compareAtInput, setCompareAtInput] = useState(
    product?.compareAtPriceCents
      ? formatCents(product.compareAtPriceCents)
      : "",
  );
  const [description, setDescription] = useState(product?.description ?? "");

  const discountPreview = useMemo(() => {
    const price = Number(priceInput);
    const compareAt = Number(compareAtInput);
    if (
      !Number.isFinite(price) ||
      !Number.isFinite(compareAt) ||
      compareAt <= price ||
      price <= 0
    ) {
      return null;
    }
    return Math.round(((compareAt - price) / compareAt) * 100);
  }, [compareAtInput, priceInput]);

  function addImageUrl(): void {
    const trimmed = imageDraft.trim();
    if (!trimmed) {
      return;
    }
    if (images.includes(trimmed)) {
      setFieldErrors((current) => ({
        ...current,
        images: ["This image URL is already added."],
      }));
      return;
    }
    if (images.length >= 10) {
      setFieldErrors((current) => ({
        ...current,
        images: ["You can add up to 10 images."],
      }));
      return;
    }
    setImages((current) => [...current, trimmed]);
    setImageDraft("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.images;
      return next;
    });
  }

  function removeImage(url: string): void {
    setImages((current) => current.filter((item) => item !== url));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const compareAtPrice = compareAtInput.trim();

    const base = {
      sku: String(form.get("sku") ?? ""),
      title: String(form.get("title") ?? ""),
      description,
      category: String(form.get("category") ?? ""),
      price: priceInput,
      compareAtPrice: compareAtPrice.length > 0 ? compareAtPrice : undefined,
      featured,
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              {mode === "create" ? "Create" : "Edit"}
            </p>
            <h2 className="text-xl font-semibold">
              {mode === "create" ? "Add product" : "Edit product"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Fill in product details, pricing, images, and storefront visibility.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <section className={sectionClass}>
              <SectionHeading
                title="Basic information"
                description="Core product identity shown across the storefront."
              />
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="SKU" error={fieldError(fieldErrors, "sku")}>
                  <input
                    name="sku"
                    defaultValue={product?.sku}
                    required
                    placeholder="e.g. TSHIRT-001"
                    className={inputClass}
                  />
                </Field>
                <Field label="Title" error={fieldError(fieldErrors, "title")}>
                  <input
                    name="title"
                    defaultValue={product?.title}
                    required
                    placeholder="Product name"
                    className={inputClass}
                  />
                </Field>
                <Field label="Category" error={fieldError(fieldErrors, "category")}>
                  <input
                    name="category"
                    list="product-categories"
                    defaultValue={product?.category ?? "general"}
                    required
                    placeholder="e.g. electronics"
                    className={inputClass}
                  />
                  <datalist id="product-categories">
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {formatCategoryLabel(category)}
                      </option>
                    ))}
                  </datalist>
                </Field>
                <Field label="Stock quantity" error={fieldError(fieldErrors, "stock")}>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={product?.stock ?? 0}
                    required
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field
                  label="Description"
                  error={fieldError(fieldErrors, "description")}
                  hint={`${description.length} / 5000`}
                >
                  <textarea
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    rows={4}
                    placeholder="Describe materials, sizing, warranty, and key selling points."
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>

            <section className={sectionClass}>
              <SectionHeading
                title="Pricing"
                description="Set selling price and optional compare-at price for deal badges."
              />
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Price (USD)" error={fieldError(fieldErrors, "price")}>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    required
                    placeholder="0.00"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Compare-at price (USD)"
                  error={fieldError(fieldErrors, "compareAtPrice")}
                  hint="Optional original price for sale badges"
                >
                  <input
                    name="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtInput}
                    onChange={(event) => setCompareAtInput(event.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </Field>
              </div>
              {discountPreview !== null && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  Customers will see a <strong>{discountPreview}% off</strong> deal badge.
                </p>
              )}
            </section>

            <section className={sectionClass}>
              <SectionHeading
                title="Images"
                description="Add HTTPS image URLs. The first image is used as the primary thumbnail."
              />
              <div className="mt-4 flex gap-2">
                <input
                  type="url"
                  value={imageDraft}
                  onChange={(event) => setImageDraft(event.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className={inputClass}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="shrink-0 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Add
                </button>
              </div>
              {fieldError(fieldErrors, "images") && (
                <p className="mt-2 text-xs text-red-600">
                  {fieldError(fieldErrors, "images")}
                </p>
              )}
              {images.length > 0 ? (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url, index) => (
                    <li
                      key={url}
                      className="group relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
                    >
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="truncate text-xs text-white">
                          {index === 0 ? "Primary" : `Image ${index + 1}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15">
                  No images yet. Paste a secure HTTPS URL to preview thumbnails.
                </div>
              )}
            </section>

            <section className={sectionClass}>
              <SectionHeading
                title="Visibility"
                description="Control where this product appears on the storefront."
              />
              <label className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950">
                <div>
                  <p className="text-sm font-medium">Feature on homepage</p>
                  <p className="text-xs text-zinc-500">
                    Show in the featured products section on the home page.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={featured}
                  onClick={() => setFeatured((current) => !current)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    featured ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      featured ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
            <p className="text-xs text-zinc-500">
              {mode === "create"
                ? "Product goes live immediately after saving."
                : "Changes apply to the storefront after saving."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isPending ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center justify-between gap-2 font-medium">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-zinc-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
