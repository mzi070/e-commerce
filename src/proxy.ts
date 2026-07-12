import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";
import { sanitizeCallbackUrl } from "@/lib/safe-redirect";

/** Routes that require any authenticated user (guest checkout is allowed). */
const AUTH_PREFIXES = ["/dashboard"];
/** Routes that require an authenticated ADMIN user. */
const ADMIN_PREFIXES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    sanitizeCallbackUrl(
      request.nextUrl.pathname + request.nextUrl.search,
      "/",
    ),
  );
  return NextResponse.redirect(loginUrl);
}

// Renamed from `middleware` per the Next.js 16 proxy convention.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // Admin-only routes: require a valid session. Role is enforced authoritatively
  // in admin layouts/actions via requireAdmin() (fresh DB lookup).
  if (matchesPrefix(pathname, ADMIN_PREFIXES)) {
    if (!session) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  // Authenticated-only routes.
  if (matchesPrefix(pathname, AUTH_PREFIXES)) {
    if (!session) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
