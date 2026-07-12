-- Bank transfer and cash-on-delivery payment methods.

CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'COD');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER';

ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;

CREATE INDEX "Order_paymentMethod_idx" ON "Order"("paymentMethod");
