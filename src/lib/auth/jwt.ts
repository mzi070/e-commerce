import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/generated/prisma/enums";

/**
 * Data embedded in the signed session JWT. Kept intentionally small: only the
 * fields needed for authorization decisions. Anything else is fetched from the
 * database on demand.
 */
export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
}

export const SESSION_COOKIE_NAME = "session";
/** Session lifetime in seconds (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const ALGORITHM = "HS256";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET environment variable is missing or too short (min 16 chars).",
    );
  }
  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is Role {
  return value === Role.CUSTOMER || value === Role.ADMIN;
}

/** Sign a session JWT for the given user. */
export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

/**
 * Verify a session JWT and return the typed payload, or null if the token is
 * missing, malformed, expired, or has an invalid signature. Safe for the Edge
 * runtime (uses Web Crypto via jose, no Node APIs).
 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [ALGORITHM],
    });

    const { sub, email, role } = payload;
    if (typeof sub !== "string" || typeof email !== "string" || !isRole(role)) {
      return null;
    }

    return { userId: sub, email, role };
  } catch {
    return null;
  }
}
