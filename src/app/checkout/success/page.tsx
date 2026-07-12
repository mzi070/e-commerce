import Link from "next/link";
import { verifyCheckoutSession } from "@/actions/stripe-checkout";
import { CheckoutSuccessClient } from "@/components/checkout/checkout-success-client";
import { formatCurrencyFromCents } from "@/lib/format";

export const metadata = { title: "Order confirmed" };

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Missing session</h1>
        <p className="mt-2 text-zinc-500">
          We could not verify your order. Check your email for a receipt from
          Stripe.
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

  const result = await verifyCheckoutSession(sessionId);

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
