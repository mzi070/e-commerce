import {
  getAdminProductStats,
  getProductCategories,
  getProductsPaginated,
  type ProductSort,
  type ProductStockFilter,
} from "@/lib/queries/products";
import { ProductTable } from "@/components/admin/product-table";

export const metadata = { title: "Manage products" };

export const dynamic = "force-dynamic";

const ADMIN_PAGE_SIZE = 20;

const SORT_VALUES: ProductSort[] = [
  "newest",
  "price-asc",
  "price-desc",
  "rating",
  "popular",
  "stock-asc",
  "stock-desc",
  "title-asc",
  "title-desc",
];

const STOCK_VALUES: ProductStockFilter[] = [
  "in-stock",
  "low",
  "out-of-stock",
];

interface AdminProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stock?: string;
    sort?: string;
    featured?: string;
    deals?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const stock = STOCK_VALUES.includes(params.stock as ProductStockFilter)
    ? (params.stock as ProductStockFilter)
    : undefined;
  const sort = SORT_VALUES.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "newest";
  const featuredOnly = params.featured === "1";
  const dealsOnly = params.deals === "1";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [data, stats, categories] = await Promise.all([
    getProductsPaginated({
      search: search || undefined,
      category: category || undefined,
      stockFilter: stock,
      sort,
      featured: featuredOnly || undefined,
      dealsOnly: dealsOnly || undefined,
      page,
      pageSize: ADMIN_PAGE_SIZE,
    }),
    getAdminProductStats(),
    getProductCategories(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage catalog inventory, pricing, images, and storefront visibility.
        </p>
      </div>
      <ProductTable
        data={data}
        stats={stats}
        categories={categories}
        filters={{
          search,
          category,
          stock: stock ?? "",
          sort,
          featuredOnly,
          dealsOnly,
        }}
      />
    </section>
  );
}
