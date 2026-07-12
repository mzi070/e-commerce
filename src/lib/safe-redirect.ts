/**
 * Validates post-auth redirect targets to prevent open-redirect attacks.
 * Only same-origin relative paths are allowed (must start with `/`, not `//`).
 */
export function sanitizeCallbackUrl(
  value: string | undefined | null,
  fallback = "/",
): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Reject protocol-relative or encoded bypass attempts.
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}
