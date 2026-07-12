import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <nav className="flex gap-2 rounded-lg border border-black/10 p-1 text-sm dark:border-white/10">
          <Link
            href="/admin/products"
            className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Orders
          </Link>
          <Link
            href="/admin/users"
            className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Users
          </Link>
          <Link
            href="/admin/reviews"
            className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Reviews
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
