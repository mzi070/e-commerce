import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllProductIds,
  getProductById,
  getRelatedProducts,
} from "@/lib/queries/products";
import { getReviewsForProduct, getUserReviewForProduct } from "@/lib/queries/reviews";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCategoryLabel, categoryToSlug } from "@/lib/categories";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ImageGallery } from "@/components/products/image-gallery";
import { ProductPrice } from "@/components/products/product-price";
import { ProductPurchase } from "@/components/products/product-purchase";
import { ProductCard } from "@/components/products/product-card";
import { StarRating } from "@/components/products/star-rating";
import { WishlistButton } from "@/components/products/wishlist-button";
import { ReviewForm, ReviewsList } from "@/components/products/reviews-section";
import { ProductJsonLd } from "@/components/seo/product-json-ld";

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

  const user = await getCurrentUser();
  const [reviews, related, userReview] = await Promise.all([
    getReviewsForProduct(id),
    getRelatedProducts(id, product.category),
    user ? getUserReviewForProduct(user.id, id) : Promise.resolve(null),
  ]);

  const image = product.images[0] ?? null;

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            {
              label: formatCategoryLabel(product.category),
              href: `/categories/${categoryToSlug(product.category)}`,
            },
            { label: product.title },
          ]}
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ImageGallery images={product.images} title={product.title} />

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  {formatCategoryLabel(product.category)} · SKU: {product.sku}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  {product.title}
                </h1>
              </div>
              <WishlistButton productId={product.id} />
            </div>

            {product.averageRating !== null && product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating} size="md" />
                <span className="text-sm text-zinc-500">
                  {product.averageRating.toFixed(1)} ({product.reviewCount}{" "}
                  review{product.reviewCount === 1 ? "" : "s"})
                </span>
              </div>
            )}

            <ProductPrice
              priceCents={product.priceCents}
              compareAtPriceCents={product.compareAtPriceCents}
              size="lg"
            />

            <p
              className={`text-sm ${
                product.stock > 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {product.stock > 0
                ? `In stock (${product.stock} available)`
                : "Currently sold out"}
            </p>

            <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>

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

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-4 text-xl font-bold">Related products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold">Customer reviews</h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {user ? (
              <ReviewForm productId={id} existingReview={userReview} />
            ) : (
              <p className="text-sm text-zinc-500">
                <a href="/login" className="font-medium text-indigo-600 hover:underline">
                  Sign in
                </a>{" "}
                to write a review.
              </p>
            )}
            <ReviewsList
              reviews={reviews}
              canModerate={user?.role === "ADMIN"}
            />
          </div>
        </section>
      </div>
    </>
  );
}
