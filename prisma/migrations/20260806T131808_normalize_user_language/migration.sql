-- AlterTable
ALTER TABLE "users" ALTER COLUMN "language" SET DEFAULT 'pt';

-- As linhas antigas guardam "pt-BR", que nao e um locale do projeto. Sem esta
-- linha elas continuariam dependendo do fallback para funcionar.
UPDATE "users" SET "language" = 'pt' WHERE "language" = 'pt-BR';
