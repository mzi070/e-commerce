export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 h-9 w-40 animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
          >
            <div className="aspect-square w-full animate-pulse bg-black/10 dark:bg-white/10" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              <div className="h-3 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-8 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
