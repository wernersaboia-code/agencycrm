# Project Upgrade Plan

## Current State

### Stack
- Next.js 16.2.4 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- Prisma 6.19.3 + PostgreSQL (Supabase) com pgBouncer pooler
- Supabase Auth SSR, PayPal Orders API v2, Nodemailer + Resend
- Vercel deployment, Vitest 4 (apenas 5 testes unitários)
- TypeScript 5 strict, ESLint 9 flat config

### Project structure
- Single package (sem monorepo)
- 18 Server Action files em `actions/` (organizados por domínio: leads, campaigns, calls, templates, admin, marketplace, checkout, workspaces)
- ~118 componentes React (103 client, 15 server-safe)
- 3 React Contexts (Workspace, Cart, ActiveCall)
- 14 modelos Prisma, 11 enums
- 1 migration baseline (`0_init`) — sem migrations incrementais
- Sem AGENTS.md, sem CI/CD pipeline, sem error boundaries

### Main features
- CRM: Gestão de leads com importação CSV/XLSX, tags, filtros
- Campanhas de email: Single e sequence, templates HTML com variáveis, tracking de abertura/clique
- Calls: Registro de chamadas, follow-ups, estatísticas
- Reports: Exportação CSV/Excel/PDF de leads, calls, campaigns
- Marketplace: Catálogo público, carrinho, checkout PayPal, download de listas
- Multi-tenant: Workspaces com planos (FREE/TRIAL/STARTER/PRO/ENTERPRISE), configurações SMTP por workspace
- Admin panel: Gestão de usuários, workspaces, marketplace, analytics

### Tests/checks
- Vitest 4 (apenas unitários):
  - `lib/utils/html-sanitizer.test.ts`
  - `lib/utils/csv.utils.test.ts`
  - `lib/validations/lead.validations.test.ts`
  - `lib/validations/call.validations.test.ts`
  - `lib/validations/template.validations.test.ts`
- Zero testes de integração ou E2E
- ESLint passando, TypeScript strict sem erros de compilação

### Deployment
- Vercel (vercel.json): build com `prisma generate && next build`
- Cron job: `api/cron/process-sequences` diário às 09:00 UTC
- Sem CI/CD pipeline (deploy manual ou git-push trigger)
- .env com credenciais de produção (não rotacionadas)

### Pain points (por severidade)

#### BLOCKERS (5)

| # | Problema | Local | Impacto |
|---|---------|-------|---------|
| B1 | `proxy.ts` não é `middleware.ts` — Next.js não executa o middleware | `proxy.ts:1` | **TODAS as rotas protegidas estão acessíveis sem autenticação** |
| B2 | PayPal webhook verification é stub que retorna sempre `false` | `lib/paypal.ts:28-37` | Webhooks PayPal podem ser forjados se implementados |
| B3 | `createTrialWorkspace` sem auth check — qualquer um cria workspace | `actions/crm/signup.ts:7-22` | Criação indiscriminada de workspaces |
| B4 | N+1: importação de marketplace leads (findFirst + create por lead) | `actions/marketplace-import.ts:88-131` | 500 leads = 1000 queries sequenciais |
| B5 | N+1 + sem transação: envio de campanhas (3 writes por lead, loop) | `actions/campaigns.ts:564-632, 674-778` | 500 leads = 1500+ queries, campanha quebra no meio sem rollback |

#### HIGH (7)

| # | Problema | Local | Impacto |
|---|---------|-------|---------|
| H1 | Sem validação Zod em checkout, dashboard, marketplace, my-purchases | `actions/checkout.ts`, `actions/dashboard.ts`, `actions/marketplace.ts`, `actions/my-purchases.ts` | Input malicioso aceito sem validação |
| H2 | Zero `prisma.$transaction()` no codebase inteiro para mutations multi-step | Todos os arquivos de actions | Inconsistência de dados em falhas parciais |
| H3 | 4 padrões de resposta de erro diferentes (null, [], {success}, throw) | Todos os arquivos de actions | Callers não sabem como tratar erros |
| H4 | Credenciais de produção no `.env` (DB password, SMTP pass, encryption key) | `.env` | Vazamento de credenciais via git history |
| H5 | Regex HTML sanitizer (bypassável) + template variables sem HTML-escape | `lib/utils/html-sanitizer.ts`, `lib/email.ts` | XSS em emails de campanha |
| H6 | PII logado em console: emails, subjects, user IDs | `lib/email.ts:117-119, 154-156`, `lib/email/purchase.ts:69-71` | Violação de privacidade em logs de produção |
| H7 | Derivação de chave de criptografia fraca (SHA-256 simples, sem salt/PBKDF2) | `lib/secrets.ts:5-13` | Chave mestra vulnerável a rainbow tables |

#### MEDIUM (8)

| # | Problema | Local | Impacto |
|---|---------|-------|---------|
| M1 | Zero error boundaries (error.tsx) — crash não tratado quebra o app | Todas as route groups | UX degradada em erros de render |
| M2 | Ações admin usam `throw` em vez de `{ success: false }` | `actions/admin/users.ts:74`, `actions/admin/lists.ts:165` | Inconsistência de error handling |
| M3 | `as unknown as` casts mascaram type mismatches Prisma vs interfaces | `actions/leads.ts:225, 259, 351, 408` | Potenciais crashes em runtime |
| M4 | Cookie `activeWorkspaceId` sem HttpOnly e Secure | `app/api/workspaces/active/route.ts:57-63` | Hygiene de segurança |
| M5 | Sem rate limiting em API routes (checkout, tracking, etc.) | Todas as API routes | Abuso de endpoints |
| M6 | CSP policy permissiva (falta script-src, style-src, connect-src) | `next.config.ts:30-31` | Proteção XSS reduzida |
| M7 | `getAuthenticatedUserId` faz full user lookup só pelo ID | `lib/auth.ts:152-159` | Query desnecessária ao banco |
| M8 | Workspace access verification duplicada 7+ vezes | 7 action files | Manutenção custosa |

## Target State

### Architecture style
Modular monolith com ddd-light:
- Camadas explícitas: **Presentation** (Server Components + Client Components) → **Application** (Server Actions) → **Domain** (lib/services/) → **Infrastructure** (Prisma, SMTP, PayPal, Supabase)
- Cada módulo de domínio (leads, campaigns, calls, templates, marketplace, admin, workspace, email) com contratos claros e imports unidirecionais
- Server Actions viram orquestradores finos que delegam para services testáveis

### DDD level: ddd-light
- **lib/services/** — Funções puras de domínio e orquestração com injeção de dependências (prisma client, email sender, paypal client)
- **lib/validations/** — Schemas Zod centralizados (completar os faltantes)
- **lib/serializers/** — Serialização compartilhada (purchases, leads, calls, campaigns) — substitui `as unknown as`
- **lib/auth/** — Único entry point para autorização (consolidar 3 padrões em 1)

### Desired boundaries
| Boundary atual | Boundary desejada |
|----------------|-------------------|
| Componentes importam `actions/` diretamente | Componentes recebem dados via props ou custom hooks; actions são chamadas apenas pelos hooks/services |
| Actions chamam `prisma` diretamente | Actions delegam para `lib/services/leads.service.ts`, etc. |
| Schemas Zod inline em componentes | Todos os schemas em `lib/validations/` |
| `as unknown as` casts espalhados | Serializadores tipados em `lib/serializers/` |
| Error response shapes inconsistentes | Todos os resultados usam `ActionResult<T> = { success: boolean; data?: T; error?: string }` |
| Sem error boundaries | `error.tsx` em todas as route groups |

### Security posture
- Middleware ativo (proxy.ts → middleware.ts)
- Credenciais em Vercel Environment Variables (não em .env)
- DOMPurify server-side para sanitização HTML
- HTML-escape de todas as template variables
- PBKDF2/Scrypt para derivação de chave de criptografia
- Rate limiting em API routes críticas (checkout, tracking)
- CSP tightening (script-src, style-src, connect-src)
- CSRF protection (Origin header check)
- Content validation server-side para uploads
- PII redaction em logs de produção

### Design system
- Manter DESIGN.md existente (bom estado)
- Mover `ui/logo-upload.tsx` para `components/workspaces/` (é componente de negócio, não UI primitiva)

### Testing baseline
| Tipo | Atual | Target |
|------|-------|--------|
| Unitários (utils/validations) | 5 testes | Manter + expandir |
| Unitários (services) | 0 | Cobrir toda `lib/services/` |
| Integração (actions + DB) | 0 | Testar actions críticas com Prisma test DB |
| E2E (Playwright/Cypress) | 0 | Smoke tests para fluxos críticos (login, criar lead, enviar campanha, checkout) |

## Behavior To Preserve

### Contracts
- Todas as Server Actions mantêm mesma assinatura pública (params e return type)
- Todas as API routes mantêm mesmo path, método HTTP e formato de resposta
- Todos os componentes mantêm mesmas props públicas

### User flows (must not break)
- Login/logout via Supabase
- CRUD de leads com importação CSV/XLSX
- Criação e envio de campanhas single/sequence
- Registro de calls e follow-ups
- Exportação de reports (CSV/Excel/PDF)
- Marketplace: catalog, cart (localStorage), checkout PayPal, download de compras
- Admin panel: gestão de users, workspaces, marketplace, analytics
- Workspace switching e configurações SMTP
- Cron job de processamento de sequências

### External integrations
- Supabase Auth (login, signup, session management)
- PayPal Orders API v2 (create order, capture order)
- Nodemailer SMTP + Resend (email sending)
- Supabase Storage (logo upload)

## Gap Analysis

| # | Gap | Current | Target | Impact | Recommended action |
|---|-----|---------|--------|--------|-------------------|
| G1 | Middleware inativo | `proxy.ts` não executado | `middleware.ts` executado pelo Next.js | BLOCKER | Renomear `proxy.ts` → `middleware.ts` |
| G2 | Auth inconsistente | 3 padrões misturados (requireAuth, getAuthenticatedUser, verifyWorkspaceAccess) | 1 padrão: services recebem auth context como parâmetro | HIGH | Consolidar em `createServiceContext(user)` |
| G3 | Sem camada de domínio | Actions chamam Prisma direto | Actions delegam para `lib/services/` | HIGH | Criar services com injeção de prisma |
| G4 | Error responses inconsistentes | null, [], {success: false}, throw | Apenas `ActionResult<T>` | HIGH | Standardizar tipo de retorno |
| G5 | Schemas Zod inline em componentes | 3 schemas em .tsx files | Todos em `lib/validations/` | MEDIUM | Extrair schemas |
| G6 | `as unknown as` casts | 7 casts bypassam type checking | Serializadores tipados | MEDIUM | Criar `lib/serializers/` |
| G7 | Sanitizador HTML frágil | Regex custom | DOMPurify server-side | HIGH | Substituir implementação |
| G8 | Campanhas síncronas | Loop bloqueante na request HTTP | Background jobs (Inngest/QStash) | BLOCKER | Migrar envio para fila |
| G9 | Sem transações | 0 usos de `$transaction` | Transaction wrapper nos services | HIGH | Criar helper `withTransaction()` |
| G10 | N+1 queries | 4 padrões N+1 conhecidos | Batched queries + `createMany` | BLOCKER | Corrigir queries N+1 |
| G11 | Sem error boundaries | 0 arquivos `error.tsx` | `error.tsx` em cada route group | MEDIUM | Criar error boundaries |
| G12 | PII em logs | Emails, subjects, user IDs no console | Structured logging com redaction | HIGH | Substituir console.* por logger |
| G13 | Credenciais no .env | DB password, SMTP pass, encryption key | Vercel Environment Variables | HIGH | Migrar e rotacionar |
| G14 | Sem rate limiting | 0 proteção em API routes | Rate limiting em rotas críticas | MEDIUM | Adicionar @upstash/ratelimit |
| G15 | Sem testes de integração | Apenas 5 unitários | Testes de integração para actions críticas | MEDIUM | Adicionar com Prisma test DB |
| G16 | 7+ duplicações de código | Workspace access, idSchema, pagination, purchase serialization | Utilitários compartilhados | MEDIUM | Extrair para `lib/utils/actions.ts` |

## Migration Phases

### Phase 0: Critical Fixes (Semana 1) — BLOCKERS

**Goal:** Corrigir vulnerabilidades críticas que podem causar incidentes de segurança ou perda de dados.

**Changes:**
1. **Renomear `proxy.ts` → `middleware.ts`** (B1)
   - Criar `middleware.ts` que re-exporta de `proxy.ts`
   - Verificar que rotas protegidas redirecionam para sign-in
2. **Rotacionar credenciais** (H4)
   - Gerar novas credenciais (DB password, SMTP app password, SECRETS_ENCRYPTION_KEY)
   - Migrar para Vercel Environment Variables
   - Limpar `.env`, adicionar ao `.gitignore`
   - `git filter-branch` ou BFG para limpar git history
3. **Adicionar auth no `createTrialWorkspace`** (B3)
   - Adicionar `requireAuth()` em `actions/crm/signup.ts`
4. **Substituir HTML sanitizer** (H5)
   - Instalar `sanitize-html` ou `dompurify` + `jsdom`
   - Substituir `lib/utils/html-sanitizer.ts`
   - Adicionar HTML-escape em `replaceEmailVariables()`
5. **Corrigir N+1 em importação marketplace** (B4)
   - Substituir loop findFirst + create por batch findMany + createMany
6. **Adicionar error boundaries** (M1)
   - Criar `error.tsx` em `(crm)/`, `(marketplace)/`, `super-admin/`

**Tests/checks:**
- Login/logout em rotas protegidas (com e sem auth)
- Importação de marketplace leads com 500+ registros
- XSS payload em template de email
- Crash de componente capturado pelo error boundary

**Rollback:** Reverter commits individuais (cada fix é independente)

### Phase 1: Foundation (Semanas 2-3) — HIGH

**Goal:** Estabelecer a base arquitetural (camada de services, padrões consistentes) sem quebrar funcionalidade existente.

**Changes:**
1. **Criar tipo `ActionResult<T>` padrão** (H3)
   - `lib/types/actions.ts`: `type ActionResult<T = void> = { success: boolean; data?: T; error?: string }`
   - Migrar actions progressivamente (começar por `leads.ts`, `templates.ts` que já usam padrão similar)
   - Substituir retornos `null` e `[]` por `ActionResult`
2. **Consolidar auth pattern** (H1)
   - Criar `createServiceContext()` em `lib/auth/context.ts`
   - Service context: `{ user: User; workspaceId: string; isAdmin: boolean }`
   - Funções recebem `ctx` como primeiro parâmetro
   - Eliminar chamadas inline a `getAuthenticatedUser()` + null-check
3. **Criar `lib/services/` com primeiro service** (G3)
   - `lib/services/leads.service.ts` — extrair lógica de `actions/leads.ts`
   - Actions viram thin wrappers que chamam o service
   - Service recebe `{ prisma, ctx }` como dependências (testável)
4. **Extrair schemas Zod inline** (G5)
   - Mover `listSchema` de `admin/list-form.tsx` → `lib/validations/marketplace.validations.ts`
   - Mover `workspaceSchema` de `workspace-modal.tsx` e `workspace-settings.tsx` → unificar em `lib/validations/workspace.validations.ts`
5. **Criar serializadores** (G6)
   - `lib/serializers/purchase.serializer.ts` — unificar 5+ formas de serializar purchases
   - `lib/serializers/lead.serializer.ts` — substituir `as unknown as LeadWithRelations[]`
   - `lib/serializers/call.serializer.ts` — substituir `as CallWithLeadAndCampaign`

**Tests/checks:**
- `lib/services/leads.service.test.ts` — testar com Prisma mockado
- `lib/serializers/purchase.serializer.test.ts`
- TypeScript compila sem erros
- Todas as actions mantêm comportamento idêntico

**Rollback:** Reverter branch; cada service pode ser deployado independentemente

### Phase 2: Data Integrity (Semanas 4-5) — HIGH

**Goal:** Implementar transações e corrigir N+1 queries para garantir consistência de dados.

**Changes:**
1. **Criar helper `withTransaction()`** (H2)
   - `lib/db/transaction.ts`: wrapper que aceita array de operações Prisma
   - Aplicar em: `createCall`, `updateCall`, `deleteMarketplaceLead`, `uploadLeadsToList`, `importMarketplaceLeadsToWorkspace`
2. **Corrigir N+1 queries restantes** (B5, G10)
   - `getEmailsOverTime`: substituir loop por groupBy + ordenação em JS
   - `recalculateAllCampaignsMetrics`: paralelizar com `Promise.all` + limitar concorrência
   - `getCallsConversionData`: adicionar paginação e agregação no banco
   - `getDashboardCallbacks`: adicionar paginação
3. **Corrigir checkout PayPal sem transação**
   - `app/api/checkout/create-order/route.ts`: criar registro Purchase dentro de `$transaction`
   - `app/api/checkout/capture-order/route.ts`: atualizar status dentro de `$transaction`

**Tests/checks:**
- Testes de integração: criar call + verificar lead status em transaction
- Testes de integração: checkout PayPal com mock
- Verificar que N+1 queries foram eliminadas (Prisma query log)

**Rollback:** Migrations são aditivas (apenas novas funções); reverter commit

### Phase 3: Observability & Security (Semanas 6-7) — HIGH/MEDIUM

**Goal:** Production readiness: logging, rate limiting, CSP, CSRF, upload validation.

**Changes:**
1. **Structured logging** (H6)
   - Substituir `console.*` por logger com níveis e redaction
   - PII redaction: emails → hash, subjects → omit
   - Adicionar request IDs para tracing
2. **Rate limiting** (M5)
   - `@upstash/ratelimit` + Vercel KV em API routes críticas:
     - `/api/checkout/*` — 5 req/min por IP
     - `/api/track/*` — 100 req/min por IP
     - `/api/user/role` — 30 req/min por IP
3. **CSRF protection** (M12+)
   - Verificar `Origin`/`Referer` header em mutations
   - Implementar token CSRF para forms críticos
4. **CSP tightening** (M6)
   - Adicionar `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' https://*.supabase.co https://api.paypal.com`
5. **Upload validation** (M16)
   - Verificar magic numbers em uploads de arquivo (não confiar em MIME type)
   - Limitar tamanho de upload (5MB para logos, 50MB para CSVs)
6. **PBKDF2 key derivation** (H7)
   - Substituir `crypto.createHash("sha256")` por `crypto.pbkdf2Sync()` com salt

**Tests/checks:**
- Testes de rate limiting (429 responses)
- CSP headers presentes e corretos
- Upload de arquivo malicioso rejeitado
- Logger não emite PII

**Rollback:** Reverter configuração; funcionalidade core não é afetada

### Phase 4: Campaign Reliability (Semanas 8-9) — BLOCKER → HIGH

**Goal:** Migrar envio de campanhas para background jobs com resiliência e retry.

**Changes:**
1. **Background job framework** — escolher provider:
   - Opção A (Recomendada): **Inngest** — SDK nativo Next.js, retry automático, idempotency, dashboard, free tier generoso
   - Opção B: **QStash (Upstash)** — mais simples, Vercel-native, sem dashboard
2. **Refatorar `sendCampaign`:**
   - Action apenas cria job (rápido, sub-1s)
   - Job processa recipients em batches de 50 com `createMany` para EmailSends
   - Cada recipient é idempotent (idempotency key = campaignId + leadId)
   - Falhas individuais não interrompem o batch
   - Tracking de progresso (X/N enviados) visível na UI
3. **Sequence processing como job separado:**
   - Cron job → dispara job para cada enrollment pendente
   - Jobs são retried automaticamente em falha

**Tests/checks:**
- Teste E2E: campanha com 500 leads simulados
- Verificar idempotency (rodar job 2x = mesmo resultado)
- Verificar progress tracking
- Timeout: job completa em < 10 min para 1000 leads

**Rollback:** Manter endpoint síncrono como fallback até job ser validado; feature flag

### Phase 5: Testing & CI/CD (Semanas 10-11) — MEDIUM

**Goal:** Estabelecer baseline de testes e pipeline de deploy.

**Changes:**
1. **Testes de integração**
   - Prisma test database (Docker ou Supabase branch)
   - Testes para todas as actions críticas (CRUD leads, campaigns, calls, checkout)
   - `beforeEach` com seed + `afterEach` com cleanup
2. **Smoke tests E2E**
   - Playwright: login, criar lead, enviar campanha, verificar dashboard
3. **CI/CD pipeline**
   - GitHub Actions: lint → typecheck → test → build
   - Vercel preview deploy em PRs
   - Vercel production deploy no merge para main

**Tests/checks:**
- `npm test` passa (unit + integration)
- Playwright E2E passa em CI
- PR preview deploy funcional

**Rollback:** N/A (infraestrutura de teste, não afeta produção)

## Risks

### Risk: Mudanças na Phase 0 podem quebrar rotas de auth
- Mitigation: Testar cada rota manualmente antes do deploy; adicionar smoke tests após Phase 0
- Revisit when: Após deploy da Phase 0

### Risk: Refatoração para services (Phase 1) pode introduzir regressões
- Mitigation: Actions mantêm mesma assinatura; services são extraídos incrementalmente (um domínio por vez); testes de caracterização antes de refatorar
- Revisit when: Durante Phase 1, após cada service extraído

### Risk: Background jobs (Phase 4) podem ter custo inesperado
- Mitigation: Inngest free tier (50K steps/mês), QStash free tier (10K messages/dia). Monitorar volume nas primeiras semanas.
- Revisit when: Após 30 dias de Phase 4 em produção

### Risk: Credenciais expostas no git history não são completamente removíveis
- Mitigation: Rotacionar TODAS as credenciais (não apenas limpá-las do código). Novas credenciais em Vercel Environment Variables. Forçar push no main para sobrescrever history.
- Revisit when: Imediatamente (Phase 0)

## Decisions Needed
- Decision: Provider de background jobs: Inngest vs QStash?
- Decision: Estrutura de `createServiceContext`: user como parâmetro ou obtido internamente via cookies?
- Decision: Prisma test database: Docker local ou Supabase branch (preview environment)?
- Decision: Prioridade de rate limiting por rota (quais são as 3 mais críticas)?
- Decision: Orçamento de tempo para a migração completa (5 fases em ~11 semanas)?
