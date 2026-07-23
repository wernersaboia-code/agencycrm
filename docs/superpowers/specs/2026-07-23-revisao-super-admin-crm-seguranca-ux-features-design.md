# Revisão geral: Super-Admin e CRM — Segurança, UX e Features

**Data:** 2026-07-23
**Status:** Aprovado para planejamento

## Contexto

O app tem três grandes superfícies: o **marketplace público** (venda de listas /
PDFs de estudo de mercado), o **CRM interno** (leads, campanhas, chamadas,
relatórios — ferramenta da operação, não vendida) e a **área super-admin**
(gestão de listas, vendas, usuários, workspaces, blog, analytics).

Este documento planeja uma **revisão geral de super-admin e CRM** para deixar o
projeto pronto para produção, cobrindo três frentes em cada área: **segurança**,
**UX** e **features novas**. Não há prazo de lançamento fixo — o projeto está em
desenvolvimento, então cabem melhorias estruturais de médio prazo.

Objetivos declarados pelo dono do produto:
- Melhor cobertura de **segurança** possível em ambas as áreas.
- Features **realmente inovadoras**, estruturando o site para produção.
- **Cold mail completo**, para rodar campanhas de venda das listas a potenciais
  compradores.
- **Alemão (`de`)** com cobertura completa em super-admin **e** CRM (hoje ambos
  têm strings pt-BR hardcoded; o super-admin não é internacionalizado).

## Estado atual (levantamento)

### Segurança — o que já está bom
- **Autorização das server actions admin é consistente:** todas as actions em
  `actions/admin/*.ts` (blog, global-stats, lists, users, workspaces — 31 no
  total) chamam `requireAdmin()` no topo de cada função exportada.
- **Isolamento multi-tenant do CRM é sólido no caminho principal:**
  `createWorkspaceServiceContext(workspaceId)` → `requireWorkspaceAccess` confere
  `workspace.userId === user.id` antes de qualquer query
  (`lib/auth/context.ts`, `lib/auth.ts`).
- **Middleware fail-closed:** `proxy.ts` redireciona para login quando a
  verificação de auth falha, em vez de liberar a rota.
- **SMTP com senha criptografada** (`decryptSecret`/`lib/secrets`), rate limiting
  em checkout/cron/tracking/faq, tokens de acesso de compra.

### Segurança — lacunas encontradas
- **Middleware não valida role ADMIN para `/super-admin`** — só checa login. A
  checagem de papel vive apenas em `app/super-admin/layout.tsx` e nas actions.
  Falta uma camada (defense-in-depth).
- **Não existe audit log.** Deletar workspace/lead, mudar role/status de usuário,
  refund, impersonation — nada deixa rastro no banco (não há model de auditoria
  em `prisma/schema.prisma`).
- **Actions "authOnly" precisam de auditoria de escopo.** Várias actions do CRM
  usam `createAuthServiceContext`/`requireAuth` (sem guard de workspace) e
  dependem de escopar as queries por usuário manualmente. Contagem por arquivo:
  `calls.ts` (8 authOnly), `campaigns.ts` (9), `templates.ts` (6),
  `dashboard.ts` (4), `settings.ts` (4). Cada uma precisa ser verificada para
  garantir que nenhum `where` esquece o filtro de dono.
- **Rate limiting não cobre** actions admin sensíveis nem o fluxo de auth.

### Cold mail — o que já existe
Motor funcional em `app/api/cron/process-sequences/route.ts` (cron horário):
- Sequências (`Campaign` → `CampaignStep` → `CampaignEnrollment`) com **condições
  por step** (`always`, `opened`, `not_opened`, `clicked`, `not_clicked`).
- **SMTP por workspace** (ou Resend) com senha criptografada.
- **Limite diário de envios por workspace** (`maxEmailsPerDay`, 0 = ilimitado).
- **Parada automática** em lead `CONVERTED` (se `stopOnConverted`) ou
  `UNSUBSCRIBED`.
- **Tracking** de abertura (pixel) e clique, footer de unsubscribe, rota
  `/api/unsubscribe`.
- Personalização por variáveis (`replaceEmailVariables`), lote de 100/execução.

### Cold mail — lacunas para produção
- **Sem janela de envio / horário comercial / timezone.** `calculateNextSendAt`
  só soma dias/horas; envia a qualquer hora, inclusive fim de semana e
  madrugada — péssimo para deliverability e para parecer humano.
- **Sem detecção de resposta.** Só `unsubscribe`/`converted` param a sequência;
  um lead que respondeu continua recebendo follow-ups.
- **Bounce raso.** `EmailSendStatus.BOUNCED` é gravado, mas não há distinção
  hard/soft nem **lista de supressão** — um e-mail que deu hard bounce pode ser
  reenviado em outra campanha.
- **Sem header `List-Unsubscribe`** (one-click) — só footer HTML. Exigido por
  Gmail/Yahoo para remetentes de volume e por boa prática GDPR/CAN-SPAM.
- **Sem randomização (jitter)** do horário de envio; agenda exata + delay fixo de
  200ms parece robótico.
- **Sem A/B de assunto/conteúdo**, sem warmup/ramp de volume, sem checagem de
  domínio (SPF/DKIM/DMARC) na UI.
- **Audiência de "potenciais compradores das listas"** não é um conceito de
  primeira classe — hoje enrollments saem de leads do workspace; falta um fluxo
  claro para prospectar compradores.

### UX — o que já está bom
- CRM tem command palette, hotkeys, breadcrumbs, workspace switcher, trial banner.
- `DESIGN.md` define um design system completo (tokens de cor, tipografia,
  spacing, componentes) — "quiet operational".

### UX — lacunas encontradas
- **Super-admin não é internacionalizado:** strings pt-BR hardcoded, zero uso de
  `useTranslations`/`getTranslations`.
- **Cores fora do design system:** super-admin e `components/admin` usam
  `indigo-*` do Tailwind hardcoded em ~10 arquivos, em vez dos tokens `admin`
  (#3B3F82) / `admin-soft` do `DESIGN.md`.
- **Padrões de estado inconsistentes** (loading/vazio/erro) entre listagens.
- Páginas `support` e parte de `settings` são informativas (checklist de env).

## Decisões

- **i18n:** super-admin e CRM passam a usar `next-intl` com as mensagens em
  `messages/`, cobrindo no mínimo `pt` e `de` (as demais línguas do app entram
  na mesma extração, aproveitando o esforço). Padrão já usado no marketplace.
- **Audit log:** novo model `AuditLog` no Prisma, gravado por um helper único
  (`recordAudit`) chamado nas actions sensíveis. Sem PII além do necessário
  (ator, ação, tipo+id do alvo, metadados JSON, IP, timestamp).
- **Cold mail:** evoluir o motor existente, não reescrever. Janelas de envio,
  supressão/bounce, detecção de resposta e `List-Unsubscribe` são as prioridades;
  A/B e warmup ficam como incrementos posteriores.
- **Modelos de implementação:** cada tarefa recebe um modelo sugerido — **Opus**
  para schema/segurança e mudanças com risco de vazamento de dados; **Sonnet**
  para a maior parte de features e refactors de componente; **Haiku** para
  trabalho mecânico/repetitivo (troca de tokens, extração de strings,
  adicionar confirmações). A atribuição é sugestão, não trava.

## Workstreams e tarefas

Cada tarefa lista: **problema → abordagem → critérios de aceite → modelo →
dependências**.

### WS-1 · Super-Admin — Segurança

**SA-S1 · Role gate no middleware** — _Opus_
- Problema: `proxy.ts` só verifica login para `/super-admin`; a role só é checada
  no layout.
- Abordagem: no bloco de auth já existente, quando `pathForMatching` começa com
  `/super-admin`, buscar a role do usuário e redirecionar não-ADMIN para
  `/my-purchases`. Reaproveitar a query mínima (evitar custo em toda request —
  só quando o caminho é super-admin).
- Aceite: usuário não-ADMIN autenticado é barrado no middleware antes de renderizar
  o layout; ADMIN passa; teste cobrindo os dois casos.
- Dependências: nenhuma.

**SA-S2 · Audit log (model + helper + integração)** — _Opus_
- Problema: ações destrutivas/sensíveis não deixam rastro.
- Abordagem: model `AuditLog` (`actorId`, `actorEmail`, `action` enum/string,
  `targetType`, `targetId`, `metadata Json?`, `ip`, `createdAt`). Helper
  `recordAudit(...)` em `lib/audit.ts`. Chamar nas actions: delete/edit de
  workspace, delete de lead/lista, mudança de role/status de usuário, refund,
  impersonation (SA-F3). Migração Prisma sem shadow DB.
- Aceite: cada ação sensível grava um registro; tela admin lista os últimos
  registros com filtro por ator/tipo.
- Dependências: nenhuma (mas SA-F3/SA-F4 dependem dela).

**SA-S3 · Rate limiting em actions admin e auth** — _Sonnet_
- Problema: sem limite em ações admin sensíveis nem no login/signup.
- Abordagem: reusar `lib/rate-limit.ts` (já usado em checkout). Aplicar em: envio
  de convite/reset de usuário, refund, impersonation; e no fluxo de auth
  (tentativas de login por IP/e-mail).
- Aceite: exceder o limite retorna erro amigável; teste de unidade do limitador.
- Dependências: SA-S2 (logar tentativas bloqueadas é desejável).

**SA-S4 · Revisão da exposição em settings** — _Haiku_
- Problema: página settings lista status de env vars (mascarado) — revisar o que
  aparece e para quem.
- Abordagem: confirmar que só ADMIN vê; garantir mascaramento de qualquer valor;
  remover exibição de chaves que não precisam aparecer.
- Aceite: nenhuma chave sensível legível; conteúdo revisado.
- Dependências: nenhuma.

### WS-2 · Super-Admin — UX

**SA-U1 · i18n do super-admin (pt + de + demais)** — _Sonnet_
- Problema: strings hardcoded, sem internacionalização.
- Abordagem: extrair strings de `app/super-admin/**` e `components/admin/**` para
  namespaces em `messages/*.json`; usar `getTranslations` (server) /
  `useTranslations` (client). Traduzir para `de` e demais línguas do app.
- Aceite: nenhuma string pt-BR hardcoded no super-admin; alternância de idioma
  funciona; `de` completo.
- Dependências: alinhar chaves com CRM-U3 (mesma convenção de namespaces).

**SA-U2 · Design tokens (remover `indigo-*`)** — _Haiku_
- Problema: cores fora do design system em ~10 arquivos.
- Abordagem: substituir classes `indigo-*` pelos tokens `admin`/`admin-soft` do
  `DESIGN.md` (via classes utilitárias/variáveis CSS do projeto).
- Aceite: zero ocorrência de `indigo-` em `app/super-admin` e `components/admin`;
  visual consistente com o design system.
- Dependências: nenhuma (idealmente antes/junto de SA-U1 para não retrabalhar).

**SA-U3 · Padrão de ações destrutivas** — _Sonnet_
- Problema: confirmações e feedback inconsistentes em delete/role-change.
- Abordagem: componente/padrão único de confirmação (dialog + digitar nome para
  deletar workspace, por ex.) e toasts/loading states padronizados.
- Aceite: toda ação destrutiva usa o mesmo padrão; sem duplo clique acidental.
- Dependências: SA-S2 (a confirmação dispara o audit).

**SA-U4 · Estados vazios e skeletons** — _Haiku_
- Problema: listagens sem empty state / skeleton consistente.
- Abordagem: componentes reutilizáveis de empty/skeleton aplicados nas listagens
  de users/workspaces/purchases/lists.
- Aceite: cada listagem tem loading e empty coerentes.
- Dependências: SA-F1 (paginação muda a listagem — fazer junto).

### WS-3 · Super-Admin — Features

**SA-F1 · Busca + filtros + paginação nas listagens** — _Sonnet_
- Problema: users/workspaces/purchases sem busca/paginação — quebra ao crescer.
- Abordagem: paginação server-side (cursor ou offset) + busca por texto + filtros
  (status/role/plano). Padronizar num hook/componente de tabela reutilizável
  (já há `@tanstack/react-table`).
- Aceite: listas paginam, buscam e filtram sem carregar tudo; URL reflete o
  estado (compartilhável).
- Dependências: nenhuma.

**SA-F2 · Dashboard com tendências** — _Sonnet_
- Problema: dashboard mostra números pontuais; falta evolução temporal.
- Abordagem: séries temporais (receita, vendas, novos usuários) a partir de
  `getGlobalStats` estendido; gráficos seguindo a skill `dataviz`.
- Aceite: gráficos de tendência mensal renderizam com dados reais; acessíveis em
  light/dark.
- Dependências: nenhuma.

**SA-F3 · Impersonation ("ver como usuário")** — _Opus_
- Problema: suporte não consegue reproduzir o que o usuário vê.
- Abordagem: ADMIN inicia sessão de impersonation escopada e reversível; banner
  persistente indicando o modo; **toda** entrada/saída gravada no audit log;
  impersonation nunca permite ações destrutivas irreversíveis sem sair do modo.
  Avaliar mecanismo (claim assinado/cookie separado) sem misturar com a sessão
  Supabase real.
- Aceite: admin vê o app como o usuário-alvo; sai com um clique; tudo auditado;
  usuário comum jamais consegue acionar.
- Dependências: SA-S2 (audit).

**SA-F4 · Gerenciar status de compra / refund** — _Sonnet_
- Problema: sem gestão de status/refund pela área admin.
- Abordagem: ação admin para alterar status de `Purchase` e registrar refund
  (integração PayPal se aplicável, ou registro manual), com audit.
- Aceite: admin altera status/registra refund; histórico auditado; comprador
  perde acesso ao download quando aplicável.
- Dependências: SA-S2 (audit).

### WS-4 · CRM — Segurança

**CRM-S1 · Auditoria de escopo das actions "authOnly"** — _Opus_
- Problema: actions sem guard de workspace dependem de escopar queries à mão.
- Abordagem: revisar cada action authOnly em `calls.ts`, `campaigns.ts`,
  `templates.ts`, `dashboard.ts`, `settings.ts`; garantir que todo `where` de
  leitura/escrita filtra por dono (workspace do usuário). Onde couber, migrar
  para `createWorkspaceServiceContext`. Adicionar testes de isolamento (usuário A
  não acessa dado de B).
- Aceite: nenhuma action retorna/edita dado fora do escopo do usuário; testes de
  isolamento passando.
- Dependências: nenhuma (fundacional — fazer cedo).

**CRM-S2 · Rate limiting em ações de escrita** — _Sonnet_
- Problema: envio de e-mail e import de leads sem limite por usuário.
- Abordagem: aplicar `lib/rate-limit.ts` em envio de campanha/teste e import.
- Aceite: abuso é limitado; erro amigável; teste do limitador.
- Dependências: nenhuma.

### WS-5 · CRM — UX + i18n

**CRM-U1 · Consistência de loading/erro/vazio** — _Sonnet_
- Problema: estados inconsistentes entre leads/campanhas/calls.
- Abordagem: reusar os componentes de empty/skeleton (SA-U4) no CRM.
- Aceite: telas do CRM com estados coerentes.
- Dependências: SA-U4.

**CRM-U2 · Acessibilidade** — _Haiku_
- Problema: foco/aria/teclado a revisar (já há hotkeys).
- Abordagem: passar por foco visível, labels aria, ordem de tabulação nas telas
  principais.
- Aceite: navegação por teclado funcional; sem violações graves de a11y.
- Dependências: nenhuma.

**CRM-U3 · i18n do CRM (pt + de + demais)** — _Sonnet_
- Problema: strings hardcoded no CRM.
- Abordagem: extração para `messages/`, mesma convenção de SA-U1; traduzir `de` e
  demais.
- Aceite: CRM sem strings hardcoded; `de` completo.
- Dependências: alinhar namespaces com SA-U1.

### WS-6 · CRM — Features (Cold mail é o núcleo)

**CRM-F1 · Bulk actions em leads** — _Sonnet_
- Problema: editar leads um a um é lento.
- Abordagem: seleção múltipla na tabela de leads + ações em massa (mudar status,
  aplicar/remover tag, adicionar a campanha), respeitando escopo de workspace.
- Aceite: seleção e ação em massa funcionam com feedback e escopo correto.
- Dependências: CRM-S1 (garantir escopo antes de operar em massa).

**Cold mail — subworkstream (features que o dono priorizou como núcleo)**

**CM-1 · Janelas de envio + timezone + jitter** — _Opus_
- Problema: envia a qualquer hora/dia; robótico; ruim para deliverability.
- Abordagem: `calculateNextSendAt` passa a respeitar janela de horário comercial
  configurável por campanha/workspace, dias úteis, timezone do remetente (ou do
  lead se disponível) e jitter aleatório. Enrollments fora da janela são adiados
  para a próxima janela válida.
- Aceite: nenhum envio fora da janela/dias configurados; horários com variação
  natural; testes das funções de cálculo.
- Dependências: pode exigir campos novos em `Campaign`/`Workspace` (migração).

**CM-2 · Supressão global + tratamento de bounce** — _Opus_
- Problema: hard bounce não suprime o lead em campanhas futuras; sem lista de
  supressão.
- Abordagem: model `Suppression` (por e-mail/domínio, motivo, escopo global ou
  por workspace). No envio, checar supressão antes de mandar. Distinguir
  hard/soft bounce e alimentar a supressão em hard bounce e unsubscribe.
- Aceite: e-mail suprimido nunca recebe; hard bounce suprime automaticamente;
  UI admin/CRM lista supressões.
- Dependências: SA-S2 (opcional, para auditar), migração.

**CM-3 · Detecção de resposta para a sequência** — _Opus_
- Problema: lead que respondeu continua recebendo follow-ups.
- Abordagem: mecanismo de detecção de resposta (IMAP polling do inbox do
  remetente ou webhook do provedor), marcando o enrollment como `stopped`
  (`stopReason: replied`). Definir o mecanismo mínimo viável no plano.
- Aceite: resposta detectada para a sequência daquele lead; registrado.
- Dependências: CM-1 (mesma área do motor).

**CM-4 · `List-Unsubscribe` (one-click) + compliance** — _Sonnet_
- Problema: só footer HTML; falta header exigido por Gmail/Yahoo.
- Abordagem: adicionar headers `List-Unsubscribe` e
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` em `lib/email.ts`,
  apontando para a rota de unsubscribe existente; garantir que a rota aceita POST
  one-click.
- Aceite: headers presentes; unsubscribe one-click funciona; footer mantido.
- Dependências: nenhuma.

**CM-5 · Audiência de compradores potenciais + fluxo de prospecção** — _Sonnet_
- Problema: rodar campanha para vender listas a compradores não é um fluxo claro.
- Abordagem: permitir montar audiência de prospects (importar/segmentar leads
  marcados como "prospect comprador") e enrollá-los numa campanha de venda,
  reusando o motor. Definir como esses leads entram (import dedicado ou segmento).
- Aceite: é possível criar uma campanha de venda de lista para uma audiência de
  prospects e dispará-la com todas as proteções (janela, supressão, unsubscribe).
- Dependências: CM-1..CM-4, CRM-F1.

**CM-6 · A/B de assunto + warmup (incremento)** — _Sonnet_
- Problema: sem teste de variação nem ramp de volume.
- Abordagem: variantes de assunto/conteúdo por step com divisão de audiência;
  ramp gradual do `maxEmailsPerDay` ao longo dos primeiros dias.
- Aceite: variantes medidas por open/click; volume sobe gradualmente.
- Dependências: CM-1..CM-2. **Fase posterior** (não bloqueia produção).

**CRM-F2 · Widgets configuráveis no dashboard** — _Opus_
- Problema: dashboard fixo.
- Abordagem: layout de widgets reordenáveis/ocultáveis (já há `@dnd-kit`),
  persistindo preferência por usuário/workspace.
- Aceite: usuário reordena/oculta widgets; persiste.
- Dependências: nenhuma. **Fase posterior.**

## Sequenciamento sugerido (fases)

**Fase 0 — Fundações de segurança (fazer primeiro):**
SA-S1, SA-S2, CRM-S1. São fundacionais e várias features dependem do audit log e
do isolamento verificado.

**Fase 1 — Produção-crítico (segurança + cold mail núcleo + i18n):**
SA-S3, SA-S4, CRM-S2, CM-1, CM-2, CM-3, CM-4, SA-U1, CRM-U3, SA-U2.

**Fase 2 — Features de operação e suporte:**
SA-F1, SA-F4, SA-F3, CRM-F1, CM-5, SA-U3, SA-U4, CRM-U1, CRM-U2, SA-F2.

**Fase 3 — Incrementos:**
CM-6, CRM-F2.

## Racional de atribuição de modelo

- **Opus** — decisões de schema, segurança e qualquer coisa com risco de
  vazamento de dados ou sessão: SA-S1, SA-S2, SA-F3, CRM-S1, CM-1, CM-2, CM-3,
  CRM-F2.
- **Sonnet** — features e refactors de componente de complexidade média: SA-S3,
  SA-U1, SA-U3, SA-F1, SA-F2, SA-F4, CRM-S2, CRM-U1, CRM-U3, CRM-F1, CM-4, CM-5,
  CM-6.
- **Haiku** — trabalho mecânico e repetitivo: SA-S4, SA-U2, SA-U4, CRM-U2.

## Fora de escopo (por ora)

- Reescrita do motor de cold mail (evoluímos o existente).
- Migração de provedor de e-mail ou de autenticação.
- Refatorações não relacionadas às três frentes.
- Marketplace público (foco é super-admin e CRM).

## Riscos e observações

- **Migrações Prisma no ambiente atual rodam sem shadow DB** (memória do projeto).
  Audit log, supressão e campos de janela de envio exigem migração.
- **Impersonation** é a feature de maior risco de segurança — precisa de revisão
  cuidadosa (não vazar sessão real, auditar tudo, bloquear ações destrutivas no
  modo). Justifica Opus e talvez um code-review dedicado.
- **Detecção de resposta (CM-3)** pode exigir credenciais IMAP ou webhook do
  provedor — definir o mínimo viável no plano de implementação evita bloqueio.
- **i18n em duas áreas grandes** é volumoso; a extração mecânica pode ser
  paralelizada, mas a convenção de namespaces precisa ser decidida antes.
