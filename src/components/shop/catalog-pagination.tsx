"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PaginatedProducts } from "@/lib/queries/products";

export function CatalogPagination({ result }: { result: PaginatedProducts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (result.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: result.totalPages }, (_, index) => {
        const page = index + 1;
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        return (
          <Link
            key={page}
            href={`${pathname}?${params.toString()}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              page === result.page
                ? "bg-indigo-600 text-white"
                : "border border-black/15 hover:bg-black/5 dark:border-white/15"
            }`}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}
