import { z } from "zod";

const PRIVATE_HOST =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0)/i;

/** HTTPS product image URLs; blocks private-network hosts to reduce SSRF risk. */
export const productImageUrlSchema = z
  .url("Each image must be a valid URL.")
  .refine((url) => url.startsWith("https://"), "Image URLs must use HTTPS.")
  .refine((url) => {
    try {
      const { hostname } = new URL(url);
      return !PRIVATE_HOST.test(hostname);
    } catch {
      return false;
    }
  }, "Image URL host is not allowed.");
