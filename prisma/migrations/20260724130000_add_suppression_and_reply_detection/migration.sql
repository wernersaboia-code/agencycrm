-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('hard_bounce', 'complaint', 'unsubscribe', 'manual');

-- CreateEnum
CREATE TYPE "BounceType" AS ENUM ('hard', 'soft', 'unknown');

-- AlterTable
ALTER TABLE "email_sends" ADD COLUMN     "bounceType" "BounceType",
ADD COLUMN     "messageId" TEXT;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "imapHost" TEXT,
ADD COLUMN     "imapPort" INTEGER,
ADD COLUMN     "replyCheckedAt" TIMESTAMP(3),
ADD COLUMN     "replyDetectionEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "suppressions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "workspaceId" TEXT,
    "reason" "SuppressionReason" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppressions_email_idx" ON "suppressions"("email");

-- CreateIndex
CREATE INDEX "suppressions_workspaceId_email_idx" ON "suppressions"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "email_sends_messageId_idx" ON "email_sends"("messageId");

