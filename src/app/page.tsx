import {
  getCategorySummaries,
  getDealProducts,
  getFeaturedProducts,
  getNewArrivals,
} from "@/lib/queries/products";
import { HeroBanner, CategoryGrid } from "@/components/home/home-sections";
import { ProductRail } from "@/components/home/product-rail";

export const metadata = {
  title: "NextShop - Online Shopping",
  description:
    "Shop apparel, home goods, and accessories with fast delivery options.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [featured, newArrivals, deals, categories] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getDealProducts(4),
    getCategorySummaries(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-10">
        <HeroBanner />
        <CategoryGrid categories={categories} />
        <ProductRail title="Featured picks" products={featured} href="/shop" />
        <ProductRail title="New arrivals" products={newArrivals} href="/shop" />
        <ProductRail title="Today's deals" products={deals} href="/shop?deals=1" />
      </div>
    </div>
  );
}
