-- Origem do lead: "planilha" (importado pelo admin, vai ao comprador) ou "pdf"
-- (lido do diretorio do estudo, so para o admin).
ALTER TABLE "marketplace_leads" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'planilha';
ALTER TABLE "marketplace_leads" ADD COLUMN "location" TEXT;
ALTER TABLE "marketplace_leads" ADD COLUMN "directorySection" TEXT;
CREATE INDEX "marketplace_leads_listId_origin_idx" ON "marketplace_leads"("listId", "origin");
