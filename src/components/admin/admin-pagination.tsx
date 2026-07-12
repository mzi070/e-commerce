"use client";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function AdminPagination({
  page,
  totalPages,
  buildHref,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-3 dark:border-white/10"
    >
      <p className="text-sm text-zinc-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <PaginationLink
          href={buildHref(page - 1)}
          disabled={page <= 1}
          label="Previous"
        />
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-zinc-400">
              ...
            </span>
          ) : (
            <PaginationLink
              key={item}
              href={buildHref(item)}
              label={String(item)}
              active={item === page}
            />
          ),
        )}
        <PaginationLink
          href={buildHref(page + 1)}
          disabled={page >= totalPages}
          label="Next"
        />
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  label,
  disabled = false,
  active = false,
}: {
  href: string;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  if (disabled) {
    return (
      <span className="rounded-md px-3 py-1.5 text-sm text-zinc-300 dark:text-zinc-600">
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </a>
  );
}

function getPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}
