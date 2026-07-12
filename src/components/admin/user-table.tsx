"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateUser, suspendUser } from "@/actions/user";
import { formatDate } from "@/lib/format";
import { UserFormModal } from "@/components/admin/user-form-modal";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import type { UserListItem } from "@/lib/queries/users";

interface UserTableProps {
  users: UserListItem[];
  search: string;
}

export function UserTable({ users, search }: UserTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  function applySearch(): void {
    const params = new URLSearchParams();
    const trimmed = searchInput.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  function toggleStatus(user: UserListItem): void {
    const action =
      user.status === "ACTIVE" ? "suspend" : "reactivate";
    const message =
      action === "suspend"
        ? `Suspend ${user.email}? They will not be able to sign in.`
        : `Reactivate ${user.email}?`;

    if (!window.confirm(message)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result =
        action === "suspend"
          ? await suspendUser({ userId: user.id })
          : await reactivateUser({ userId: user.id });
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">{users.length} users</p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15"
          />
          <button
            type="submit"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/5">
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.role === "ADMIN"
                          ? "font-medium text-indigo-600 dark:text-indigo-400"
                          : ""
                      }
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3">{user.orderCount}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => toggleStatus(user)}
                        className={`rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
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

      {editingUser && (
        <UserFormModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
