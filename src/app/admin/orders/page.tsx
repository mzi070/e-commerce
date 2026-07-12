import { getAllOrders } from "@/lib/queries/orders";
import { OrderBoard } from "@/components/admin/order-board";

export const metadata = { title: "Manage orders" };

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Order management</h2>
      <OrderBoard orders={orders} />
    </section>
  );
}
