import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

/**
 * Discriminated union returned by every Server Action so callers get a
 * predictable, fully-typed success/failure shape (no thrown errors to catch
 * in the UI, no `any`).
 */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

/** Convenience constructor for a successful result. */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/** Convenience constructor for a failed result. */
export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return fieldErrors
    ? { success: false, error, fieldErrors }
    : { success: false, error };
}

/** Flatten a ZodError into a `{ field: messages[] }` map for form display. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const { fieldErrors } = z.flattenError(error) as {
    fieldErrors: Record<string, string[] | undefined>;
  };
  const result: FieldErrors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      result[key] = messages;
    }
  }
  return result;
}
