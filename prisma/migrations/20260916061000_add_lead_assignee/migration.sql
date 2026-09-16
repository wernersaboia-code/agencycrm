-- Um lead pode ter uma pessoa responsável da equipe. O vínculo é opcional:
-- importações antigas continuam sem responsável até serem distribuídas.
ALTER TABLE "leads" ADD COLUMN "assignedToId" TEXT;

CREATE INDEX "leads_workspaceId_assignedToId_idx"
    ON "leads"("workspaceId", "assignedToId");

ALTER TABLE "leads"
    ADD CONSTRAINT "leads_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
