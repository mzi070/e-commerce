"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateUser, suspendUser } from "@/actions/user";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  AdminFeedback,
  AdminPanel,
  FilterChip,
  StatCard,
  toolbarInputClass,
} from "@/components/admin/admin-ui";
import { UserFormModal } from "@/components/admin/user-form-modal";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import { formatDate } from "@/lib/format";
import type { Role } from "@/generated/prisma/enums";
import type {
  AdminUserStats,
  PaginatedUsers,
  UserListItem,
  UserSort,
} from "@/lib/queries/users";

const SORT_OPTIONS: { value: UserSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "orders-desc", label: "Most orders" },
];

interface UserTableProps {
  data: PaginatedUsers;
  stats: AdminUserStats;
  filters: {
    search: string;
    role: string;
    status: string;
    sort: UserSort;
    adminsOnly: boolean;
    suspendedOnly: boolean;
  };
}

export function UserTable({ data, stats, filters }: UserTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [roleInput, setRoleInput] = useState(filters.role);
  const [statusInput, setStatusInput] = useState(filters.status);
  const [sortInput, setSortInput] = useState<UserSort>(filters.sort);
  const [adminsOnly, setAdminsOnly] = useState(filters.adminsOnly);
  const [suspendedOnly, setSuspendedOnly] = useState(filters.suspendedOnly);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.role) count += 1;
    if (filters.status) count += 1;
    if (filters.adminsOnly) count += 1;
    if (filters.suspendedOnly) count += 1;
    if (filters.sort !== "newest") count += 1;
    return count;
  }, [filters]);

  function buildQuery(overrides: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    const values = {
      q: overrides.q ?? searchInput.trim(),
      role: overrides.role ?? roleInput,
      status: overrides.status ?? statusInput,
      sort: overrides.sort ?? sortInput,
      admins: overrides.admins ?? (adminsOnly ? "1" : ""),
      suspended: overrides.suspended ?? (suspendedOnly ? "1" : ""),
      page: overrides.page,
    };

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `/admin/users?${query}` : "/admin/users";
  }

  function applyFilters(page = "1"): void {
    router.push(buildQuery({ page: page === "1" ? undefined : page }));
  }

  function clearFilters(): void {
    setSearchInput("");
    setRoleInput("");
    setStatusInput("");
    setSortInput("newest");
    setAdminsOnly(false);
    setSuspendedOnly(false);
    router.push("/admin/users");
  }

  function confirmStatusChange(): void {
    if (!statusTarget) return;

    setError(null);
    startTransition(async () => {
      const result =
        statusTarget.status === "ACTIVE"
          ? await suspendUser({ userId: statusTarget.id })
          : await reactivateUser({ userId: statusTarget.id });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(
          statusTarget.status === "ACTIVE"
            ? `${statusTarget.email} was suspended.`
            : `${statusTarget.email} was reactivated.`,
        );
      }
      setStatusTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.total} />
        <StatCard label="Active" value={stats.active} tone="emerald" />
        <StatCard label="Suspended" value={stats.suspended} tone="red" />
        <StatCard label="Admins" value={stats.admins} tone="indigo" />
      </div>

      <AdminPanel
        title="Users"
        description={`${data.total} result${data.total === 1 ? "" : "s"}${activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}`}
      >
        <div className="border-b border-black/10 p-4 dark:border-white/10">
          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name or email"
              className={toolbarInputClass}
            />
            <select
              value={roleInput}
              onChange={(event) => setRoleInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Role filter"
            >
              <option value="">All roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
              className={toolbarInputClass}
              aria-label="Status filter"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value as UserSort)}
              className={toolbarInputClass}
              aria-label="Sort users"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Apply
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterChip
              active={adminsOnly}
              label="Admins only"
              onClick={() => {
                const next = !adminsOnly;
                setAdminsOnly(next);
                router.push(
                  buildQuery({
                    role: next ? "ADMIN" : roleInput === "ADMIN" ? "" : roleInput,
                    admins: next ? "1" : "",
                    page: undefined,
                  }),
                );
              }}
            />
            <FilterChip
              active={suspendedOnly}
              label="Suspended only"
              onClick={() => {
                const next = !suspendedOnly;
                setSuspendedOnly(next);
                router.push(
                  buildQuery({
                    status: next ? "SUSPENDED" : statusInput === "SUSPENDED" ? "" : statusInput,
                    suspended: next ? "1" : "",
                    page: undefined,
                  }),
                );
              }}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <AdminFeedback error={error} success={success} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      No users match your filters
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Try adjusting search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name ?? "—"}</p>
                          <p className="truncate text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{user.orderCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setStatusTarget(user)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            user.status === "ACTIVE"
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          buildHref={(page) => buildQuery({ page: String(page) })}
        />
      </AdminPanel>

      {editingUser && (
        <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}

      <ConfirmDialog
        open={statusTarget !== null}
        title={
          statusTarget?.status === "ACTIVE" ? "Suspend user" : "Reactivate user"
        }
        message={
          statusTarget
            ? statusTarget.status === "ACTIVE"
              ? `Suspend ${statusTarget.email}? They will not be able to sign in.`
              : `Reactivate ${statusTarget.email}? They will be able to sign in again.`
            : ""
        }
        confirmLabel={
          statusTarget?.status === "ACTIVE" ? "Suspend user" : "Reactivate user"
        }
        variant={statusTarget?.status === "ACTIVE" ? "danger" : "default"}
        isPending={isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAdmin
          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {role}
    </span>
  );
}
