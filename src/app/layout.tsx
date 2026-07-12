import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import { CartProvider } from "@/components/providers/cart-provider";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/cart/cart-drawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NextShop - Modern E-Commerce",
    template: "%s | NextShop",
  },
  description: "A production-grade e-commerce storefront built with Next.js.",
  openGraph: {
    type: "website",
    siteName: "NextShop",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <CartProvider>
          <Header
            user={user ? { email: user.email, role: user.role } : null}
          />
          <main className="flex-1">{children}</main>
          <CartDrawer />
          <footer className="border-t border-black/10 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
            NextShop — secure checkout with Stripe.
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
