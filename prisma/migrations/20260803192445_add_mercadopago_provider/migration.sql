-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'mercadopago';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "mercadoPagoPaymentId" TEXT,
ADD COLUMN     "mercadoPagoPreferenceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "purchases_mercadoPagoPreferenceId_key" ON "purchases"("mercadoPagoPreferenceId");

