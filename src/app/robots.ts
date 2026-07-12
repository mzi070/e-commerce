import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated and admin-only areas should not be indexed.
      disallow: ["/admin", "/dashboard", "/checkout", "/login", "/register"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
