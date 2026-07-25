-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('paypal', 'stripe');

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'paypal',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripeSessionId_key" ON "purchases"("stripeSessionId");
