-- Store uploaded bank-transfer payment proof on orders.

ALTER TABLE "Order" ADD COLUMN "paymentProofUrl" TEXT;
