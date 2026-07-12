import { getProducts } from "@/lib/queries/products";
import { ProductTable } from "@/components/admin/product-table";

export const metadata = { title: "Manage products" };

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Products</h2>
      <ProductTable products={products} />
    </section>
  );
}
