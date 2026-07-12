"use client";

import Link from "next/link";
import { logout } from "@/actions/auth";
import { useCart } from "@/components/providers/cart-provider";
import type { Role } from "@/generated/prisma/enums";

interface HeaderProps {
  user: { email: string; role: Role } | null;
}

export function Header({ user }: HeaderProps) {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Next<span className="text-indigo-600">Shop</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hidden text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white sm:inline">
            Shop
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                Orders
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/products"
                  className="rounded-md bg-indigo-50 px-2 py-1 font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                >
                  Admin
                </Link>
              )}
              <span className="hidden text-zinc-400 md:inline">{user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative rounded-md p-2 text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
