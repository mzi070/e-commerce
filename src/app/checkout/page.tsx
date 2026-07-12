import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <CheckoutClient />
    </div>
  );
}
