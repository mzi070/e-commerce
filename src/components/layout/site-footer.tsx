import Link from "next/link";

interface SiteFooterProps {
  isAuthenticated: boolean;
}

export function SiteFooter({ isAuthenticated }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <p className="text-lg font-semibold">
            Next<span className="text-indigo-600">Shop</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Your one-stop shop for apparel, home, and accessories.
          </p>
        </div>
        <div>
          <p className="font-medium">Shop</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            <li>
              <Link href="/shop" className="hover:text-indigo-600">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop?deals=1" className="hover:text-indigo-600">
                Deals
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-indigo-600">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium">Account</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            {isAuthenticated ? (
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600">
                  Your orders
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-indigo-600">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-indigo-600">
                    Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="font-medium">Categories</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            <li>
              <Link href="/categories/apparel" className="hover:text-indigo-600">
                Apparel
              </Link>
            </li>
            <li>
              <Link href="/categories/home" className="hover:text-indigo-600">
                Home
              </Link>
            </li>
            <li>
              <Link href="/categories/accessories" className="hover:text-indigo-600">
                Accessories
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/10 py-4 text-center text-sm text-zinc-500 dark:border-white/10">
        © {new Date().getFullYear()} NextShop. All rights reserved.
      </div>
    </footer>
  );
}
