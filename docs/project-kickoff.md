# Project Kickoff

## Product
- Name: AgencyCRM
- Type: SaaS CRM + Lead Marketplace
- Goal: CRM para prospecção e gestão de leads com marketplace integrado para compra/venda de listas de leads
- Target users: Agências e profissionais de vendas/prospecção B2B
- Success criteria: Workspaces multi-tenant funcionais, campanhas de email com tracking, marketplace com checkout PayPal funcional, importação de leads CSV/XLSX
- Non-goals: Mobile app nativo, integrações com CRMs de terceiros (Salesforce, HubSpot), white-label

## Priorities
- Primary: Funcionalidade do CRM (leads, campanhas, calls, templates, relatorios)
- Secondary: Marketplace de leads com checkout PayPal
- Tradeoffs: Velocidade de desenvolvimento > sofisticação arquitetural (até agora); Manutenibilidade e segurança precisam ser priorizadas a partir deste ponto

## Stack
- Frontend: Next.js 16.2.4 (App Router, React Server Components), React 19.2.3, Tailwind CSS v4, shadcn/ui (New York style), Radix UI
- Backend: Next.js Server Actions + API Routes, Prisma 6.19.3 ORM
- Database: PostgreSQL (Supabase), pgBouncer pooler (DATABASE_URL + DIRECT_URL)
- Auth: Supabase Auth (SSR com @supabase/ssr), cookies HttpOnly
- Email: Nodemailer (SMTP primário) + Resend (fallback)
- Payment: PayPal (Orders API v2)
- Hosting/deploy: Vercel
- Testing: Vitest 4 (apenas unitários em utils/validations — sem integração/E2E)
- Tooling: TypeScript 5 (strict), ESLint 9 (flat config), Turbopack (dev)

## Architecture
- Style: Modular monolith (Next.js monolito com separação por domínios)
- DDD level: simple (atualmente) → target: ddd-light
- Main modules/domains:
  - CRM: leads, campaigns, calls, templates, reports
  - Marketplace: catalog, cart, checkout, purchases
  - Admin: super-admin panel (users, workspaces, marketplace management)
  - Auth: Supabase SSR + Prisma user sync
  - Email: SMTP engine + Resend fallback
  - Workspace: multi-tenant isolation, plan limits
- Integration points:
  - Supabase Auth → Prisma User sync (first-login create)
  - PayPal Orders API → checkout flow
  - SMTP/Resend → campaign email sending
  - Supabase Storage → workspace logo uploads
- Data ownership: Cada workspace possui seus próprios leads, campanhas, calls e templates. Marketplace é global.

## Design
- DESIGN.md: Presente e atualizado (v alpha, "quiet operational" aesthetic)
- Aesthetic direction: CRM funcional/operacional (teal escuro #164A45), marketplace com visual de loja
- Accessibility baseline: Labels, aria-invalid, data-error attributes presentes; sem testes de acessibilidade formal

## Security And Privacy
- Sensitive data: Senhas SMTP (encrypted AES-256-GCM), emails de leads, dados de compra PayPal, tokens de acesso
- Auth/authz needs: Role-based (ADMIN/MANAGER/USER), workspace-level isolation, admin panel restrito, magic links para download de compras
- External inputs: CSV/XLSX upload, formulários de lead/campaign/template, parâmetros de busca do marketplace, URLs de redirect de tracking
- Uploads/webhooks/payments: Logo upload (Supabase Storage), CSV import, PayPal checkout, tracking pixels (open/click)

## NFRs
- Performance: Campanhas com 500+ leads causam N+1 queries (1.500+ queries sequenciais) — precisa de background jobs
- Availability: Vercel (serverless) — sem proteção contra cold starts em campanhas longas
- Cost: Vercel Pro + Supabase Pro + PayPal fees + Resend
- Observability: Apenas console.log/console.error — sem structured logging, sem APM, sem alerting
- Maintainability: 18 Server Action files com lógica duplicada, 0% de cobertura de transações, sem camada de repositório, sem error boundaries
- Compliance/privacy: PII logado em console (emails, subjects), sem política de retenção, sem GDPR/LGPD

## Decisions
- [2025-Q2] Decision: Usar Server Actions do Next.js em vez de API Routes para mutations
  - Why: Simplicidade, sem necessidade de fetch do lado do cliente, tipagem end-to-end
  - Tradeoff: Acoplamento forte ao Next.js; difícil migrar para outro framework ou extrair para microserviços
- [2025-Q2] Decision: Prisma como ORM sem camada de repositório
  - Why: Rapidez de desenvolvimento inicial
  - Tradeoff: Ações diretamente acopladas ao schema; mudanças no banco exigem alterações em dezenas de arquivos
- [2025-Q2] Decision: Envio de campanhas síncrono via Server Action
  - Why: Simplicidade inicial (sem fila/worker)
  - Tradeoff: Bloqueia a request HTTP, sem resiliência, sem recuperação de falhas parciais

## Assumptions
- Assumption: Supabase Auth é seguro o suficiente para proteção de rotas
  - Why safe for now: JWT verification server-side, cookies HttpOnly, middleware verifica sessão
  - Revisit when: Se houver incidente de auth bypass ou quando adicionar OAuth providers (Google, Microsoft)
- Assumption: O volume de campanhas (< 1000 leads/dia) não justifica uma fila de jobs ainda
  - Why safe for now: MVP stage, campanhas pequenas
  - Revisit when: Campanhas com > 500 leads, timeouts no Vercel (10s/60s), ou reclamações de performance
- Assumption: Marketplace é um canal secundário, não o core do produto
  - Why safe for now: Volume baixo de transações, PayPal lida com PCI compliance
  - Revisit when: MRR do marketplace > 10% da receita ou quando adicionar pagamentos recorrentes (Stripe)

## Open Questions
- Question: Qual o plano de escalabilidade para campanhas de email? Background jobs (Inngest/QStash) ou fila própria com BullMQ/Redis?
- Question: Vai precisar de white-label ou custom domains por workspace no futuro?
- Question: Previsão de integração com Stripe para assinaturas (planos pagos)?
- Question: Existe exigência de LGPD/GDPR compliance? Precisa de data export/deletion?
- Question: Qual o orçamento/time para a migração arquitetural? Faseado (1 mês por fase) ou big-bang?

## Next Steps
- Step: Renomear proxy.ts → middleware.ts (bloqueia todas as rotas sem auth)
- Step: Rotacionar credenciais expostas no .env e limpar git history
- Step: Implementar error boundaries (error.tsx) em todas as route groups
- Step: Padronizar auth pattern (single entry point para verificação de workspace)
- Step: Extrair schemas Zod inline para lib/validations/
- Step: Criar camada de serialização compartilhada (purchases, leads, campaigns)
- Step: Implementar prisma.$transaction() em mutations multi-step
- Step: Substituir HTML sanitizer por DOMPurify (server-side)
- Step: Migrar envio de campanhas para background jobs
