"use client";

import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

export function HeaderSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <form onSubmit={onSubmit} className="hidden flex-1 md:flex">
      <label className="sr-only" htmlFor="header-search">
        Search products
      </label>
      <input
        id="header-search"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Search products..."
        className="w-full rounded-l-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-950"
      />
      <button
        type="submit"
        className="rounded-r-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Search
      </button>
    </form>
  );
}
