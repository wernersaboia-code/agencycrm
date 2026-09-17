-- Capa do estudo de mercado, usada como `image` do Product no JSON-LD.
--
-- URL publica (mesmo padrao do blog: coverImageUrl como texto, sem upload).
-- Nullable de proposito: sem valor, o schema cai na imagem padrao da marca.
-- Nenhuma linha existente e alterada por esta migration.

ALTER TABLE "lead_lists" ADD COLUMN "coverImageUrl" TEXT;
