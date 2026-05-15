# ADR 0001: Arquitetura Inicial — Server Actions como Camada de Aplicação

## Status
Proposed

## Context
O AgencyCRM foi construído como um MVP usando Next.js App Router com Server Actions como camada principal de aplicação. As ações chamam Prisma diretamente, sem camada intermediária de serviço ou repositório. Com o crescimento do código (18 action files, ~118 componentes), surgiram problemas de:

1. **Duplicação de código**: Verificação de workspace access repetida 7+ vezes, schemas de validação duplicados, serialização de purchases duplicada 5+ vezes
2. **Inconsistência de padrões**: 3 padrões de auth diferentes, 4 formatos de erro diferentes, naming inconsistente (PascalCase vs kebab-case)
3. **Acoplamento**: Componentes importam ações diretamente; ações misturam auth, validação, regras de negócio e acesso a dados
4. **Inexistência de transações**: Mutações multi-step (call + lead status, import leads + update purchase item) sem atomicidade
5. **Dificuldade de teste**: Ações são difíceis de testar isoladamente (dependem de Prisma, Supabase, cookies)

## Decision
Migrar de arquitetura `simple` (Server Actions → Prisma direto) para `ddd-light` com a seguinte estrutura:

```
lib/services/          # Domain services (testáveis, recebem dependências)
  leads.service.ts
  campaigns.service.ts
  calls.service.ts
  templates.service.ts
  marketplace.service.ts
  workspace.service.ts
  email.service.ts
  reports.service.ts

lib/serializers/       # Serialização tipada (substitui as unknown as)
  lead.serializer.ts
  purchase.serializer.ts
  call.serializer.ts

lib/auth/              # Autorização (único entry point)
  context.ts           # createServiceContext(user) → { user, workspaceId, isAdmin }
```

**Contrato de service:**
```typescript
// Cada service recebe dependências como parâmetro (testável)
function createLeadsService(deps: { prisma: PrismaClient }) {
  return {
    async getLeads(ctx: ServiceContext, filters: LeadFilters): Promise<ActionResult<PaginatedResult<SerializedLead>>> { ... }
    async createLead(ctx: ServiceContext, data: CreateLeadInput): Promise<ActionResult<SerializedLead>> { ... }
  }
}
```

**Contrato de action (thin wrapper):**
```typescript
// Action apenas obtém o context e delega
"use server"
export async function getLeads(filters: LeadFilters) {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: "Não autenticado" }
  const ctx = createServiceContext(user)
  const service = createLeadsService({ prisma })
  return service.getLeads(ctx, filters)
}
```

## Consequences

### Positive
- **Testabilidade**: Services podem ser testados com Prisma mockado ou test database, sem depender de cookies/Supabase
- **Consistência**: Único padrão de auth (`ServiceContext`), único formato de retorno (`ActionResult<T>`)
- **Reusabilidade**: Services podem ser chamados de actions, API routes, cron jobs e background jobs
- **Separação de concerns**: Actions focam em orquestração HTTP; services em regras de negócio
- **Migração preparada**: Se futuramente migrar para API Routes ou background jobs, os services já estão isolados

### Negative
- **Mais arquivos**: Cada domínio ganha um service file adicional
- **Boilerplate inicial**: Actions viram wrappers finos (mas a lógica de negócio fica organizada)
- **Curva de aprendizado**: Time precisa entender injeção de dependências (simples, sem framework)

### Tradeoff
- **Simplicidade vs. Manutenibilidade**: Perde-se a simplicidade de "uma action = um arquivo", ganha-se em organização e testabilidade à medida que o código cresce
- **Performance**: Uma chamada de função extra por request (desprezível)

## Alternatives Considered

### Alternativa 1: Manter simple (sem services)
- Por que não: Os problemas de duplicação, inconsistência e falta de testes continuariam. Viável apenas para projetos com < 5 actions.

### Alternativa 2: Repository pattern completo (Prisma repositories)
- Por que não: Prisma já é um ORM com query builder tipado. Adicionar uma camada de repository pura adicionaria abstração desnecessária. Services podem chamar Prisma diretamente com métodos helper.

### Alternativa 3: DDD-heavy com aggregate roots e domain events
- Por que não: Overhead excessivo para o estágio atual. O domínio não tem complexidade que justifique event sourcing, sagas ou bounded contexts formais. Pode ser revisitado se surgirem regras de negócio complexas (ex: billing, multi-currency, workflow engine de campanhas).

### Alternativa 4: Migrar para tRPC ou GraphQL
- Por que não: Server Actions já provêm type safety end-to-end entre Server Components e Client Components. tRPC adicionaria uma dependência extra sem benefício claro. GraphQL seria um overhead desnecessário para um monolito.

---

# ADR 0002: Background Jobs para Envio de Campanhas

## Status
Proposed

## Context
Atualmente, o envio de campanhas (`sendCampaign` em `actions/campaigns.ts`) é síncrono:
1. A Server Action bloqueia a request HTTP
2. Loop sequencial com 3 writes por recipient + 100ms delay
3. Se o servidor crasha no meio, a campanha fica em status "SENDING" permanentemente
4. Sem rollback, sem retry, sem partial failure handling
5. 500 leads = ~50 segundos → excede Vercel 10s timeout (Hobby/Pro)

**Restrições:**
- Vercel serverless (sem servidores persistentes)
- Sem Redis ou BullMQ disponível atualmente
- Volume atual: campanhas com < 500 leads

## Decision
Migrar envio de campanhas para **Inngest** como plataforma de background jobs:

1. **Action `sendCampaign`** apenas valida e cria o job (rápido, sub-1s)
2. **Inngest function** processa recipients em batches de 50:
   - Idempotency key: `campaign-{campaignId}-lead-{leadId}`
   - Cada batch usa `prisma.$transaction` para atomicidade
   - Falhas individuais capturadas e logadas (não interrompem o batch)
3. **Progress tracking**: campaign.status vira "SENDING (X/N)" ou usa campo `sentCount`

**Escolha do Inngest sobre alternativas:**
| Critério | Inngest | QStash | BullMQ (self-hosted) |
|----------|---------|--------|----------------------|
| SDK Next.js nativo | Sim | Sim | Não |
| Retry automático | Sim (configurável) | Sim (3 retries) | Manual |
| Idempotency | Built-in (keys) | Sim (message IDs) | Manual |
| Dashboard | Sim | Não | Via Bull Board |
| Free tier | 50K steps/mês | 10K msgs/dia | N/A (infra própria) |
| Vercel integration | Excelente | Excelente | Complexa |
| Complexidade | Baixa | Muito baixa | Alta (Redis + worker) |

## Consequences

### Positive
- Campanhas não bloqueiam a request HTTP (UX melhor)
- Resiliência: falhas em recipients individuais não derrubam toda a campanha
- Retry automático em falhas transitórias
- Escalável: batches paralelizáveis no futuro
- Monitoramento via dashboard Inngest
- Custo: free tier cobre o volume atual

### Negative
- Dependência de serviço externo (Inngest)
- Complexidade adicional: dois caminhos de código (síncrono legado + job)
- Cold start do job pode adicionar latência extra (~500ms-1s)

### Tradeoff
- Dependente de terceiro vs. ter retry/resiliência built-in
- Custo financeiro: free tier é suficiente para < 50K steps/mês. Se escalar, $0.50/1K steps (50K steps/mês ~ $25/mês para ~1000 campanhas/mês)

## Alternatives Considered

### Alternativa 1: QStash (Upstash)
- Prós: Mais simples, Vercel-native, free tier generoso
- Contras: Sem dashboard de observabilidade, menos controle sobre retry logic

### Alternativa 2: BullMQ + Redis (Vercel KV ou Upstash Redis)
- Prós: Controle total, sem dependência de terceiro
- Contras: Complexidade operacional alta, precisa gerenciar Redis, workers, e dashboard. Overhead desproporcional ao volume atual.

### Alternativa 3: Vercel Cron + batch sync (manter síncrono mas com batches menores)
- Prós: Zero dependências novas
- Contras: Timeout continua sendo problema (10s), sem retry, sem idempotency, UX ruim (usuário espera). Não resolve o problema raiz.

### Alternativa 4: Manter síncrono + streaming (React Suspense + Server-Sent Events)
- Prós: UX melhor (progresso visível)
- Contras: Complexidade de implementação, timeout do Vercel continua sendo limite (60s Enterprise max), sem resiliência real. Alternativa paliativa, não estrutural.

---

# ADR 0003: Padronização de Auth Context

## Status
Proposed

## Context
O código atual usa 5 padrões diferentes de autorização:
1. `requireAuth()` — throw se não autenticado (usado em settings, workspaces)
2. `getAuthenticatedUser()` + null-check manual (usado em dashboard, campaigns, calls, templates, leads)
3. `requireWorkspaceAccess()` wrapped em try/catch (usado em 7 action files)
4. `verifyWorkspaceAccess()` helper local (apenas em calls.ts)
5. `requireAdmin()` — throw se não admin (usado em admin/*)

Isso causa:
- Inconsistência no tratamento de erros de auth
- Duplicação de try/catch com mensagens fixas
- Dificuldade de entender qual padrão usar em novos arquivos

## Decision
Adotar um **único padrão**: `ServiceContext` passado como parâmetro para todos os services.

```typescript
// lib/auth/context.ts
interface ServiceContext {
  userId: string
  userRole: UserRole
  workspaceId: string
  workspacePlan?: WorkspacePlan
}

async function createServiceContext(): Promise<ServiceContext | null> {
  const user = await getAuthenticatedActiveDbUser()
  if (!user) return null
  const workspaceId = await resolveActiveWorkspace()
  if (!workspaceId) return null
  return { userId: user.id, userRole: user.role, workspaceId }
}

async function requireServiceContext(): Promise<ServiceContext> {
  const ctx = await createServiceContext()
  if (!ctx) throw new AuthError("Não autorizado")
  return ctx
}

async function requireAdminContext(): Promise<ServiceContext> {
  const ctx = await requireServiceContext()
  if (ctx.userRole !== "ADMIN") throw new AuthError("Acesso restrito")
  return ctx
}
```

**Uso nas actions:**
```typescript
"use server"
export async function getLeads(filters: LeadFilters): Promise<ActionResult<...>> {
  try {
    const ctx = await requireServiceContext()
    const service = createLeadsService({ prisma })
    return service.getLeads(ctx, filters)
  } catch (error) {
    if (error instanceof AuthError) return { success: false, error: error.message }
    console.error("Erro ao buscar leads", error)
    return { success: false, error: "Erro interno" }
  }
}
```

## Consequences

### Positive
- **Único padrão**: Todo desenvolvedor sabe exatamente como fazer auth
- **Desacoplamento**: Services não dependem de cookies/Supabase — recebem o context como parâmetro
- **Testabilidade**: Services podem ser testados com context falso
- **Type safety**: ServiceContext é um tipo TypeScript, não uma chamada async

### Negative
- Migração gradual: 5 padrões → 1 padrão requer alterar todos os action files
- Mais verboso que `requireAuth()` inline (mas mais explícito e seguro)

### Tradeoff
- Um pequeno boilerplate extra por action em troca de consistência total no codebase

## Alternatives Considered

### Alternativa 1: Higher-order function wrapper
```typescript
export const getLeads = withAuth(async (ctx, filters) => { ... })
```
- Prós: Menos boilerplate por action
- Contras: "Mágica" (menos explícito), difícil de tipar com validação Zod + auth juntos, menos flexível para casos especiais (ex: marketplace público sem auth)

### Alternativa 2: React Context + hooks (manter como está)
- Prós: Zero mudanças
- Contras: Os problemas atuais de inconsistência continuam; não resolve testabilidade
