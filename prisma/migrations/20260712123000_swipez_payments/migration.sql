-- Replace Stripe fields with Swipez payment fields.

CREATE TABLE "PaymentReference" (
    "referenceNo" TEXT NOT NULL,
    "userId" TEXT,
    "payerName" TEXT NOT NULL,
    "payerPhone" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "payerAddress" TEXT,
    "payerCity" TEXT,
    "payerState" TEXT,
    "payerPostalCode" TEXT,
    "lines" JSONB NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReference_pkey" PRIMARY KEY ("referenceNo")
);

ALTER TABLE "Order" ADD COLUMN "paymentReferenceNo" TEXT;
ALTER TABLE "Order" ADD COLUMN "swipeTransactionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "swipeWebhookId" TEXT;

-- Migrate existing Stripe ids if any (best-effort).
UPDATE "Order" SET "paymentReferenceNo" = "stripeSessionId" WHERE "stripeSessionId" IS NOT NULL;
UPDATE "Order" SET "swipeTransactionId" = "stripeSessionId" WHERE "stripeSessionId" IS NOT NULL;
UPDATE "Order" SET "swipeWebhookId" = "stripeEventId" WHERE "stripeEventId" IS NOT NULL;

ALTER TABLE "Order" DROP COLUMN "stripeSessionId";
ALTER TABLE "Order" DROP COLUMN "stripeEventId";

CREATE UNIQUE INDEX "Order_paymentReferenceNo_key" ON "Order"("paymentReferenceNo");
CREATE UNIQUE INDEX "Order_swipeTransactionId_key" ON "Order"("swipeTransactionId");
CREATE UNIQUE INDEX "Order_swipeWebhookId_key" ON "Order"("swipeWebhookId");
