-- CreateTable
CREATE TABLE "faq_submissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_submissions_ip_createdAt_idx" ON "faq_submissions"("ip", "createdAt");
