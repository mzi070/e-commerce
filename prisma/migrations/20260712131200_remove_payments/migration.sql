-- Remove payment gateway integration tables and columns.

DROP TABLE IF EXISTS "PaymentReference";

ALTER TABLE "Order" DROP COLUMN IF EXISTS "paymentReferenceNo";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "swipeTransactionId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "swipeWebhookId";
