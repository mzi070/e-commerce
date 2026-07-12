import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getAllProductIds,
  getProductById,
} from "@/lib/queries/products";
import { ProductPurchase } from "@/components/products/product-purchase";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { formatCurrencyFromCents } from "@/lib/format";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return { title: "Product not found" };
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `${siteUrl}/products/${product.id}` },
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images.length > 0 ? product.images : undefined,
      url: `${siteUrl}/products/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

  const image = product.images[0] ?? null;

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-900">
            <div className="relative aspect-square w-full">
              {image ? (
                <Image
                  src={image}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  No image
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                {product.category} · SKU: {product.sku}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {product.title}
              </h1>
            </div>

            <p className="text-2xl font-semibold">
              {formatCurrencyFromCents(product.priceCents)}
            </p>

            <p
              className={`text-sm ${
                product.stock > 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {product.stock > 0
                ? `${product.stock} in stock`
                : "Currently sold out"}
            </p>

            <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>

            <div className="mt-2">
              <ProductPurchase
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
        </div>
      </div>
    </>
  );
}
