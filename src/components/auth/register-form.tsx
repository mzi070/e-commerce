"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/actions/auth";
import type { FieldErrors } from "@/lib/action-result";
import { sanitizeCallbackUrl } from "@/lib/safe-redirect";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const payload = {
      name: name.length > 0 ? name : undefined,
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await register(payload);
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push(sanitizeCallbackUrl(callbackUrl));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name (optional)</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-white/15"
        />
        {fieldErrors.name?.[0] && (
          <span className="text-xs text-red-600">{fieldErrors.name[0]}</span>
        )}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-white/15"
        />
        {fieldErrors.email?.[0] && (
          <span className="text-xs text-red-600">{fieldErrors.email[0]}</span>
        )}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-white/15"
        />
        {fieldErrors.password?.[0] && (
          <span className="text-xs text-red-600">{fieldErrors.password[0]}</span>
        )}
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
