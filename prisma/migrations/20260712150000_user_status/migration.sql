-- User suspension support for admin management.

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);

CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_email_idx" ON "User"("email");
