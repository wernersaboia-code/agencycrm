-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'paddle';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "paddleTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "purchases_paddleTransactionId_key" ON "purchases"("paddleTransactionId");
