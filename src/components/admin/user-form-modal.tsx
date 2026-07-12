"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resetUserPassword, updateUser } from "@/actions/user";
import type { FieldErrors } from "@/lib/action-result";
import type { UserListItem } from "@/lib/queries/users";

interface UserFormModalProps {
  user: UserListItem;
  onClose: () => void;
}

function fieldError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

export function UserFormModal({ user, onClose }: UserFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onProfileSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();

    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateUser({
        userId: user.id,
        name: name.length > 0 ? name : undefined,
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "CUSTOMER") as "CUSTOMER" | "ADMIN",
      });
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setSuccess("Profile updated.");
      router.refresh();
    });
  }

  function onPasswordSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await resetUserPassword({
        userId: user.id,
        password: String(form.get("password") ?? ""),
        confirmPassword: String(form.get("confirmPassword") ?? ""),
      });
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setSuccess("Password reset successfully.");
      (event.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  const inputClass =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-lg font-semibold">Edit user</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {success}
            </p>
          )}

          <form onSubmit={onProfileSubmit} className="flex flex-col gap-4" noValidate>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Profile
            </h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Name</span>
              <input
                name="name"
                defaultValue={user.name ?? ""}
                className={inputClass}
              />
              {fieldError(fieldErrors, "name") && (
                <span className="text-xs text-red-600">
                  {fieldError(fieldErrors, "name")}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                required
                className={inputClass}
              />
              {fieldError(fieldErrors, "email") && (
                <span className="text-xs text-red-600">
                  {fieldError(fieldErrors, "email")}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Role</span>
              <select
                name="role"
                defaultValue={user.role}
                className={inputClass}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
              </select>
              {fieldError(fieldErrors, "role") && (
                <span className="text-xs text-red-600">
                  {fieldError(fieldErrors, "role")}
                </span>
              )}
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save profile"}
            </button>
          </form>

          <hr className="my-6 border-black/10 dark:border-white/10" />

          <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4" noValidate>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Reset password
            </h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">New password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={inputClass}
              />
              {fieldError(fieldErrors, "password") && (
                <span className="text-xs text-red-600">
                  {fieldError(fieldErrors, "password")}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Confirm password</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={inputClass}
              />
              {fieldError(fieldErrors, "confirmPassword") && (
                <span className="text-xs text-red-600">
                  {fieldError(fieldErrors, "confirmPassword")}
                </span>
              )}
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="self-start rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10 disabled:opacity-60"
            >
              {isPending ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
