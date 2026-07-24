-- DropIndex
DROP INDEX "suppressions_email_idx";

-- DropIndex
DROP INDEX "suppressions_workspaceId_email_idx";

-- CreateIndex
CREATE INDEX "suppressions_email_workspaceId_idx" ON "suppressions"("email", "workspaceId");

