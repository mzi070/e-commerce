import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-zinc-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to shop
      </Link>
    </div>
  );
}
