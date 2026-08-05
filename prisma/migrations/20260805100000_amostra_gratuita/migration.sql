-- Amostra gratuita na home: o arquivo e quem o baixou.

CREATE TABLE "free_samples" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "free_samples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "free_sample_downloads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "locale" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "free_sample_downloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "free_sample_downloads_token_key" ON "free_sample_downloads"("token");
CREATE INDEX "free_sample_downloads_email_idx" ON "free_sample_downloads"("email");
CREATE INDEX "free_sample_downloads_ip_createdAt_idx" ON "free_sample_downloads"("ip", "createdAt");
CREATE INDEX "free_sample_downloads_token_idx" ON "free_sample_downloads"("token");

-- RLS ligado sem policy, como nas outras 26 tabelas: a chave anônima do
-- Supabase vai no bundle do navegador, e todo acesso da aplicação passa pelo
-- Prisma como `postgres`, que ignora RLS.
ALTER TABLE "free_samples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "free_sample_downloads" ENABLE ROW LEVEL SECURITY;
