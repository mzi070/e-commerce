import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/jwt";

/** A user record safe to expose (never includes the password hash). */
export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

/** Sign a session JWT and store it in a secure, HTTP-only cookie. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Remove the session cookie, logging the user out. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Read and verify the session from the request cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Return the current authenticated user (fetched fresh from the database), or
 * null if unauthenticated / the user no longer exists.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

/**
 * Require an authenticated user. Redirects to /login if not signed in.
 * Returns the current user for convenience.
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require an authenticated ADMIN user. Redirects unauthenticated users to
 * /login and non-admins to the home page.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.ADMIN) {
    redirect("/");
  }
  return user;
}
