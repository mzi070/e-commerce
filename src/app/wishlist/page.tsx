import { WishlistClient } from "@/components/wishlist/wishlist-client";

export const metadata = { title: "Your wishlist" };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your wishlist</h1>
      <WishlistClient />
    </div>
  );
}
