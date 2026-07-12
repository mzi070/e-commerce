import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getBankTransferDetails } from "@/lib/commerce-config";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const bankDetails = getBankTransferDetails();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <CheckoutClient
        userEmail={user?.email ?? null}
        bankDetails={bankDetails}
      />
    </div>
  );
}
