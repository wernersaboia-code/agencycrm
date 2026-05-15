# Architecture

## Context
- Product: AgencyCRM — CRM SaaS + Lead Marketplace
- Stage: MVP em produção (Vercel + Supabase)
- Key constraints: Serverless (Vercel 10s/60s timeout), PostgreSQL via pgBouncer pooler, sem infraestrutura de fila/worker atual
- Non-goals: Microserviços, event sourcing, CQRS, multi-region deployment

## Architecture Style
- Style: Modular monolith (Next.js App Router)
- DDD level: target ddd-light
- Rationale: O projeto já está organizado por domínios (leads/, campaigns/, calls/, marketplace/, admin/) mas sem boundaries explícitas entre camadas. Migrar para ddd-light adiciona contratos de serviço sem overhead de microserviços.
- Rejected alternatives:
  - Microserviços: Excesso de complexidade operacional para o estágio atual do produto (1 desenvolvedor, sem equipe de SRE)
  - DDD-heavy: Overhead de aggregate roots, domain events, e bounded contexts formais para um domínio ainda em evolução

## Modules And Boundaries

### Módulo: Auth
- Responsibility: Autenticação Supabase SSR, sincronização User no Prisma, controle de sessão
- Owns: middleware.ts (proxy.ts atual), lib/auth.ts, lib/supabase/, hooks/useAuth.ts
- Does not own: Autorização de workspace (delega para Workspace module)
- Depends on: Supabase, Prisma (User table)

### Módulo: Workspace
- Responsibility: Multi-tenancy, plan limits, configurações SMTP, seleção de workspace ativo
- Owns: lib/workspace-selection.ts, contexts/workspace-context.tsx, actions/workspaces.ts, actions/workspace-settings.ts
- Does not own: Dados dos domínios (leads, campaigns, etc.) — apenas verifica acesso
- Depends on: Auth, Prisma (Workspace table)

### Módulo: CRM — Leads
- Responsibility: CRUD de leads, importação CSV/XLSX, tags, busca e filtros
- Owns: actions/leads.ts, lib/validations/lead.validations.ts, lib/utils/lead.utils.ts, components/leads/
- Does not own: Marketplace leads (módulo separado), campanhas, calls
- Depends on: Workspace, Prisma (Lead, Tag, TagsOnLeads)

### Módulo: CRM — Campaigns
- Responsibility: Criação e envio de campanhas (single/sequence), tracking de abertura/clique, processamento de sequências
- Owns: actions/campaigns.ts, actions/campaigns/metrics.ts, app/api/cron/process-sequences/, lib/constants/campaigns.ts, components/campaigns/
- Does not own: Templates, leads, calls
- Depends on: Workspace, Email, Templates, Leads, Prisma (Campaign, CampaignStep, CampaignEnrollment, EmailSend)

### Módulo: CRM — Calls
- Responsibility: Registro de chamadas, follow-ups, estatísticas de calls
- Owns: actions/calls.ts, lib/validations/call.validations.ts, components/calls/
- Does not own: Leads (apenas associação), campaigns
- Depends on: Workspace, Leads, Prisma (Call)

### Módulo: CRM — Templates
- Responsibility: CRUD de templates de email, categorização, preview HTML
- Owns: actions/templates.ts, lib/validations/template.validations.ts, components/templates/
- Does not own: Envio de email (delega para Email module)
- Depends on: Workspace, Prisma (EmailTemplate)

### Módulo: CRM — Reports
- Responsibility: Exportação CSV/Excel/PDF de leads, calls, campaigns, relatório executivo
- Owns: app/api/reports/, lib/reports/, lib/exports/, lib/pdf/, components/reports/
- Does not own: Dados fonte (busca via módulos respectivos)
- Depends on: Leads, Calls, Campaigns

### Módulo: Marketplace
- Responsibility: Catálogo público de listas, carrinho (localStorage), checkout PayPal, download de compras, importação para workspace
- Owns: actions/marketplace.ts, actions/checkout.ts, actions/my-purchases.ts, actions/marketplace-import.ts, lib/paypal.ts, lib/auth/magic-link.ts, contexts/cart-context.tsx, components/marketplace/, components/checkout/
- Does not own: Leads do CRM (apenas importa marketplace leads → CRM leads)
- Depends on: Auth, Workspace, PayPal API, Prisma (LeadList, MarketplaceLead, Purchase, PurchaseItem, PurchaseAccessToken)

### Módulo: Admin
- Responsibility: Super-admin panel: gestão de usuários, workspaces, marketplace, analytics, configurações
- Owns: actions/admin/, app/super-admin/, components/admin/
- Does not own: Dados dos workspaces (acesso read-only para admin)
- Depends on: Auth (requireAdmin), Workspace, Marketplace

### Módulo: Email
- Responsibility: Envio de email (SMTP + Resend fallback), template variable replacement, HTML rendering
- Owns: lib/email.ts, lib/email/purchase.ts, lib/email/templates/, lib/secrets.ts
- Does not own: Templates do CRM (apenas consome subject/body)
- Depends on: Nodemailer, Resend, Prisma (Workspace SMTP config encrypted)

### Módulo: UI
- Responsibility: Componentes primitivos shadcn/ui, tema (next-themes), design tokens (Tailwind v4)
- Owns: components/ui/, app/globals.css, DESIGN.md, components.json
- Does not own: Componentes de negócio (leads, campaigns, etc.)
- Depends on: Radix UI, Tailwind CSS v4, Lucide Icons

## Data
- Primary storage: PostgreSQL (Supabase), single database
- Ownership: Cada workspace é dono dos seus leads, campanhas, calls, templates, email sends. Marketplace lists são globais (admin-owned). Purchases são do comprador com snapshot do vendedor.
- Migration strategy: Prisma Migrate (atualmente baseline migration `0_init`). Deve-se adotar migrations incrementais com `prisma migrate dev`.
- Consistency expectations: CRUD padrão (eventual consistency aceitável para estatísticas; transacional para mutations multi-step)
- Retention/deletion: Não implementado. Precisa de política de retenção para dados de leads, logs de email, tracking data.

## Integrations

### Supabase Auth
- Purpose: Autenticação de usuários, gestão de sessão, cookies SSR
- Failure mode: Se Supabase Auth falhar, todos os usuários perdem acesso. Fallback: nenhum.
- Retry/idempotency: SDK lida com retry internamente

### PayPal Orders API v2
- Purpose: Checkout do marketplace (create order → capture order)
- Failure mode: PayPal indisponível → checkout quebrado. Ordem criada mas não capturada → reembolso automático em 72h (PayPal).
- Retry/idempotency: PayPal request_id para idempotency. PRECISA de transação Prisma ao criar registro de compra.

### SMTP (Nodemailer) + Resend
- Purpose: Envio de emails de campanha e transacionais (compra)
- Failure mode: SMTP falha → fallback para Resend. Ambos falham → email perdido (sem fila).
- Retry/idempotency: Nenhum. Campanhas não têm retry automático.

### Supabase Storage
- Purpose: Upload de logos de workspace
- Failure mode: Upload falha → workspace mantém logo anterior
- Retry/idempotency: Nenhum. Tentativa única.

## NFRs

### Security
- BLOCKER: proxy.ts não é middleware.ts — proteção de rota não está ativa
- HIGH: Credenciais de produção no .env (expostas em git history)
- HIGH: Sanitizer HTML via regex (bypassável) — substituir por DOMPurify
- HIGH: Template variables inseridas em HTML sem escaping (XSS em emails)
- HIGH: PII logado em console (emails, subjects) em produção
- MEDIUM: Sem rate limiting em API routes
- MEDIUM: Sem CSRF protection
- MEDIUM: CSP policy permissiva (falta script-src, style-src, connect-src)
- MEDIUM: Upload de arquivos valida apenas MIME type (spoofável)

### Privacy
- Dados coletados: Emails de leads (nome, empresa, cargo, email, telefone), dados de compra PayPal, estatísticas de email (abertura/clique)
- Sem política de privacidade, sem consentimento de tracking, sem export/deletion de dados
- Emails de leads importados de CSV/XLSX sem verificação de consentimento (LGPD risk)

### Performance
- CRITICAL: Envio de campanhas com loop síncrono (3 writes por recipient, 100ms delay) — 500 leads = 50s+ de request
- HIGH: N+1 em importação de marketplace leads (findFirst + create por lead)
- HIGH: N+1 em getEmailsOverTime (1 aggregate query por dia)
- HIGH: N+1 em recalculateAllCampaignsMetrics (N campanhas * 5 queries)
- MEDIUM: getCallsConversionData carrega todos os calls do workspace sem limite

### Availability
- Vercel serverless: 10s timeout (Hobby/Pro), 60s (Enterprise). Campanhas com 500+ leads excedem o timeout.
- Cron jobs: Vercel Cron (daily 09:00 UTC) para process-sequences. Sem monitoramento de falha.
- Sem health checks, sem circuit breakers, sem graceful degradation

### Cost
- Vercel: Pro ($20/mês) — function execution time é o principal risco de custo (campanhas longas)
- Supabase: Pro ($25/mês) — database size e bandwidth
- PayPal: 2.9% + $0.30 por transação
- Resend: Free tier (100 emails/dia), depois $20/mês (5k emails)

### Observability
- Apenas console.log/console.error (211+ instâncias)
- Emails, subjects, user IDs logados em produção
- Sem structured logging, sem request IDs, sem tracing
- Sem alerting ou monitoramento de erros

### Maintainability
- 18 Server Action files sem camada intermediária (ações chamam Prisma direto)
- 3 padrões de auth diferentes coexistindo
- 4 padrões de resposta de erro diferentes (null, [], {success: false}, throw)
- idSchema duplicado em 4 arquivos
- normalizePagination duplicado em 3 arquivos
- Verificação de workspace access duplicada 7+ vezes
- Zero error boundaries (error.tsx) — crashes não tratados
- Sem testes de integração, apenas 5 testes unitários

### Accessibility
- aria-invalid, data-error, aria-describedby presentes nos forms
- Sem testes de acessibilidade (axe, Lighthouse, screen reader)
- Sem suporte a reduced motion (prefers-reduced-motion)
- Contraste de cores definido no DESIGN.md mas não verificado

## Risks And Tradeoffs

### Risk: Campanhas de email quebram no meio sem rollback
- Mitigation: Migrar para background jobs (Inngest/QStash) com idempotency keys e retry por recipient
- Revisit when: Primeira campanha com > 100 leads ou timeout no Vercel

### Risk: Falta de error boundaries causa crash total em erros de render
- Mitigation: Adicionar error.tsx em todas as route groups com fallback UI e botão de retry
- Revisit when: Próximo deploy

### Risk: Vazamento de credenciais (SMTP, DB, encryption key) via git history
- Mitigation: Rotacionar todas as credenciais, limpar git history, adicionar .env ao .gitignore, usar Vercel Environment Variables
- Revisit when: Imediato

### Risk: XSS via template de email com HTML malicioso
- Mitigation: Substituir regex sanitizer por DOMPurify + HTML-escape de template variables
- Revisit when: Imediato

## Assumptions
- Assumption: O middleware do Next.js será corrigido (proxy.ts → middleware.ts) no próximo deploy
  - Why safe for now: Ambiente de dev está funcional, mas produção não deve ser exposta sem isso
  - Revisit when: Antes do próximo deploy
- Assumption: Background jobs serão implementados com provider externo (Inngest ou QStash), não infra própria
  - Why safe for now: Manter serverless, sem gerenciar Redis/workers
  - Revisit when: Se volume de campanhas justificar infra própria ou se latência de provider externo for problema
