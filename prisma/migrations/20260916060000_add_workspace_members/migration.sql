-- Permite que o CRM interno seja operado por uma equipe sem conceder
-- privilégios globais de super-admin a cada pessoa.
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('OWNER', 'OPERATOR');

CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceMemberRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- Todo dono existente continua com acesso, agora explicitamente como OWNER.
INSERT INTO "workspace_members" ("id", "workspaceId", "userId", "role", "createdAt", "updatedAt")
SELECT
    'legacy-owner-' || "id",
    "id",
    "userId",
    'OWNER'::"WorkspaceMemberRole",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "workspaces";

CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key"
    ON "workspace_members"("workspaceId", "userId");
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");
CREATE INDEX "workspace_members_workspaceId_role_idx"
    ON "workspace_members"("workspaceId", "role");

ALTER TABLE "workspace_members"
    ADD CONSTRAINT "workspace_members_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_members"
    ADD CONSTRAINT "workspace_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- A tabela é acessada somente pelo Prisma no servidor, como as demais.
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
