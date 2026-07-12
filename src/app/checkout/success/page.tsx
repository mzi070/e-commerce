import Link from "next/link";
import { verifySwipePayment } from "@/actions/swipe-checkout";
import { CheckoutSuccessClient } from "@/components/checkout/checkout-success-client";
import { formatCurrencyFromCents } from "@/lib/format";

export const metadata = { title: "Order confirmed" };

interface SuccessPageProps {
  searchParams: Promise<{ reference_no?: string; status?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { reference_no: referenceNo, status } = await searchParams;

  if (!referenceNo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Missing reference</h1>
        <p className="mt-2 text-zinc-500">
          We could not verify your order. If you were charged, contact support
          with your payment confirmation.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block font-medium text-indigo-600 hover:underline"
        >
          Return to shop
        </Link>
      </div>
    );
  }

  if (status && status.toLowerCase() === "failed") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Payment failed</h1>
        <p className="mt-2 text-zinc-500">
          Your payment was not completed. Your cart is still available.
        </p>
        <Link
          href="/checkout"
          className="mt-6 inline-block font-medium text-indigo-600 hover:underline"
        >
          Try again
        </Link>
      </div>
    );
  }

  const result = await verifySwipePayment(referenceNo);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Processing your order</h1>
        <p className="mt-2 text-zinc-500">{result.error}</p>
        <Link
          href="/"
          className="mt-6 inline-block font-medium text-indigo-600 hover:underline"
        >
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <CheckoutSuccessClient
        orderId={result.data.orderId}
        totalDisplay={formatCurrencyFromCents(result.data.totalCents)}
      />
    </div>
  );
}
