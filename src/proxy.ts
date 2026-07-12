import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@/generated/prisma/enums";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";

/** Routes that require any authenticated user. */
const AUTH_PREFIXES = ["/checkout", "/dashboard"];
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
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
}

// Renamed from `middleware` per the Next.js 16 proxy convention.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // Admin-only routes: must be authenticated AND have the ADMIN role.
  if (matchesPrefix(pathname, ADMIN_PREFIXES)) {
    if (!session) {
      return redirectToLogin(request);
    }
    if (session.role !== Role.ADMIN) {
      // Authenticated but not authorized -> send to home page.
      return NextResponse.redirect(new URL("/", request.url));
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
    "/checkout",
    "/checkout/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
