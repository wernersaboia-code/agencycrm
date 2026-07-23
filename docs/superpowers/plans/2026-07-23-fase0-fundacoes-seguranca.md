# Fase 0 — Fundações de Segurança (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar as três lacunas fundacionais de segurança antes de qualquer feature: role gate no middleware para `/super-admin`, audit log das ações administrativas sensíveis, e verificação do isolamento multi-tenant das actions "authOnly" do CRM.

**Architecture:** (1) Uma decisão de acesso pura e testável (`lib/auth/super-admin-gate.ts`) consumida pelo `proxy.ts` (que, em Next 16, roda sempre em Node.js runtime e portanto pode usar Prisma). (2) Um model `AuditLog` + helper único `recordAudit()` chamado nas mutations admin, com uma tela de visualização. (3) Um helper de propriedade de recurso (`requireWorkspaceForResource`) e testes/fixes de isolamento nas actions authOnly.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` = middleware em Node runtime), Prisma 6 + Postgres (adapter-pg), Supabase Auth (SSR), Vitest (env node), TypeScript.

## Global Constraints

- **Migrações Prisma NÃO usam `prisma migrate dev`** (falha: shadow database não pode ser criada no pooler do Supabase). Workflow obrigatório do projeto: gerar SQL com `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script`, salvar em `prisma/migrations/<timestamp>_<nome>/migration.sql` (padrão de nome como as existentes, ex.: `20260714120000_add_rate_limits`), aplicar com `prisma db execute --file ... --schema prisma/schema.prisma`, registrar com `prisma migrate resolve --applied <nome>`, e por fim `prisma generate`. Há drift pré-existente entre schema e banco (índices de calls/leads/email_sends/purchases) — não tentar "consertar" esse drift aqui.
- **Node não está no PATH por padrão** nesta máquina: nos shells bash, `export PATH="/c/Program Files/nodejs:$PATH"` antes de npm/npx (não persiste entre chamadas). O dev server sobe via `.claude/launch.json` (porta 3001) ou preview_start.
- **Testes:** Vitest, arquivos `*.test.ts` colocados ao lado do código, `import { describe, it, expect } from "vitest"`, alias `@` → raiz do repo. Rodar com `npm test` (== `vitest run`).
- **Autorização admin:** toda action em `actions/admin/*` já chama `await requireAdmin()` no topo — manter esse contrato; auditoria é adicional, nunca substitui o gate.
- **`proxy.ts` sempre roda em Node.js runtime no Next 16** (confirmado em `next/dist/build/analysis/get-page-static-info`: "Proxy always runs on Node.js runtime"). Não adicionar `export const config.runtime` no arquivo de proxy — é proibido pelo Next.
- **Idioma do código/copy:** comentários e mensagens de erro em pt-BR, seguindo o estilo existente.
- **Segredos:** nunca logar valores sensíveis no audit (sem senhas, tokens, chaves).

---

### Task 1: Role gate no middleware para `/super-admin` (SA-S1)

Hoje `proxy.ts` só verifica login para `/super-admin`; a role ADMIN só é conferida no `app/super-admin/layout.tsx`. Esta task adiciona a camada de middleware.

**Files:**
- Create: `lib/auth/super-admin-gate.ts`
- Create (test): `lib/auth/super-admin-gate.test.ts`
- Modify: `proxy.ts` (bloco de verificação de auth, ~linhas 219-301)

**Interfaces:**
- Produces:
  - `isSuperAdminPath(pathname: string): boolean` — true para `/super-admin` e `/super-admin/...` (recebe o caminho **sem** prefixo de locale, como o resto do proxy).
  - `canAccessSuperAdmin(role: string | null | undefined): boolean` — true somente para `"ADMIN"`.
- Consumes (no proxy): `prisma` de `@/lib/prisma`, `stripLocale` já importado.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/auth/super-admin-gate.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { isSuperAdminPath, canAccessSuperAdmin } from "./super-admin-gate"

describe("isSuperAdminPath", () => {
    it("casa a raiz e as subrotas do super-admin", () => {
        expect(isSuperAdminPath("/super-admin")).toBe(true)
        expect(isSuperAdminPath("/super-admin/users")).toBe(true)
        expect(isSuperAdminPath("/super-admin/marketplace/lists")).toBe(true)
    })

    it("não casa rotas fora do super-admin", () => {
        expect(isSuperAdminPath("/dashboard")).toBe(false)
        expect(isSuperAdminPath("/super-admin-x")).toBe(false)
        expect(isSuperAdminPath("/")).toBe(false)
    })
})

describe("canAccessSuperAdmin", () => {
    it("libera apenas ADMIN", () => {
        expect(canAccessSuperAdmin("ADMIN")).toBe(true)
        expect(canAccessSuperAdmin("MANAGER")).toBe(false)
        expect(canAccessSuperAdmin("USER")).toBe(false)
        expect(canAccessSuperAdmin(null)).toBe(false)
        expect(canAccessSuperAdmin(undefined)).toBe(false)
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- super-admin-gate`
Expected: FAIL — `Cannot find module './super-admin-gate'`.

- [ ] **Step 3: Implementar o helper puro**

Criar `lib/auth/super-admin-gate.ts`:

```typescript
/**
 * Decisão pura de acesso ao super-admin, isolada do proxy para ser testável.
 *
 * O gate real vive no `proxy.ts` (Node runtime, com Prisma). Este arquivo só
 * responde "o caminho é do super-admin?" e "esta role pode entrar?".
 */

export function isSuperAdminPath(pathname: string): boolean {
    return pathname === "/super-admin" || pathname.startsWith("/super-admin/")
}

export function canAccessSuperAdmin(
    role: string | null | undefined
): boolean {
    return role === "ADMIN"
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- super-admin-gate`
Expected: PASS (todos os casos).

- [ ] **Step 5: Ligar o gate no `proxy.ts`**

Em `proxy.ts`, adicionar o import no topo (junto aos outros imports de `@/lib`):

```typescript
import { prisma } from "@/lib/prisma"
import { isSuperAdminPath, canAccessSuperAdmin } from "@/lib/auth/super-admin-gate"
```

Dentro do bloco `try` de verificação de auth, **depois** do trecho que trata `!user && !isAuthRoute` (ou seja, quando já sabemos que `user` existe), e antes do `if (user && isAuthRoute)`, inserir:

```typescript
        // Defense-in-depth: o layout do super-admin já barra não-ADMIN, mas o
        // gate no proxy impede que a requisição chegue a renderizar a área.
        // proxy.ts roda em Node runtime no Next 16, então Prisma é permitido.
        if (user && isSuperAdminPath(pathForMatching)) {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { role: true },
            })

            if (!canAccessSuperAdmin(dbUser?.role)) {
                const url = request.nextUrl.clone()
                url.pathname = "/my-purchases"
                url.search = ""
                return NextResponse.redirect(url)
            }
        }
```

- [ ] **Step 6: Verificar type-check e lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros novos.

- [ ] **Step 7: Verificação manual no preview**

Iniciar o dev server e, logado como usuário **não-ADMIN**, acessar `/super-admin`. Esperado: redirect para `/my-purchases`. Como ADMIN: acesso normal.

- [ ] **Step 8: Commit**

```bash
git add lib/auth/super-admin-gate.ts lib/auth/super-admin-gate.test.ts proxy.ts
git commit -m "feat(security): role gate ADMIN no proxy para /super-admin (SA-S1)"
```

---

### Task 2: Model `AuditLog` + helper `recordAudit` (SA-S2a)

**Files:**
- Modify: `prisma/schema.prisma` (novo enum + model, ao lado dos outros no fim do arquivo)
- Create: `lib/audit.ts`
- Create (test): `lib/audit.test.ts`

**Interfaces:**
- Produces:
  - Model Prisma `AuditLog` (tabela `audit_logs`).
  - `recordAudit(input: AuditInput): Promise<void>` — grava um registro; **nunca lança** (falha de auditoria não pode quebrar a ação de negócio — apenas loga no console).
  - `type AuditInput = { actorId: string; actorEmail: string; action: AuditAction; targetType: string; targetId: string; metadata?: Record<string, unknown> | null; ip?: string | null }`
  - `type AuditAction` (union de strings): `"user.role_changed" | "user.status_changed" | "user.password_reset_sent" | "workspace.transferred" | "workspace.deleted" | "list.deleted" | "marketplace_lead.deleted"`. (Ampliável nas fases seguintes: refund, impersonation.)
  - `buildAuditData(input: AuditInput): {...}` — função pura que monta o objeto `data` do Prisma a partir do input (é o que os testes cobrem sem tocar o banco).

- [ ] **Step 1: Adicionar o model ao schema**

Em `prisma/schema.prisma`, no fim (perto dos outros models), adicionar:

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  actorEmail String
  action     String
  targetType String
  targetId   String
  metadata   Json?
  ip         String?
  createdAt  DateTime @default(now())

  @@index([actorId])
  @@index([targetType, targetId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

- [ ] **Step 2: Gerar e aplicar a migração pelo workflow do projeto (sem shadow DB)**

`prisma migrate dev` **falha** aqui. Usar o fluxo em quatro passos (nome sugerido `20260723120000_add_audit_log`):

```bash
export PATH="/c/Program Files/nodejs:$PATH"
# 1. Gerar o SQL a partir da diferença schema x banco
mkdir -p prisma/migrations/20260723120000_add_audit_log
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260723120000_add_audit_log/migration.sql
# 2. Revisar o SQL: deve conter APENAS o CREATE TABLE audit_logs + índices.
#    Se trouxer o drift pré-existente (índices de calls/leads/etc.), remover
#    essas linhas e manter só o audit_logs.
# 3. Aplicar no banco
npx prisma db execute --file prisma/migrations/20260723120000_add_audit_log/migration.sql --schema prisma/schema.prisma
# 4. Registrar como aplicada e regenerar o client
npx prisma migrate resolve --applied 20260723120000_add_audit_log
npx prisma generate
```
Expected: tabela `audit_logs` criada; `prisma.auditLog` disponível no client.

- [ ] **Step 3: Escrever o teste que falha (função pura `buildAuditData`)**

Criar `lib/audit.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { buildAuditData } from "./audit"

describe("buildAuditData", () => {
    it("monta o registro a partir do input completo", () => {
        const data = buildAuditData({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "user.role_changed",
            targetType: "user",
            targetId: "user-9",
            metadata: { from: "USER", to: "ADMIN" },
            ip: "1.2.3.4",
        })

        expect(data).toEqual({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "user.role_changed",
            targetType: "user",
            targetId: "user-9",
            metadata: { from: "USER", to: "ADMIN" },
            ip: "1.2.3.4",
        })
    })

    it("normaliza metadata e ip ausentes para null", () => {
        const data = buildAuditData({
            actorId: "admin-1",
            actorEmail: "admin@x.com",
            action: "workspace.deleted",
            targetType: "workspace",
            targetId: "ws-3",
        })

        expect(data.metadata).toBeNull()
        expect(data.ip).toBeNull()
    })
})
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npm test -- audit`
Expected: FAIL — módulo `./audit` não existe.

- [ ] **Step 5: Implementar `lib/audit.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type AuditAction =
    | "user.role_changed"
    | "user.status_changed"
    | "user.password_reset_sent"
    | "workspace.transferred"
    | "workspace.deleted"
    | "list.deleted"
    | "marketplace_lead.deleted"

export interface AuditInput {
    actorId: string
    actorEmail: string
    action: AuditAction
    targetType: string
    targetId: string
    metadata?: Record<string, unknown> | null
    ip?: string | null
}

/**
 * Monta o objeto `data` do Prisma. Puro e testável — sem tocar no banco.
 */
export function buildAuditData(input: AuditInput): Prisma.AuditLogUncheckedCreateInput {
    return {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
        ip: input.ip ?? null,
    }
}

/**
 * Grava um registro de auditoria. NUNCA lança: uma falha aqui não pode
 * derrubar a ação administrativa que a originou — apenas registra no console.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
    try {
        await prisma.auditLog.create({ data: buildAuditData(input) })
    } catch (error) {
        console.error("[Audit] Falha ao gravar registro de auditoria:", error)
    }
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npm test -- audit`
Expected: PASS.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/audit.ts lib/audit.test.ts
git commit -m "feat(security): model AuditLog e helper recordAudit (SA-S2a)"
```

---

### Task 3: Integrar `recordAudit` nas mutations admin sensíveis (SA-S2b)

**Files:**
- Modify: `actions/admin/users.ts` (`updateUserRole` ~230, `updateUserStatus` ~252, `sendPasswordReset` ~274)
- Modify: `actions/admin/workspaces.ts` (`transferWorkspace` ~295, `deleteWorkspace` ~326)
- Modify: `actions/admin/lists.ts` (`deleteList` ~142, `deleteMarketplaceLead` ~250)

**Interfaces:**
- Consumes: `recordAudit`, `AuditInput` de `@/lib/audit`; `requireAdmin()` já retorna `admin` com `{ id, email }`.

Padrão em cada mutation: capturar o valor **anterior** quando fizer sentido (ex.: role/status antigos), executar a mutação, e chamar `await recordAudit(...)` depois. `requireAdmin()` já dá `admin.id`/`admin.email`.

- [ ] **Step 1: `updateUserRole` — auditar mudança de role**

Em `actions/admin/users.ts`, importar no topo:
```typescript
import { recordAudit } from "@/lib/audit"
```

Em `updateUserRole`, buscar a role atual antes do update e auditar depois:

```typescript
export async function updateUserRole(userId: string, role: UserRole) {
    const admin = await requireAdmin()

    if (!Object.values(UserRole).includes(role)) {
        throw new Error("Role invalida")
    }

    await assertAdminCanChangeUserAccess(admin.id, userId, { role })

    const previous = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "user.role_changed",
        targetType: "user",
        targetId: userId,
        metadata: { from: previous?.role ?? null, to: role },
    })

    revalidatePath("/super-admin/users")
    revalidatePath(`/super-admin/users/${userId}`)

    return { success: true }
}
```

- [ ] **Step 2: `updateUserStatus` — auditar mudança de status**

Mesmo padrão: buscar `previous.status`, atualizar, `recordAudit({ action: "user.status_changed", metadata: { from, to: status } })`.

```typescript
    const previous = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
    })

    await prisma.user.update({ where: { id: userId }, data: { status } })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "user.status_changed",
        targetType: "user",
        targetId: userId,
        metadata: { from: previous?.status ?? null, to: status },
    })
```

- [ ] **Step 3: `sendPasswordReset` — auditar envio**

`sendPasswordReset` só recebe `email`. Capturar `admin` (trocar `await requireAdmin()` sem binding por `const admin = await requireAdmin()`) e auditar após o envio bem-sucedido:

```typescript
    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "user.password_reset_sent",
        targetType: "user_email",
        targetId: email,
    })
```

- [ ] **Step 4: `transferWorkspace` e `deleteWorkspace` — auditar**

Em `actions/admin/workspaces.ts`, importar `recordAudit`. Em `transferWorkspace`, capturar `const admin = await requireAdmin()` e, após o update, auditar com `action: "workspace.transferred"`, `metadata: { newUserId }`. Em `deleteWorkspace`, capturar `admin` e, **antes** do delete (para preservar o nome), ler `const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true, userId: true } })`; após o delete, auditar `action: "workspace.deleted"`, `metadata: { name: ws?.name ?? null, ownerId: ws?.userId ?? null }`.

- [ ] **Step 5: `deleteList` e `deleteMarketplaceLead` — auditar**

Em `actions/admin/lists.ts`, importar `recordAudit` e capturar `const admin = await requireAdmin()` nessas duas funções. Antes do delete, ler o nome/label do alvo; após, auditar (`action: "list.deleted"` / `"marketplace_lead.deleted"`, `metadata` com o nome e, no caso do lead, o `listId`).

- [ ] **Step 6: Type-check e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros novos.

- [ ] **Step 7: Verificação manual**

No super-admin, mudar a role de um usuário de teste; conferir no banco (`select * from audit_logs order by "createdAt" desc limit 5`) que o registro foi gravado com ator, alvo e `from/to`.

- [ ] **Step 8: Commit**

```bash
git add actions/admin/users.ts actions/admin/workspaces.ts actions/admin/lists.ts
git commit -m "feat(security): auditar mutations admin sensíveis (SA-S2b)"
```

---

### Task 4: Tela de visualização do audit log (SA-S2c)

**Files:**
- Create: `actions/admin/audit.ts`
- Create: `app/super-admin/audit/page.tsx`
- Modify: `components/admin/admin-sidebar.tsx` (adicionar item de menu "Auditoria")

**Interfaces:**
- Consumes: `requireAdmin()`, `prisma.auditLog`.
- Produces: `getAuditLogs(filters?: { actorId?: string; action?: string; page?: number }): Promise<{ items: AuditLogRow[]; total: number }>` com `requireAdmin()` no topo.

- [ ] **Step 1: Action de leitura**

Criar `actions/admin/audit.ts`:

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export interface AuditLogRow {
    id: string
    actorEmail: string
    action: string
    targetType: string
    targetId: string
    metadata: unknown
    ip: string | null
    createdAt: string
}

const PAGE_SIZE = 50

export async function getAuditLogs(filters: {
    action?: string
    page?: number
} = {}): Promise<{ items: AuditLogRow[]; total: number }> {
    await requireAdmin()

    const page = Math.max(1, filters.page ?? 1)
    const where = filters.action ? { action: filters.action } : {}

    const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.auditLog.count({ where }),
    ])

    return {
        items: rows.map((r) => ({
            id: r.id,
            actorEmail: r.actorEmail,
            action: r.action,
            targetType: r.targetType,
            targetId: r.targetId,
            metadata: r.metadata,
            ip: r.ip,
            createdAt: r.createdAt.toISOString(),
        })),
        total,
    }
}
```

- [ ] **Step 2: Página**

Criar `app/super-admin/audit/page.tsx` como Server Component que chama `getAuditLogs`, renderiza uma tabela (ator, ação, alvo, data, IP) e a paginação básica via query param `?page=`. Seguir o padrão visual das outras listagens do super-admin (Card + tabela). Sem `indigo-*` hardcoded — usar os tokens já em uso na área (isto será uniformizado em SA-U2, mas não introduzir novas ocorrências).

```tsx
import { getAuditLogs } from "@/actions/admin/audit"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function AuditPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const { page } = await searchParams
    const { items, total } = await getAuditLogs({ page: Number(page) || 1 })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
                <p className="text-muted-foreground">
                    Registro das ações administrativas sensíveis ({total} eventos).
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Eventos recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted-foreground">
                                <th className="py-2">Data</th>
                                <th>Ator</th>
                                <th>Ação</th>
                                <th>Alvo</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="py-2">
                                        {new Date(row.createdAt).toLocaleString("pt-BR")}
                                    </td>
                                    <td>{row.actorEmail}</td>
                                    <td>{row.action}</td>
                                    <td>{row.targetType}:{row.targetId}</td>
                                    <td>{row.ip ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {items.length === 0 && (
                        <p className="py-6 text-center text-muted-foreground">
                            Nenhum evento registrado ainda.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
```

- [ ] **Step 3: Item de menu na sidebar admin**

Em `components/admin/admin-sidebar.tsx`, adicionar um link para `/super-admin/audit` (ícone `ScrollText` ou `ShieldCheck` do `lucide-react`), seguindo o padrão dos itens existentes.

- [ ] **Step 4: Type-check e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Verificação manual**

Acessar `/super-admin/audit` como ADMIN após gerar alguns eventos na Task 3 — a tabela deve listá-los, mais recentes primeiro. Como não-ADMIN, o gate da Task 1 redireciona.

- [ ] **Step 6: Commit**

```bash
git add actions/admin/audit.ts app/super-admin/audit/page.tsx components/admin/admin-sidebar.tsx
git commit -m "feat(security): tela de visualização do audit log (SA-S2c)"
```

---

### Task 5: Auditoria de isolamento multi-tenant das actions authOnly (CRM-S1)

Várias actions do CRM usam o caminho "authOnly" (`createAuthServiceContext`/`requireAuth`) e dependem de escopar as queries por dono manualmente. Esta task verifica cada uma e conserta qualquer `where` que não filtre por workspace do usuário, com um helper reutilizável e testes de sua lógica.

**Files:**
- Create: `lib/auth/resource-ownership.ts`
- Create (test): `lib/auth/resource-ownership.test.ts`
- Create (doc): `docs/superpowers/notes/2026-07-23-crm-isolation-audit.md`
- Modify: quaisquer actions em `actions/calls.ts`, `actions/campaigns.ts`, `actions/templates.ts`, `actions/dashboard.ts`, `actions/settings.ts` onde uma query de leitura/escrita não filtre por dono.

**Interfaces:**
- Produces:
  - `buildOwnedWhere(userId: string, extra?: Record<string, unknown>): {...}` — helper puro que compõe um `where` de Prisma exigindo `workspace: { userId }`, mesclando filtros extras. Reutilizável em queries de recursos que pertencem a um workspace.

- [ ] **Step 1: Escrever o teste que falha do helper**

Criar `lib/auth/resource-ownership.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { buildOwnedWhere } from "./resource-ownership"

describe("buildOwnedWhere", () => {
    it("exige workspace do dono", () => {
        expect(buildOwnedWhere("user-1")).toEqual({
            workspace: { userId: "user-1" },
        })
    })

    it("mescla filtros extras sem sobrescrever o dono", () => {
        expect(buildOwnedWhere("user-1", { status: "ACTIVE" })).toEqual({
            status: "ACTIVE",
            workspace: { userId: "user-1" },
        })
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- resource-ownership`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o helper**

Criar `lib/auth/resource-ownership.ts`:

```typescript
/**
 * Compõe um `where` de Prisma que exige que o recurso pertença a um workspace
 * do usuário. Usado por actions que resolvem recursos por id e precisam
 * garantir o escopo do dono antes de ler/mutar.
 */
export function buildOwnedWhere(
    userId: string,
    extra: Record<string, unknown> = {}
) {
    return {
        ...extra,
        workspace: { userId },
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- resource-ownership`
Expected: PASS.

- [ ] **Step 5: Auditar cada action authOnly e documentar**

Criar `docs/superpowers/notes/2026-07-23-crm-isolation-audit.md`. Para cada função exportada em `actions/calls.ts`, `actions/campaigns.ts`, `actions/templates.ts`, `actions/dashboard.ts`, `actions/settings.ts` que **não** usa `createWorkspaceServiceContext`, registrar em tabela: função, o que ela lê/muta, se o `where` filtra por dono (workspace do usuário ou `userId`), e o veredito (OK / CORRIGIR). Ler o corpo de cada função para preencher — não presumir.

Regras do veredito:
- Leitura/escrita de recurso que pertence a workspace **deve** filtrar por `workspace: { userId }` (ou resolver via `requireWorkspaceAccess`/`createWorkspaceServiceContext`).
- Recurso que pertence direto ao `User` (ex.: preferências em `settings.ts`) deve filtrar por `userId` do usuário autenticado.
- Qualquer função que receba um `id` de recurso e o resolva **sem** amarrar ao dono é CORRIGIR.

- [ ] **Step 6: Corrigir as ocorrências marcadas CORRIGIR**

Para cada função marcada, aplicar o menor conserto seguro: adicionar o filtro de dono ao `where` (usando `buildOwnedWhere` quando o recurso pertence a workspace), ou migrar para `createWorkspaceServiceContext` quando a função já recebe/pode receber `workspaceId`. Preservar a assinatura pública sempre que possível; se precisar exigir `workspaceId`, ajustar os chamadores.

- [ ] **Step 7: Type-check, lint e testes**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sem erros; todos os testes passam.

- [ ] **Step 8: Verificação manual de um caso corrigido**

Para pelo menos uma função corrigida que recebe id, confirmar manualmente (via dev server ou consulta) que um recurso de outro dono não é retornado/alterado.

- [ ] **Step 9: Commit**

```bash
git add lib/auth/resource-ownership.ts lib/auth/resource-ownership.test.ts docs/superpowers/notes/2026-07-23-crm-isolation-audit.md actions/
git commit -m "fix(security): garantir isolamento multi-tenant nas actions authOnly do CRM (CRM-S1)"
```

---

## Self-Review — cobertura da spec (Fase 0)

- **SA-S1 (role gate no middleware):** Task 1. ✓
- **SA-S2 (audit log):** Tasks 2 (model+helper), 3 (integração), 4 (viewer). ✓
- **CRM-S1 (isolamento authOnly):** Task 5. ✓

As demais tarefas da spec (SA-S3/S4, i18n, cold mail, pagamentos, features) ficam para planos das próximas fases — cada um produz software testável por si, conforme a decomposição da skill.

## Notas de execução

- **Ordem:** Task 1 é independente. Tasks 2→3→4 são sequenciais (3 e 4 dependem do model da 2). Task 5 é independente das demais e pode ir em paralelo.
- **Modelo sugerido:** Tasks 1, 2 e 5 são as de maior risco (middleware/segurança, schema, isolamento) → **Opus**. Tasks 3 e 4 são mecânicas/CRUD → **Sonnet**.
- **Migração:** confirmar o fluxo de migração real do projeto (a memória registra "migrations sem shadow DB") antes da Task 2, Step 2.
