# Auditoria de isolamento multi-tenant — actions authOnly do CRM (CRM-S1)

Data: 2026-07-23
Escopo: `actions/calls.ts`, `actions/campaigns.ts`, `actions/templates.ts`, `actions/dashboard.ts`, `actions/settings.ts`.

## Modelo de isolamento (referência)

- Recurso que pertence a um workspace deve filtrar por `workspace: { userId }` (ou resolver via `requireWorkspaceAccess`/`createWorkspaceServiceContext`).
- Recurso que pertence direto ao `User` deve filtrar por `userId` do usuário autenticado.
- Uma função que recebe um `id` de recurso e o resolve **sem** amarrar ao dono é CORRIGIR.

Notas de método:
- `requireWorkspaceAccess(workspaceId)` confirma `workspace.userId === user.id` antes de prosseguir; queries subsequentes por `{ workspaceId }` ficam efetivamente escopadas ao dono.
- `verifyWorkspaceAccess` (helper local em `calls.ts`) é um wrapper booleano sobre `requireWorkspaceAccess` — mesmo efeito de guarda.
- Nos padrões `findFirst({ where: { id, workspace: { userId } } })` seguidos de `update/delete({ where: { id } })`, a propriedade do recurso já foi resolvida pela leitura amarrada ao dono; o `update` por `{ id }` é seguro.
- Quando `workspaceId` vem do cliente mas o `where` também inclui `workspace: { userId: user.id }`, um `workspaceId` de outro dono retorna vazio (interseção) — seguro.

## Tabela de auditoria

### actions/calls.ts

| Função | Lê/muta | Filtra por dono? | Veredito |
|---|---|---|---|
| `getCalls(workspaceId, filters)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCallById(id)` | lê call | `where { id, workspace: { userId } }` | OK |
| `getCallsByLead(leadId)` | lê calls | `where { leadId, workspace: { userId } }` | OK |
| `getCallsByCampaign(campaignId)` | lê calls | `where { campaignId, campaign: { workspace: { userId } } }` | OK |
| `createCall(data)` | cria call, muta lead | `verifyWorkspaceAccess` + lead/campaign `findFirst { id, workspaceId }` | OK |
| `updateCall(id, data)` | muta call/lead | `findFirst { id, workspace: { userId } }`; campaign escopada a `existingCall.workspaceId` | OK |
| `deleteCall(id)` | deleta call | `findFirst { id, workspace: { userId } }` antes de `delete { id }` | OK |
| `getPendingCallbacks(workspaceId)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCallStats(workspaceId, ...)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCampaignCallStats(campaignId)` | lê calls | `where { campaignId, campaign: { workspace: { userId } } }` | OK |
| `getCallsPerDayData(workspaceId, days)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCallsByResultData(workspaceId)` | lê calls (groupBy) | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCallsDurationData(workspaceId, days)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |
| `getCallsConversionData(workspaceId)` | lê calls | `verifyWorkspaceAccess` + `where.workspaceId` | OK |

### actions/campaigns.ts

| Função | Lê/muta | Filtra por dono? | Veredito |
|---|---|---|---|
| `getCampaigns(workspaceId, options)` | lê campaigns | `requireWorkspaceAccess` + `where.workspaceId` | OK |
| `getCampaignById(id)` | lê campaign | `where { id, workspace: { userId } }` | OK |
| `createCampaign(data)` | cria campaign | `requireWorkspaceAccess`; leads/template escopados a `workspaceId` | OK |
| `updateCampaign(id, data)` | muta campaign | `findFirst { id, workspace: { userId } }` antes de `update { id }` | OK |
| `deleteCampaign(id)` | deleta campaign | `findFirst { id, workspace: { userId } }` antes de `delete { id }` | OK |
| `duplicateCampaign(id)` | lê+cria campaign | `findFirst { id, workspace: { userId } }` | OK |
| `sendCampaign(id)` | muta campaign/envia | `findFirst { id, workspace: { userId } }` | OK |
| `pauseCampaign(id)` | muta campaign/enrollments | `findFirst { id, workspace: { userId }, status }`; enrollments por `campaignId` já resolvido | OK |
| `cancelCampaign(id)` | muta campaign/enrollments | `findFirst { id, workspace: { userId } }`; enrollments por `campaignId` já resolvido | OK |
| `getLeadsForCampaign(workspaceId, options)` | lê leads | `where { workspaceId, workspace: { userId } }` | OK |

### actions/templates.ts

| Função | Lê/muta | Filtra por dono? | Veredito |
|---|---|---|---|
| `getTemplates(workspaceId, options)` | lê templates | `requireWorkspaceAccess` + `where.workspaceId` | OK |
| `getTemplateById(id)` | lê template | `where { id, workspace: { userId } }` | OK |
| `createTemplate(data)` | cria template | `requireWorkspaceAccess(workspaceId)` | OK |
| `updateTemplate(id, data)` | muta template | `findFirst { id, workspace: { userId } }` antes de `update { id }` | OK |
| `deleteTemplate(id)` | deleta template | `findFirst { id, workspace: { userId } }` antes de `delete { id }` | OK |
| `duplicateTemplate(id)` | lê+cria template | `findFirst { id, workspace: { userId } }` | OK |
| `toggleTemplateActive(id)` | muta template | `findFirst { id, workspace: { userId } }` antes de `update { id }` | OK |

### actions/dashboard.ts

| Função | Lê/muta | Filtra por dono? | Veredito |
|---|---|---|---|
| `getDashboardStats(workspaceId)` | lê leads/campaigns/emailSend/calls | `requireWorkspaceAccess` + `where.workspaceId` (emailSend via `campaign: { workspaceId }`) | OK |
| `getRecentCampaigns(workspaceId, limit)` | lê campaigns | `where { workspaceId, workspace: { userId } }` | OK |
| `getRecentLeads(workspaceId, limit)` | lê leads | `where { workspaceId, workspace: { userId } }` | OK |
| `getEmailsOverTime(workspaceId, days)` | lê emailSend | `requireWorkspaceAccess` + `campaign: { workspaceId }` | OK |
| `getDashboardCallbacks(workspaceId)` | lê calls | `where { workspaceId, workspace: { userId } }` | OK |
| `getDashboardGuidance(workspaceId)` | lê workspace/templates/leads/campaigns/calls | `requireWorkspaceAccess` antes; queries por `workspaceId` | OK |

### actions/settings.ts

| Função | Lê/muta | Filtra por dono? | Veredito |
|---|---|---|---|
| `getUserProfile()` | lê user | `findUnique { id: authUser.id }` (recurso do User) | OK |
| `updateUserProfile(data)` | muta user | `update { id: authUser.id }` (recurso do User) | OK |
| `getAccountStats()` | lê contagens | workspaces por `userId`; contagens escopadas a `workspaceIds` do dono | OK |

## Conclusão

Todas as funções exportadas auditadas já amarram cada leitura/escrita ao dono — via
`workspace: { userId }`, via `requireWorkspaceAccess`/`verifyWorkspaceAccess` antes de
consultar por `workspaceId`, ou (em `settings.ts`) via `userId` do usuário autenticado
para recursos que pertencem direto ao `User`. **Nenhuma função marcada CORRIGIR.**

O padrão de guarda multi-tenant do codebase já está consistentemente aplicado nestes 5
arquivos. O helper puro `buildOwnedWhere` foi adicionado (`lib/auth/resource-ownership.ts`,
com testes) como utilitário reutilizável para futuras queries authOnly que resolvam
recursos por id e precisem do filtro de dono, padronizando o `where` `workspace: { userId }`.

Nenhuma alteração de comportamento foi feita nas actions (para não introduzir risco em
código já seguro, conforme escopo da task).
