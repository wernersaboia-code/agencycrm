CREATE TABLE "google_search_console_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "connectedEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_search_console_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_search_console_connections_userId_key"
ON "google_search_console_connections"("userId");
