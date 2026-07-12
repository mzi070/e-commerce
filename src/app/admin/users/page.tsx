import { getUsers } from "@/lib/queries/users";
import { UserTable } from "@/components/admin/user-table";

export const metadata = { title: "Manage users" };

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const { q } = await searchParams;
  const users = await getUsers({ search: q });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Users</h2>
      <UserTable users={users} search={q ?? ""} />
    </section>
  );
}
