import Link from "next/link";

export const metadata = { title: "Checkout cancelled" };

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Checkout cancelled</h1>
      <p className="mt-2 text-zinc-500">
        No worries — your cart is still here. You can continue shopping or try
        again when you are ready.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/checkout"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Return to checkout
        </Link>
        <Link
          href="/"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
