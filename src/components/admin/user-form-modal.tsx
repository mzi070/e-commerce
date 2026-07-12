"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resetUserPassword, updateUser } from "@/actions/user";
import type { FieldErrors } from "@/lib/action-result";
import type { UserListItem } from "@/lib/queries/users";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import { formatDate } from "@/lib/format";

interface UserFormModalProps {
  user: UserListItem;
  onClose: () => void;
}

function fieldError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15";

const sectionClass =
  "rounded-xl border border-black/10 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]";

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Edit user
            </p>
            <h2 className="text-xl font-semibold">{user.name ?? user.email}</h2>
            <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {success}
            </p>
          )}

          <section className={sectionClass}>
            <div className="flex flex-wrap items-center gap-2">
              <UserStatusBadge status={user.status} />
              <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user.role}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Orders</dt>
                <dd className="font-medium">{user.orderCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Joined</dt>
                <dd className="font-medium">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className={sectionClass}>
            <SectionHeading
              title="Profile"
              description="Update account identity and access level."
            />
            <form onSubmit={onProfileSubmit} className="mt-4 space-y-4" noValidate>
              <Field label="Name" error={fieldError(fieldErrors, "name")}>
                <input
                  name="name"
                  defaultValue={user.name ?? ""}
                  placeholder="Display name"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" error={fieldError(fieldErrors, "email")}>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Role" error={fieldError(fieldErrors, "role")}>
                <select name="role" defaultValue={user.role} className={inputClass}>
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save profile"}
              </button>
            </form>
          </section>

          <section className={sectionClass}>
            <SectionHeading
              title="Reset password"
              description="Set a new password for this user. They will use it on next sign-in."
            />
            <form onSubmit={onPasswordSubmit} className="mt-4 space-y-4" noValidate>
              <Field label="New password" error={fieldError(fieldErrors, "password")}>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Confirm password"
                error={fieldError(fieldErrors, "confirmPassword")}
              >
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10 disabled:opacity-60"
              >
                {isPending ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </section>
        </div>

        <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
