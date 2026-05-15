# Premium Upgrade Path

> Complemento ao [Project Upgrade Plan](./project-upgrade-plan.md) focado em elevar o produto de MVP funcional para plataforma profissional/enterprise.

---

## Bloqueadores de "Premium Feel" (3)

| # | Gap | Impacto | Esforço |
|---|-----|---------|---------|
| P1 | **Sem sitemap/robots** — marketplace invisível ao Google | BLOCKER | Baixo |
| P2 | **Sem Open Graph / Twitter Cards** — links sem preview | BLOCKER | Baixo |
| P3 | **Export de dados sem limite** — 5 API routes retornam dados ilimitados (OOM com 10k+ leads) | BLOCKER | Baixo |

---

## Fase P1: Professional Foundation (Semanas 1-2)

### SEO & Metadados

| Ação | Arquivo | Esforço |
|------|---------|---------|
| Criar `app/sitemap.ts` com geração dinâmica a partir de `LeadList` | `app/sitemap.ts` | 1h |
| Criar `app/robots.ts` | `app/robots.ts` | 30min |
| Adicionar `metadataBase`, `openGraph`, `twitter` ao layout root e marketplace | `app/layout.tsx`, `app/(marketplace)/layout.tsx` | 1h |
| Criar `opengraph-image.png` (1200x630) | `public/opengraph-image.png` | 30min |
| Adicionar `generateMetadata` às páginas de listagem (`list/[slug]`) | `app/(marketplace)/list/[slug]/page.tsx` | 30min |

### Performance

| Ação | Arquivo | Esforço |
|------|---------|---------|
| Remover `@import 'flag-icons/css/flag-icons.min.css'` (CSS morto) | `app/globals.css:3` | 5min |
| Adicionar `take: 10000` como safety limit nos 5 exports ilimitados | `app/api/reports/*/route.ts` | 1h |
| Lazy-load `recharts` com `next/dynamic({ ssr: false })` | `dashboard-client.tsx`, `CallsDurationChart.tsx`, etc. | 1h |
| Lazy-load `@tiptap/react` com `next/dynamic({ ssr: false })` | `rich-text-editor.tsx` | 30min |
| Adicionar ISR (`revalidate = 300`) no catálogo público | `app/(marketplace)/catalog/page.tsx`, `app/(marketplace)/page.tsx` | 30min |
| Adicionar `@vercel/analytics` + `@vercel/speed-insights` | `app/layout.tsx` | 30min |
| Adicionar `preconnect` para origens externas | `app/layout.tsx` | 15min |

### UX Polish Rápido

| Ação | Arquivo | Esforço |
|------|---------|---------|
| Criar `loading.tsx` para todas as route segments | `app/(crm)/leads/loading.tsx`, `app/(crm)/campaigns/loading.tsx`, etc. | 2h |
| Adicionar `mode: "onBlur"` a todos os forms | `lead-modal.tsx`, `CallModal.tsx`, `template-modal.tsx`, `campaign-wizard.tsx`, etc. | 1h |
| Padronizar empty states com `EmptyState` component | `leads-client.tsx`, `purchases/page.tsx`, `my-purchases/page.tsx` | 1h |
| Adicionar `isDirty` a todos os forms (desabilitar submit sem mudanças) | Todos os modais de form | 1h |
| Adicionar `text-balance` aos headings de página | Vários arquivos | 30min |
| Substituir `animate-pulse` por skeleton shimmer CSS | `globals.css` + `components/ui/skeleton.tsx` | 1h |
| Adicionar `SkipToContent` link (acessibilidade) | `app/layout.tsx` | 15min |

---

## Fase P2: Must-Have Premium Features (Semanas 3-5)

### Tabelas de Dados Profissionais

| Ação | Esforço |
|------|---------|
| Adicionar paginação server-side com page size selector (25/50/100) | 3h |
| Adicionar colunas sortáveis (click-to-sort com indicadores ASC/DESC) | 2h |
| Adicionar seleção de linhas (checkbox) + bulk actions toolbar (bulk delete, bulk status, bulk add to campaign) | 4h |
| Adicionar dropdown de visibilidade de colunas | 2h |
| Header sticky (`position: sticky; top: 0;`) | 30min |
| Loading overlay (semi-transparente) em vez de substituir conteúdo durante filtros | 1h |

### Dashboard Premium

| Ação | Esforço |
|------|---------|
| Adicionar date range picker para controlar janela de tempo do dashboard | 3h |
| Adicionar animação count-up nos números dos stat cards | 1h |
| Adicionar badges de variação percentual ("+12% vs semana passada") | 1h |
| Adicionar funil de conversão de leads (horizontal bar: NEW → INTERESTED → CONVERTED) | 2h |
| Fazer stat cards clicáveis com filtros pre-aplicados na página destino | 1h |
| Adicionar polling `stale-while-revalidate` a cada 30s para métricas de campanha | 1h |

### Onboarding Guiado

| Ação | Esforço |
|------|---------|
| Criar wizard de onboarding pós-signup (5 passos: welcome → import → template → SMTP → campaign) | 6h |
| Adicionar tooltips de feature discovery na primeira visita a cada página | 3h |
| Adicionar botão "Carregar dados de exemplo" nos empty states | 2h |
| Adicionar toast de sugestão do próximo passo ao completar setup | 1h |

### Melhorias de Formulário

| Ação | Esforço |
|------|---------|
| Adicionar auto-save com debounce (500ms) para settings | 2h |
| Adicionar indicador sutil de "Salvo" que aparece e desaparece | 1h |
| Adicionar confirmação de saída com mudanças não salvas (`usePrompt` / `beforeunload`) | 2h |
| Adicionar barra de progresso visual no campaign wizard | 1h |
| Destructive actions: exigir digitar confirmação (ex: "Digite EXCLUIR para confirmar") | 1h |

---

## Fase P3: Recursos Enterprise (Semanas 6-8)

### Infraestrutura Premium

| Feature | Modelos Novos | Esforço |
|---------|---------------|---------|
| **Audit Log** — `AuditEvent` (actorId, action, entityType, entityId, workspaceId, diff, timestamp) | `prisma/schema.prisma` | 6h |
| **Soft Delete** — `deletedAt` em `Lead`, `Campaign`, `Call`, `EmailTemplate` + Prisma middleware | `prisma/schema.prisma` | 4h |
| **Notificações In-App** — `Notification` (type, read, actorId, workspaceId) + bell no header | `prisma/schema.prisma` | 6h |
| **API Keys + REST API** — `ApiKey` (workspaceId, key hash, scopes) + `/api/v1/leads`, etc. | `prisma/schema.prisma` | 8h |
| **Webhooks** — workspace-level webhook URLs para eventos (lead.created, campaign.sent, email.opened) | `prisma/schema.prisma` | 6h |

### Colaboração

| Feature | Esforço |
|---------|---------|
| **Team invitations** — `WorkspaceMember` join table, convite por email, aceite, role por workspace | 8h |
| **Lead comments** — `LeadComment` (leadId, authorId, body, createdAt), thread no lead detail | 4h |

### Integrações (Escalonar por demanda)

| Integração | Esforço |
|------------|---------|
| **Zapier** — publicar app com triggers (new lead, lead status changed, email opened) + actions (create lead) | 10h |
| **Google Sheets** — live sync import/export bidirecional | 6h |
| **Slack** — notificações de campanha concluída, lead reply | 3h |

### Billing & Planos

| Ação | Esforço |
|------|---------|
| Criar página "Billing" em settings (plano atual, upgrade/downgrade, histórico de faturas, payment method) | 6h |
| Integrar Stripe Customer Portal | 4h |

---

## Fase P4: Diferenciação (Semanas 9-10)

### Animações & Micro-Interações

| Ação | Esforço |
|------|---------|
| Adicionar `AnimatePresence` page transitions com framer-motion | 3h |
| Stagger list animations para leads/campaigns/calls | 2h |
| Press-scale feedback em botões (`active:scale-[0.97]`) | 1h |
| Animated number counters nos stat cards | 1h |

### i18n

| Ação | Esforço |
|------|---------|
| Integrar `next-intl`, extrair strings, suportar pt-BR + en-US + es-ES | 12h |
| Locale-aware date/number/currency formatting | Incluso |

### White-Label

| Ação | Esforço |
|------|---------|
| Custom domain (CNAME) por workspace | 6h |
| Per-workspace email template branding (logo no footer) | 3h |
| Report PDF com branding do workspace | 3h |

### Smart Lists & Saved Filters

| Ação | Esforço |
|------|---------|
| `SavedFilter` model + UI para salvar/reusar filtros | 4h |

---

## Quick Wins (Fase 0.5 — implementar imediatamente, < 4h cada)

1. **Sitemap + robots + Open Graph** — visibilidade Google/social (P1, P2)
2. **Safety limit nos exports** — previne crash em produção (P3)
3. **Remover flag-icons CSS** — reduz bundle
4. **Lazy-load recharts + tiptap** — reduz JS inicial em ~200KB
5. **Adicionar @vercel/analytics + speed-insights** — visibilidade de performance
6. **ISR no catálogo público** — reduz queries desnecessárias
7. **Prisma composite indexes** — queries mais rápidas em escala
8. **`loading.tsx` files** — UX de navegação mais fluida
9. **`mode: "onBlur"` + `isDirty` nos forms** — validação em tempo real
10. **Padronizar empty states** — consistência visual

---

## Impacto por Esforço (Top 10)

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Sitemap + robots + OG metadata | 2h | SEO inteiro do marketplace |
| 2 | Safety limit nos exports (take: 10000) | 1h | Evita crash OOM em produção |
| 3 | Lazy-load recharts + tiptap | 1.5h | -200KB JS inicial |
| 4 | Audit log (AuditEvent model + feed) | 6h | Compliance + transparência |
| 5 | Tabelas com paginação + ordenação + bulk | 9h | Escalabilidade + usabilidade |
| 6 | Onboarding guiado pós-signup | 12h | Ativação de novos usuários |
| 7 | Notificações in-app | 6h | Engagement + retenção |
| 8 | Team invitations | 8h | Expansão de contas |
| 9 | Dashboard premium (date range, count-up, funnel) | 7h | Demonstra valor do produto |
| 10 | @vercel/analytics + speed-insights | 30min | Métricas Core Web Vitals |

---

## Resumo de Modelos Prisma Faltantes

```prisma
model AuditEvent {
  id          String   @id @default(cuid())
  workspaceId String
  actorId     String
  action      String   // create, update, delete, send, import, export
  entityType  String   // Lead, Campaign, Call, Template, Workspace
  entityId    String
  diff        Json?    // { before: {}, after: {} }
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  actor     User      @relation(fields: [actorId], references: [id])
  @@index([workspaceId, createdAt])
  @@index([entityType, entityId])
}

model Notification {
  id          String    @id @default(cuid())
  workspaceId String
  userId      String
  type        String    // campaign_sent, email_replied, callback_due, lead_imported
  title       String
  body        String?
  entityType  String?
  entityId    String?
  read        Boolean   @default(false)
  createdAt   DateTime  @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  @@index([userId, read, createdAt])
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  workspaceId String
  userId      String
  role        UserRole  @default(USER)
  invitedAt   DateTime  @default(now())
  acceptedAt  DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  @@unique([workspaceId, userId])
}

model ApiKey {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  keyHash     String    // SHA-256 do token
  scopes      Json      // ["leads:read", "leads:write", "campaigns:read"]
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  @@index([workspaceId])
  @@index([keyHash])
}

model LeadComment {
  id          String   @id @default(cuid())
  leadId      String
  workspaceId String
  authorId    String
  body        String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lead      Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id])
  author    User      @relation(fields: [authorId], references: [id])
  @@index([leadId, createdAt])
}

model SavedFilter {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  name        String
  entityType  String   // Lead, Campaign, Call
  criteria    Json
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  @@index([workspaceId, entityType])
}
```

---

## Prisma Composite Indexes Faltantes

```prisma
model Lead {
  // ... existing fields ...
  @@index([workspaceId, status])
  @@index([workspaceId, createdAt])
  @@index([workspaceId, country])
  @@index([workspaceId, industry])
}

model EmailSend {
  // ... existing fields ...
  @@index([campaignId, status])
  @@index([campaignId, leadId, stepNumber])
}

model Call {
  // ... existing fields ...
  @@index([workspaceId, calledAt])
}

model Purchase {
  // ... existing fields ...
  @@index([userId, status])
}
```
