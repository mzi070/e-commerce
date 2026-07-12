import {
  getAdminUserStats,
  getUsersPaginated,
  type UserSort,
} from "@/lib/queries/users";
import { UserTable } from "@/components/admin/user-table";
import type { Role, UserStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Manage users" };

export const dynamic = "force-dynamic";

const SORT_VALUES: UserSort[] = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "orders-desc",
];

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    sort?: string;
    admins?: string;
    suspended?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const role =
    params.role === "CUSTOMER" || params.role === "ADMIN"
      ? (params.role as Role)
      : params.admins === "1"
        ? "ADMIN"
        : undefined;
  const status =
    params.status === "ACTIVE" || params.status === "SUSPENDED"
      ? (params.status as UserStatus)
      : params.suspended === "1"
        ? "SUSPENDED"
        : undefined;
  const sort = SORT_VALUES.includes(params.sort as UserSort)
    ? (params.sort as UserSort)
    : "newest";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [data, stats] = await Promise.all([
    getUsersPaginated({
      search: search || undefined,
      role,
      status,
      sort,
      page,
    }),
    getAdminUserStats(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage accounts, roles, access status, and password resets.
        </p>
      </div>
      <UserTable
        data={data}
        stats={stats}
        filters={{
          search,
          role: role ?? "",
          status: status ?? "",
          sort,
          adminsOnly: params.admins === "1",
          suspendedOnly: params.suspended === "1",
        }}
      />
    </section>
  );
}
