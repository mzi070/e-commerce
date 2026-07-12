import { requireUser } from "@/lib/auth/session";
import { getCartForUser } from "@/lib/queries/cart";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata = { title: "Checkout" };

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  const cart = await getCartForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <CheckoutClient cart={cart} />
    </div>
  );
}
