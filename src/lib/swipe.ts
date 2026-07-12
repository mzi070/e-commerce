import { createHash } from "node:crypto";
import { formatCents } from "@/lib/money";

/** Swipez checkout configuration — secrets loaded lazily at runtime. */
export function getSwipezConfig() {
  return {
    accountId: process.env.SWIPEZ_ACCOUNT_ID ?? "",
    xwayKey: process.env.SWIPEZ_XWAY_KEY ?? "",
    checkoutUrl:
      process.env.SWIPEZ_CHECKOUT_URL ??
      "https://h7sak8am43.swipez.in/xway/secure",
    accessKeyId: process.env.SWIPEZ_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SWIPEZ_SECRET_ACCESS_KEY ?? "",
    apiBaseUrl:
      process.env.SWIPEZ_API_BASE_URL ?? "https://h7sak8am43.swipez.in",
  };
}

export function isSwipezConfigured(): boolean {
  const { accountId, xwayKey } = getSwipezConfig();
  return Boolean(accountId && xwayKey);
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Convert integer cents to Swipez decimal amount string (e.g. 2499 → "24.99"). */
export function centsToSwipezAmount(cents: number): string {
  return formatCents(cents);
}

function md5Hex(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

/**
 * Request secure hash for Swipez checkout form.
 * MD5(xwayKey|account_id|amount|reference_no|return_url)
 */
export function generateRequestSecureHash(input: {
  amount: string;
  referenceNo: string;
  returnUrl: string;
}): string {
  const { xwayKey, accountId } = getSwipezConfig();
  const payload = [
    xwayKey,
    accountId,
    input.amount,
    input.referenceNo,
    input.returnUrl,
  ].join("|");
  return md5Hex(payload);
}

/**
 * Response checksum verification from Swipez return/webhook.
 * MD5(xwayKey|amount|reference_no|billing_email)
 */
export function verifyResponseChecksum(input: {
  amount: string;
  referenceNo: string;
  billingEmail: string;
  checksum: string;
}): boolean {
  const { xwayKey } = getSwipezConfig();
  const payload = [
    xwayKey,
    input.amount,
    input.referenceNo,
    input.billingEmail,
  ].join("|");
  const expected = md5Hex(payload);
  return expected.toLowerCase() === input.checksum.toLowerCase();
}

export interface SwipezCheckoutFields {
  account_id: string;
  return_url: string;
  reference_no: string;
  amount: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  secure_hash: string;
}

export function buildCheckoutFields(input: {
  referenceNo: string;
  amountCents: number;
  description: string;
  payer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  userId?: string;
}): { actionUrl: string; fields: SwipezCheckoutFields } {
  const { accountId, checkoutUrl } = getSwipezConfig();
  const returnUrl = `${siteUrl()}/api/checkout/swipez/return`;
  const amount = centsToSwipezAmount(input.amountCents);

  const secure_hash = generateRequestSecureHash({
    amount,
    referenceNo: input.referenceNo,
    returnUrl,
  });

  return {
    actionUrl: checkoutUrl,
    fields: {
      account_id: accountId,
      return_url: returnUrl,
      reference_no: input.referenceNo,
      amount,
      description: input.description,
      name: input.payer.name,
      phone: input.payer.phone,
      email: input.payer.email,
      address: input.payer.address ?? "",
      city: input.payer.city ?? "",
      state: input.payer.state ?? "",
      postal_code: input.payer.postalCode ?? "",
      udf1: input.userId ?? "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      secure_hash,
    },
  };
}
