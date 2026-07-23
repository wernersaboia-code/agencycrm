# Listas como PDF de estudo de mercado

**Data:** 2026-07-23
**Status:** Aprovado para planejamento

## Contexto

As listas do marketplace (`LeadList`) estão deixando de ser "planilhas de leads"
para se tornarem **PDFs de estudo de mercado**: um documento único, curado à mão
fora do sistema, sem número fixo de leads por arquivo. O comprador baixa esse PDF.

O cadastro de leads (`MarketplaceLead`, import CSV/Excel no admin) **continua
existindo em paralelo** para uso interno — apenas a **entrega ao comprador** passa
a ser o PDF, e os números orientados a lead somem das telas públicas.

## Decisões

- **Origem do PDF:** upload de arquivo pronto por lista (não gerado pelo sistema).
- **Entrega:** só PDF para o comprador. As rotas CSV/Excel **permanecem no código**
  (sem uso na UI), pois podem ser úteis no futuro.
- **Idioma:** uma língua por lista, entre as 7 do app (`pt`, `en`, `de`, `fr`,
  `es`, `it`, `nl`), exibida como bandeira.
- **Introdução:** campo novo, separado da descrição curta, exibido na página de
  detalhe.
- **Remoção de nº de leads e valor/lead:** de **todas** as superfícies públicas
  (card, resumo do catálogo, página de detalhe).
- **Mapa língua → bandeira:** `pt`→🇧🇷 BR, `en`→🇬🇧 GB, `de`→🇩🇪 DE, `fr`→🇫🇷 FR,
  `es`→🇪🇸 ES, `it`→🇮🇹 IT, `nl`→🇳🇱 NL. Centralizado em uma constante para troca fácil.

## Modelo de dados (`prisma/schema.prisma` → `LeadList`)

Campos adicionados (nada removido; `totalLeads`/`price` continuam para uso interno
e para o carrinho):

```prisma
introduction String? @db.Text
language     String? // 'pt' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl'
studyPdfUrl  String?
studyPdfName String?
```

Migração Prisma aplicada sem shadow DB (ambiente atual).

## Storage do PDF

- Bucket **privado** novo no Supabase: `list-studies` (produto pago → sem URL
  pública adivinhável). Criado como passo de setup (SQL em `storage.buckets` ou
  painel).
- Novo helper em `lib/supabase/storage.ts` (ou arquivo irmão): `uploadListPdf(file,
  listId)` e `removeListPdf(listId)`, espelhando `uploadLogo`, mas aceitando
  `application/pdf`, limite ~20MB, caminho `list-studies/{listId}/study-{ts}.pdf`.
- Upload feito **server-side** via route handler (não server action — limite de
  1MB de body): `POST /api/admin/lists/[id]/pdf` (multipart), protegido por
  `requireAdmin()`. Atualiza `studyPdfUrl`/`studyPdfName` da lista.

## Admin — formulário da lista (`components/admin/list-form.tsx`)

- **Card novo "Estudo de mercado (PDF)":** input de arquivo, mostra nome/tamanho,
  permite trocar/remover. Em modo criação: cria a lista e então faz upload
  (mesmo padrão do fluxo de leads). Em modo edição: upload imediato para a lista.
- **Campo "Introdução":** textarea longa, separada da descrição.
- **Seletor "Idioma":** single-select com bandeira (as 7 línguas).
- **Card "Importar Leads":** permanece (uso interno).
- Ajustar zod schema do form e `CreateListData`/`listDataSchema` em
  `actions/admin/lists.ts` para incluir `introduction` e `language`
  (`createList`/`updateList` gravam os dois; PDF vai pela rota dedicada).

## Comprador — entrega (`components/marketplace/public-purchase-card.tsx`)

- Substituir os botões **CSV** e **Excel** por um único **"Baixar PDF"** por item;
  no caso de múltiplas listas, **"Baixar tudo (PDF)"**.
- Nova rota `GET /api/purchases/[id]/download-pdf`: valida a compra do usuário,
  incrementa `downloadCount`/`downloadedAt`, gera **signed URL** curto do bucket
  privado e redireciona. Se a lista não tiver PDF, retorna erro amigável.
- `app/[locale]/my-purchases/page.tsx`: remover o texto de orientação "Excel"
  (`guidanceExcel*`) e ajustar a cópia para PDF.
- Rotas `/api/purchases/[id]/download` (CSV) e `/download-excel` **ficam no código**,
  sem uso.

## Público — remover nº de leads e valor/lead

- `components/marketplace/list-card.tsx`: remover a linha "X empresas"
  (`t("companies")`) e o "valor por lead" no rodapé; remover o cálculo
  `pricePerLead`.
- `components/marketplace/catalog-stats.tsx` + `app/[locale]/catalog/page.tsx`:
  remover a métrica de leads visíveis (`visibleLeadTotal` / `statLeadsOnPage`).
  Substituir por outra métrica útil (ex.: nº de países/idiomas) ou reduzir para 3
  cards — a definir no plano.
- `app/[locale]/list/[slug]/page.tsx`: remover `quickLeads`, `quickPricePerLead`,
  `fieldTotalLeads`, `fieldPricePerLead`, a nota `leadsIncluded` e o subtítulo
  `perLead`; remover o cálculo `pricePerLead`. O preço absoluto permanece.

## Público — mostrar idioma e introdução

- **Card** (`list-card.tsx`): bandeira do idioma (pequena), próxima às bandeiras
  de país.
- **Detalhe** (`list/[slug]/page.tsx`): bandeira + nome do idioma; **introdução**
  em destaque (no lugar/acima da grade de métricas numéricas removida).
- Nova constante de idioma → `{ flagCode, labelKey }` (ex.: `lib/constants/list-languages.ts`),
  reutilizada por admin e público. Reusa o `FlagIcon` existente.

## i18n (`messages/*.json`, 7 arquivos)

- Novas chaves: rótulo/idiomas, "introdução", "Baixar PDF" / "Baixar tudo (PDF)".
- Ajustar a seção "o que está incluído" do detalhe (`includedFormats`) que hoje
  cita `.csv/.xlsx` para refletir PDF.
- Chaves agora sem uso (`perLead`, `quickLeads`, `quickPricePerLead`,
  `fieldTotalLeads`, `fieldPricePerLead`, `leadsIncluded`, `statLeadsOnPage`,
  `guidanceExcel*`) podem ser deixadas ou limpas — decidir no plano (baixa
  prioridade).

## Fora de escopo

- Geração automática de PDF a partir de dados.
- Remoção do sistema de import/leads.
- Reestruturação das seções "preview" e "o que está incluído" além dos ajustes
  citados.
- Moeda / termos / privacidade (frentes separadas já registradas).

## Arquivos afetados (resumo)

| Área | Arquivo |
|------|---------|
| Schema | `prisma/schema.prisma` |
| Storage | `lib/supabase/storage.ts` (+ bucket `list-studies`) |
| Upload admin | `app/api/admin/lists/[id]/pdf/route.ts` (novo) |
| Actions | `actions/admin/lists.ts` |
| Form admin | `components/admin/list-form.tsx` |
| Download comprador | `app/api/purchases/[id]/download-pdf/route.ts` (novo) |
| Card compra | `components/marketplace/public-purchase-card.tsx` |
| My purchases | `app/[locale]/my-purchases/page.tsx` |
| Card catálogo | `components/marketplace/list-card.tsx` |
| Stats catálogo | `components/marketplace/catalog-stats.tsx`, `app/[locale]/catalog/page.tsx` |
| Detalhe | `app/[locale]/list/[slug]/page.tsx` |
| Constante idioma | `lib/constants/list-languages.ts` (novo) |
| i18n | `messages/{pt,en,de,fr,es,it,nl}.json` |
| Marketplace query | `actions/marketplace.ts` (selecionar `language`, `introduction`) |
