-- Money in cents, categories, Stripe/guest order support.

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable Product: add priceCents + category, migrate data, drop price
ALTER TABLE "Product" ADD COLUMN "priceCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general';

UPDATE "Product" SET "priceCents" = ROUND("price" * 100)::INTEGER;

ALTER TABLE "Product" ALTER COLUMN "priceCents" SET NOT NULL;
ALTER TABLE "Product" DROP COLUMN "price";

CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_priceCents_idx" ON "Product"("priceCents");

-- AlterTable Order
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "totalCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "stripeEventId" TEXT;
ALTER TABLE "Order" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingAddress" JSONB;

UPDATE "Order" SET "totalCents" = ROUND("total" * 100)::INTEGER;

ALTER TABLE "Order" ALTER COLUMN "totalCents" SET NOT NULL;
ALTER TABLE "Order" DROP COLUMN "total";

CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE UNIQUE INDEX "Order_stripeEventId_key" ON "Order"("stripeEventId");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "priceAtPurchaseCents" INTEGER;

UPDATE "OrderItem" SET "priceAtPurchaseCents" = ROUND("priceAtPurchase" * 100)::INTEGER;

ALTER TABLE "OrderItem" ALTER COLUMN "priceAtPurchaseCents" SET NOT NULL;
ALTER TABLE "OrderItem" DROP COLUMN "priceAtPurchase";
