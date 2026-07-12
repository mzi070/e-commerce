import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CartLineInput } from "@/lib/pricing";

export interface PaymentReferenceRecord {
  referenceNo: string;
  userId: string | null;
  payerName: string;
  payerPhone: string;
  payerEmail: string;
  payerAddress: string | null;
  payerCity: string | null;
  payerState: string | null;
  payerPostalCode: string | null;
  lines: CartLineInput[];
  totalCents: number;
  shippingCents: number;
}

export async function createPaymentReference(
  input: PaymentReferenceRecord,
): Promise<void> {
  await prisma.paymentReference.create({
    data: {
      referenceNo: input.referenceNo,
      userId: input.userId,
      payerName: input.payerName,
      payerPhone: input.payerPhone,
      payerEmail: input.payerEmail,
      payerAddress: input.payerAddress,
      payerCity: input.payerCity,
      payerState: input.payerState,
      payerPostalCode: input.payerPostalCode,
      lines: input.lines as unknown as Prisma.InputJsonValue,
      totalCents: input.totalCents,
      shippingCents: input.shippingCents,
    },
  });
}

export async function getPaymentReference(
  referenceNo: string,
): Promise<PaymentReferenceRecord | null> {
  const record = await prisma.paymentReference.findUnique({
    where: { referenceNo },
  });
  if (!record) {
    return null;
  }
  return {
    referenceNo: record.referenceNo,
    userId: record.userId,
    payerName: record.payerName,
    payerPhone: record.payerPhone,
    payerEmail: record.payerEmail,
    payerAddress: record.payerAddress,
    payerCity: record.payerCity,
    payerState: record.payerState,
    payerPostalCode: record.payerPostalCode,
    lines: record.lines as unknown as CartLineInput[],
    totalCents: record.totalCents,
    shippingCents: record.shippingCents,
  };
}

export async function deletePaymentReference(referenceNo: string): Promise<void> {
  await prisma.paymentReference.delete({ where: { referenceNo } }).catch(() => {
    // Already fulfilled and removed.
  });
}
