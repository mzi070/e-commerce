"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { PaymentProofInput } from "@/lib/validations/checkout";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

interface PaymentProofUploadProps {
  value: PaymentProofInput | null;
  onChange: (proof: PaymentProofInput | null) => void;
  error?: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read image."));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Could not read image."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export function PaymentProofUpload({
  value,
  onChange,
  error,
}: PaymentProofUploadProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setLocalError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setLocalError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      setLocalError("Image must be 5 MB or smaller.");
      return;
    }

    try {
      const data = await readFileAsBase64(file);
      onChange({ data, mimeType: file.type });
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      setLocalError("Could not read the selected image. Please try again.");
    }
  }

  function clearProof(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setLocalError(null);
    onChange(null);
  }

  const displayError = error ?? localError;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        After transferring, upload a photo of your receipt so we can verify
        payment.
      </p>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Choose from gallery
        </button>
        {value && (
          <button
            type="button"
            onClick={clearProof}
            className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Remove
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-md border border-black/10 dark:border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Bank transfer receipt preview"
            className="max-h-64 w-full object-contain bg-zinc-100 dark:bg-zinc-900"
          />
        </div>
      )}

      {displayError && (
        <p className="text-xs text-red-600">{displayError}</p>
      )}
    </div>
  );
}
