import Link from "next/link";
import { formatCategoryLabel, categoryToSlug } from "@/lib/categories";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 px-6 py-12 text-white sm:px-10 sm:py-16">
      <div className="relative z-10 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">
          Welcome to NextShop
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          Everything you need, delivered your way
        </h1>
        <p className="mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">
          Browse thousands of products across apparel, home, and accessories.
          Fast checkout with bank transfer or cash on delivery.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Shop all products
          </Link>
          <Link
            href="/shop?deals=1"
            className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Today&apos;s deals
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
    </section>
  );
}

export function CategoryGrid({
  categories,
}: {
  categories: { category: string; count: number }[];
}) {
  const colors = [
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Shop by category</h2>
        <Link href="/shop" className="text-sm font-medium text-indigo-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((item, index) => (
          <Link
            key={item.category}
            href={`/categories/${categoryToSlug(item.category)}`}
            className={`rounded-xl p-4 transition-transform hover:-translate-y-0.5 ${colors[index % colors.length]}`}
          >
            <p className="font-semibold">{formatCategoryLabel(item.category)}</p>
            <p className="mt-1 text-xs opacity-70">{item.count} items</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
