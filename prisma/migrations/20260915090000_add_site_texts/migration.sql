-- Textos editáveis do site público, isolados por idioma e chave de mensagem.
CREATE TABLE "site_texts" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "draftValue" TEXT,
    "publishedValue" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_texts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_texts_locale_key_key" ON "site_texts"("locale", "key");
CREATE INDEX "site_texts_locale_idx" ON "site_texts"("locale");
