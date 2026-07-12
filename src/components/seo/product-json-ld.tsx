import type { ProductListItem } from "@/lib/queries/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function ProductJsonLd({ product }: { product: ProductListItem }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    image: product.images,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
