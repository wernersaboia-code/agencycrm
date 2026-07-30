-- CreateTable
CREATE TABLE "lead_list_prices" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_list_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_list_prices_listId_idx" ON "lead_list_prices"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_list_prices_listId_currency_key" ON "lead_list_prices"("listId", "currency");

-- AddForeignKey
ALTER TABLE "lead_list_prices" ADD CONSTRAINT "lead_list_prices_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lead_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Semeadura: o preço atual de cada lista vira a linha da sua moeda atual.
-- Verificado em 2026-07-30: as 20 listas do banco estão todas em EUR, então
-- na prática isto cria 20 linhas EUR. A cláusula usa `currency` da própria
-- lista em vez de literal 'EUR' para não inventar moeda caso alguma tenha sido
-- cadastrada diferente entre o planejamento e a execução.
INSERT INTO "lead_list_prices" ("id", "listId", "currency", "amount", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "currency",
    "price",
    NOW(),
    NOW()
FROM "lead_lists"
ON CONFLICT ("listId", "currency") DO NOTHING;
