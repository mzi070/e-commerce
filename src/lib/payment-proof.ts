import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
]);

export interface PaymentProofPayload {
  data: string;
  mimeType: string;
}

export function validatePaymentProofPayload(
  proof: PaymentProofPayload,
): Buffer {
  const extension = ALLOWED_MIME_TYPES.get(proof.mimeType);
  if (!extension) {
    throw new Error("Payment proof must be a JPEG, PNG, WebP, or GIF image.");
  }

  const buffer = Buffer.from(proof.data, "base64");
  if (buffer.length === 0) {
    throw new Error("Payment proof image is empty.");
  }
  if (buffer.length > MAX_PROOF_BYTES) {
    throw new Error("Payment proof image must be 5 MB or smaller.");
  }

  return buffer;
}

/** Persist a bank-transfer receipt image and return its public URL path. */
export async function savePaymentProof(
  orderId: string,
  proof: PaymentProofPayload,
): Promise<string> {
  const extension = ALLOWED_MIME_TYPES.get(proof.mimeType);
  if (!extension) {
    throw new Error("Unsupported payment proof image type.");
  }

  const buffer = validatePaymentProofPayload(proof);
  const uploadsDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "payment-proofs",
  );
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${orderId}.${extension}`;
  const absolutePath = path.join(uploadsDir, filename);
  await writeFile(absolutePath, buffer);

  return `/uploads/payment-proofs/${filename}`;
}
