import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bank transfer",
  COD: "Cash on delivery",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
};

export function paymentMethodDescription(method: PaymentMethod): string {
  switch (method) {
    case "BANK_TRANSFER":
      return "Transfer the order total to our bank account. We ship after payment is confirmed.";
    case "COD":
      return "Pay in cash when your order is delivered.";
  }
}
