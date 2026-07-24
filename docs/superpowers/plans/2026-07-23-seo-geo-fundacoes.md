# SEO/GEO — Fundações (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir as falhas de SEO detectadas na auditoria e dar ao site uma identidade de entidade estruturada, para que buscadores e motores de resposta (GEO) possam identificar, exibir e citar o Easy Prospect.

**Architecture:** Um módulo único de construtores de JSON-LD puros e testáveis (`lib/seo/schema.ts`), consumido pelas páginas via um componente burro `<JsonLd>`; uma regra pura de indexabilidade por locale (`lib/seo/indexability.ts`) aplicada nas rotas do segmento `[locale]`; e correções pontuais de metadata. Nada de dado inventado: todo schema só afirma o que existe no banco ou no copy aprovado.

**Tech Stack:** Next.js 16 (App Router, Metadata API), next-intl (7 locales), Prisma 6 + Postgres, Vitest (env node), TypeScript.

## Global Constraints

- **Migrações:** este plano **não** altera o schema Prisma. Se alguma tarefa parecer exigir migração, pare e reporte — não é esperado.
- **Testes:** Vitest, arquivos `*.test.ts` colocados ao lado do código, `import { describe, it, expect } from "vitest"`, alias `@` → raiz do repo. Rodar com `npm test`.
- **Node não está no PATH:** nos shells bash, `export PATH="/c/Program Files/nodejs:$PATH"` antes de npm/npx (não persiste entre chamadas).
- **`PUBLISHED_LOCALES`** (`lib/i18n/locales.ts`) = `["pt","de","en","es","fr","it","nl"]` são os locales COM tradução real. `LOCALES` inclui também `"ar"`, que é roteável mas **não** publicado. Toda regra de indexação/anúncio usa `PUBLISHED_LOCALES`.
- **`BASE_URL`** vem sempre de `process.env.NEXT_PUBLIC_APP_URL` com fallback `"https://www.easyprospect.com.br"` — mesmo padrão de `lib/i18n/alternates.ts` e `app/sitemap.ts`. Nunca hardcodar outro domínio.
- **Honestidade de claims (regra de negócio, não estética).** O schema e o copy só podem afirmar o que é verificável hoje:
  - PODE: "compiladas a partir de pesquisa própria"; "cada empresa é conferida em fontes públicas online".
  - NÃO PODE: afirmar equipe/analistas humanos revisando cada registro, "banco de dados proprietário", número de clientes/vendas, selo de certificação, ou **cadência de atualização que ainda não aconteceu**.
  - Não é exigido revelar ferramentas internas — omitir stack é legítimo; **criar impressão falsa não é**.
  - Precedente do projeto: a `StatsSection` da home foi desmontada de propósito por conter números placeholder. Manter esse padrão.
- **Nunca aplicar markup sobre texto provisório.** Se um conteúdo contém `[PLACEHOLDER]` ou uma afirmação não verificável, o conserto do texto é pré-requisito do schema — dado estruturado é amplificador, e amplificar texto falso é pior do que não ter schema. Vale para o FAQ (Task 3) e para qualquer conteúdo futuro.
- **Nenhum `aggregateRating`, `review`, nem `AggregateOffer` fabricado.** Só emitir schema de avaliação quando houver avaliação real no banco (não há hoje).
- **Comentários e copy em pt-BR** no código; textos de usuário sempre via `messages/*.json` nos 7 locales.

---

### Task 1: Corrigir `og:image` ausente na home

A home renderiza `twitter:image` mas não `og:image`. Causa: `generateMetadata` em `app/[locale]/page.tsx` declara um objeto `openGraph` sem `images`, e o merge raso do Next substitui o `openGraph` do layout raiz (onde vive `images`). Prova: o `twitter` do layout sobrevive porque a página não o sobrescreve.

**Files:**
- Modify: `app/[locale]/page.tsx` (bloco `openGraph` dentro de `generateMetadata`)
- Create (test): `app/[locale]/page.metadata.test.ts`

**Interfaces:**
- Produces: nada consumido por outras tasks. É uma correção isolada.

- [ ] **Step 1: Escrever o teste que falha**

Criar `app/[locale]/page.metadata.test.ts`. O teste chama o `generateMetadata` real e afirma que a imagem sobrevive:

```typescript
import { describe, it, expect, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => (key: string) =>
        key === "title" ? "Título de teste" : "Descrição de teste",
}))

import { generateMetadata } from "./page"

describe("metadata da home", () => {
    it("mantém a imagem de Open Graph ao sobrescrever openGraph", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "pt" }) })

        // O merge do Next é raso: declarar `openGraph` na página apaga o
        // `images` do layout raiz. A página precisa reafirmar a imagem.
        expect(meta.openGraph).toBeDefined()
        expect(meta.openGraph?.images).toBeTruthy()
    })

    it("mantém título, descrição e locale de Open Graph", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "pt" }) })

        expect(meta.openGraph?.title).toBe("Título de teste")
        expect(meta.openGraph?.description).toBe("Descrição de teste")
        expect(meta.openGraph?.locale).toBe("pt_BR")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- page.metadata`
Expected: FAIL no primeiro teste — `meta.openGraph.images` é `undefined`.

- [ ] **Step 3: Reafirmar a imagem no `openGraph` da página**

Em `app/[locale]/page.tsx`, dentro do objeto retornado por `generateMetadata`, acrescentar `images` ao bloco `openGraph` (mantendo os campos existentes):

```typescript
        openGraph: {
            title: t("title"),
            description: t("description"),
            locale: ogLocaleFor(locale as Locale),
            // O merge de metadata do Next é raso: declarar `openGraph` aqui
            // substitui o do layout raiz inteiro, levando junto o `images`.
            // Sem esta linha a home é compartilhada sem imagem no LinkedIn,
            // WhatsApp e Slack — o `twitter:image` só sobrevive porque esta
            // página não declara um bloco `twitter`.
            images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
        },
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- page.metadata`
Expected: PASS (2/2).

- [ ] **Step 5: Confirmar no HTML renderizado**

Subir o dev server (porta 3001) e rodar:
```bash
curl -s http://localhost:3001/ | grep -o 'property="og:image[^"]*" content="[^"]*"'
```
Expected: pelo menos uma linha com `og:image`. (Antes da correção, zero linhas.)

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/page.tsx" "app/[locale]/page.metadata.test.ts"
git commit -m "fix(seo): restaurar og:image da home perdido no merge de metadata"
```

---

### Task 2: Módulo de schema + `Organization` e `WebSite` no layout

Não existe nenhum JSON-LD no app (`grep application/ld+json` → 0). Esta task cria a fundação: construtores puros + o componente de renderização + os dois schemas globais.

**Files:**
- Create: `lib/seo/schema.ts`
- Create (test): `lib/seo/schema.test.ts`
- Create: `components/seo/json-ld.tsx`
- Modify: `app/layout.tsx` (renderizar os schemas globais)

**Interfaces:**
- Produces (usado por todas as tasks 3-5):
  - `BASE_URL: string` — origem canônica, de `NEXT_PUBLIC_APP_URL`.
  - `buildOrganizationSchema(): Record<string, unknown>` — `@type: "Organization"`, com `name`, `url`, `logo`, `@id: ${BASE_URL}#organization`.
  - `buildWebSiteSchema(): Record<string, unknown>` — `@type: "WebSite"`, com `name`, `url`, `inLanguage`, `publisher: { "@id": ... }`.
  - `<JsonLd data={...} />` — componente server que renderiza `<script type="application/ld+json">`.

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/seo/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { buildOrganizationSchema, buildWebSiteSchema, BASE_URL } from "./schema"

describe("buildOrganizationSchema", () => {
    it("identifica a organização com @id estável e url absoluta", () => {
        const schema = buildOrganizationSchema()

        expect(schema["@context"]).toBe("https://schema.org")
        expect(schema["@type"]).toBe("Organization")
        expect(schema["@id"]).toBe(`${BASE_URL}#organization`)
        expect(schema.name).toBe("Easy Prospect")
        expect(schema.url).toBe(BASE_URL)
    })

    it("usa logo absoluto", () => {
        const schema = buildOrganizationSchema()
        expect(String(schema.logo)).toContain(BASE_URL)
    })
})

describe("buildWebSiteSchema", () => {
    it("aponta o publisher para a organização pelo @id", () => {
        const schema = buildWebSiteSchema()

        expect(schema["@type"]).toBe("WebSite")
        expect(schema.url).toBe(BASE_URL)
        expect(schema.publisher).toEqual({ "@id": `${BASE_URL}#organization` })
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- seo/schema`
Expected: FAIL — `Cannot find module './schema'`.

- [ ] **Step 3: Implementar `lib/seo/schema.ts`**

```typescript
/**
 * Construtores de JSON-LD (schema.org).
 *
 * São funções PURAS: recebem dados e devolvem objetos. Nenhuma faz I/O, para
 * poderem ser testadas sem banco nem request.
 *
 * Regra do projeto: schema só afirma o que existe de fato. Nada de
 * aggregateRating, review ou contagem de clientes enquanto não houver esse
 * dado real no banco.
 */

export const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

export const ORGANIZATION_ID = `${BASE_URL}#organization`

const ORGANIZATION_NAME = "Easy Prospect"

export function buildOrganizationSchema(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: ORGANIZATION_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/logo-icon.png`,
    }
}

export function buildWebSiteSchema(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${BASE_URL}#website`,
        name: ORGANIZATION_NAME,
        url: BASE_URL,
        publisher: { "@id": ORGANIZATION_ID },
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- seo/schema`
Expected: PASS.

- [ ] **Step 5: Criar o componente `<JsonLd>`**

Criar `components/seo/json-ld.tsx`:

```tsx
/**
 * Renderiza um bloco JSON-LD. Componente burro de propósito: toda a lógica
 * de montagem vive em lib/seo/schema.ts, que é testável sem DOM.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}
```

Nota sobre `dangerouslySetInnerHTML`: o conteúdo vem de `JSON.stringify` sobre objetos que nós montamos, não de entrada de usuário livre. Nas tasks 4 e 5, onde entram strings do banco, o `JSON.stringify` já escapa aspas e barras; não inserir HTML cru dentro dos valores.

- [ ] **Step 6: Renderizar os schemas globais no layout raiz**

Em `app/layout.tsx`, importar e renderizar dentro do `<body>` (antes de `{children}`):

```tsx
import { JsonLd } from "@/components/seo/json-ld"
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/schema"
```

```tsx
                <JsonLd data={buildOrganizationSchema()} />
                <JsonLd data={buildWebSiteSchema()} />
```

- [ ] **Step 7: Verificar tsc, lint e HTML renderizado**

Run: `npx tsc --noEmit && npm run lint`
Depois, com o dev server no ar:
```bash
curl -s http://localhost:3001/ | grep -c 'application/ld+json'
```
Expected: `2` (Organization + WebSite).

- [ ] **Step 8: Commit**

```bash
git add lib/seo/schema.ts lib/seo/schema.test.ts components/seo/json-ld.tsx app/layout.tsx
git commit -m "feat(seo): schema Organization e WebSite (fundação de JSON-LD)"
```

---

### Task 3: Reescrever as respostas do FAQ e então aplicar `FAQPage` schema

**⚠️ GATE DE VERACIDADE — ler antes de qualquer coisa.**

O FAQ tem 8 perguntas em `messages/*.json` (`faq.items`, objetos `{ question, answer }`), mas **7 das 8 respostas são placeholders**. O próprio arquivo tem uma chave `faq._placeholder` dizendo: *"PLACEHOLDER: respostas provisórias — revisar/confirmar todas antes do go-live."*

Pior: a resposta 1 ("De onde vêm os dados e como são verificados?") afirma que os dados são *"verificados **manualmente**"* — o que **não é verdade** e viola as Global Constraints deste plano.

Aplicar `FAQPage` schema sobre esse conteúdo publicaria o texto `[PLACEHOLDER]` e uma afirmação falsa em dados estruturados consumidos pelo Google e por motores de resposta. Isso é **pior do que não ter schema**. Portanto:

**A reescrita das respostas é pré-requisito do markup, na mesma task.** Não renderizar o JsonLd enquanto existir `[PLACEHOLDER]` em qualquer resposta.

As respostas 3, 4, 5 e 6 (formatos, prévia antes da compra, pagamento, países/setores) são **factuais e verificáveis no próprio código** — a entrega é PDF (ver `LeadList.studyPdfUrl` e o fluxo de `/my-purchases`), o pagamento é PayPal (`lib/paypal.ts`), e os países/setores saem de `LeadList.countries`/`industries`. Consultar o código para respondê-las com precisão, em vez de generalizar.

As respostas 1, 2 e 7 (origem/verificação dos dados, atualidade, relatório de mercado) tocam os claims sensíveis: aplicar exatamente as regras das Global Constraints — pesquisa própria ✅, conferência em fontes públicas ✅, equipe humana revisando cada registro ❌, cadência ainda não praticada ❌.

A resposta 8 (LGPD/GDPR) já está escrita e **não** deve ser alterada aqui.

**Files:**
- Modify: `messages/pt.json` + os outros 6 idiomas (`faq.items`, remover também a chave `faq._placeholder`)
- Modify: `lib/seo/schema.ts` (novo construtor)
- Modify: `lib/seo/schema.test.ts` (novos testes)
- Modify: `app/[locale]/faq/page.tsx` (renderizar o JsonLd)

**Interfaces:**
- Consumes: `BASE_URL`, `ORGANIZATION_ID`, `<JsonLd>` (Task 2).
- Produces: `buildFaqSchema(items: { question: string; answer: string }[]): Record<string, unknown>`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `lib/seo/schema.test.ts`:

```typescript
import { buildFaqSchema } from "./schema"

describe("buildFaqSchema", () => {
    it("mapeia cada par pergunta/resposta para Question + Answer", () => {
        const schema = buildFaqSchema([
            { question: "Como recebo a lista?", answer: "Por download em PDF." },
        ])

        expect(schema["@type"]).toBe("FAQPage")
        expect(schema.mainEntity).toEqual([
            {
                "@type": "Question",
                name: "Como recebo a lista?",
                acceptedAnswer: { "@type": "Answer", text: "Por download em PDF." },
            },
        ])
    })

    it("ignora itens sem pergunta ou sem resposta", () => {
        const schema = buildFaqSchema([
            { question: "Válida?", answer: "Sim." },
            { question: "", answer: "Sem pergunta" },
            { question: "Sem resposta", answer: "" },
        ])

        expect((schema.mainEntity as unknown[]).length).toBe(1)
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- seo/schema`
Expected: FAIL — `buildFaqSchema is not a function`.

- [ ] **Step 3: Implementar o construtor**

Acrescentar a `lib/seo/schema.ts`:

```typescript
export interface FaqItem {
    question: string
    answer: string
}

/**
 * Só entram itens com pergunta E resposta preenchidas: FAQPage com Question
 * vazia é erro de rich result no Search Console.
 */
export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items
            .filter((item) => item.question.trim() && item.answer.trim())
            .map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- seo/schema`
Expected: PASS (todos, incluindo os da Task 2).

- [ ] **Step 4b: Reescrever as 7 respostas placeholder (GATE — antes do markup)**

Em `messages/pt.json`, substituir as respostas 1–7 (manter a 8, de LGPD/GDPR) e **remover a chave `faq._placeholder`**. Depois replicar nos outros 6 idiomas.

Para as respostas 3, 4, 5 e 6: ler o código antes de escrever (entrega em PDF, prévia, PayPal, países/setores das listas ativas) e responder com o que o sistema faz de fato.

Para as respostas 1, 2 e 7, usar estas formulações (já checadas contra as Global Constraints):

```
1. "De onde vêm os dados e como são verificados?"
   "As listas nascem de pesquisa própria e são compiladas pela nossa
    operação. Antes de entrar numa lista, cada empresa é conferida em
    fontes públicas — site institucional, presença digital e registros
    disponíveis — para confirmar que existe, que atua no setor indicado
    e que os canais de contato estão ativos."

2. "Qual a atualidade das listas?"
   "Cada lista informa a data da sua última revisão. O catálogo é
    revisado periodicamente, e listas que deixam de refletir o mercado
    saem do ar em vez de continuar à venda."

7. "O que está incluído no relatório de mercado que acompanha a lista?"
   → descrever o que o PDF realmente contém hoje (ver `LeadList.introduction`
     e um PDF real já cadastrado). Se o conteúdo variar por lista, dizer isso
     em vez de prometer um índice fixo.
```

**Nota sobre a resposta 2:** ela promete "cada lista informa a data da sua última revisão" — isso exige um campo de data de revisão exibido na página da lista. Se esse campo ainda não existir na UI, **ou** implementá-lo nesta task, **ou** reescrever a resposta para não prometê-lo. Não publicar a promessa sem o dado. Reportar como concern se a decisão não for óbvia.

- [ ] **Step 4c: Teste que impede placeholder de virar schema**

Acrescentar a `lib/seo/schema.test.ts`:

```typescript
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

describe("integridade do conteúdo do FAQ", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: nenhuma resposta do FAQ é placeholder`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            for (const item of messages.faq.items) {
                expect(item.answer).not.toContain("PLACEHOLDER")
                expect(item.answer.trim().length).toBeGreaterThan(0)
            }
        })
    }
})
```

Rodar: `npm test -- seo/schema`. Este teste deve **falhar antes** do Step 4b e passar depois — é o gate que impede o markup de amplificar texto provisório.

- [ ] **Step 5: Renderizar na página do FAQ**

Só depois do Step 4c passar. Em `app/[locale]/faq/page.tsx`, carregar os itens traduzidos com `getTranslations` no namespace `faq` (cada item é `{ question, answer }`) e renderizar o schema junto do conteúdo.

```tsx
import { JsonLd } from "@/components/seo/json-ld"
import { buildFaqSchema } from "@/lib/seo/schema"
```

Dentro do componente, montar `items` a partir das mensagens do locale corrente e renderizar:

```tsx
    return (
        <>
            <JsonLd data={buildFaqSchema(items)} />
            <FaqPageContent locale={toLandingLocale(locale)} />
        </>
    )
```

- [ ] **Step 6: Verificar no HTML renderizado**

```bash
curl -s http://localhost:3001/faq | grep -o '"@type":"FAQPage"'
curl -s http://localhost:3001/faq | grep -o '"@type":"Question"' | wc -l
```
Expected: `"@type":"FAQPage"` presente e a contagem de `Question` igual ao número de itens preenchidos (8).

- [ ] **Step 7: tsc, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/seo/schema.ts lib/seo/schema.test.ts "app/[locale]/faq/page.tsx"
git commit -m "feat(seo): FAQPage schema na página de perguntas frequentes"
```

---

### Task 4: `Product`/`Offer` + `BreadcrumbList` nas páginas de lista

O site é um marketplace com preço e não declara produto nem preço. Cada lista (`LeadList`) tem `name`, `slug`, `description`, `price`, `currency`, `isActive`.

**Files:**
- Modify: `lib/seo/schema.ts` (dois construtores)
- Modify: `lib/seo/schema.test.ts`
- Modify: `app/[locale]/list/[slug]/page.tsx`

**Interfaces:**
- Consumes: `BASE_URL`, `ORGANIZATION_ID`, `<JsonLd>`.
- Produces:
  - `buildProductSchema(input: { name: string; slug: string; description: string | null; price: number; currency: string; isActive: boolean; locale: string }): Record<string, unknown>`
  - `buildBreadcrumbSchema(trail: { name: string; url: string }[]): Record<string, unknown>`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar a `lib/seo/schema.test.ts`:

```typescript
import { buildProductSchema, buildBreadcrumbSchema } from "./schema"

describe("buildProductSchema", () => {
    const base = {
        name: "Importadores de Café — Alemanha",
        slug: "importadores-cafe-alemanha",
        description: "Lista de importadores alemães.",
        price: 149.9,
        currency: "EUR",
        isActive: true,
        locale: "pt",
    }

    it("declara a oferta com preço, moeda e url canônica", () => {
        const schema = buildProductSchema(base)

        expect(schema["@type"]).toBe("Product")
        expect(schema.name).toBe(base.name)
        const offer = schema.offers as Record<string, unknown>
        expect(offer["@type"]).toBe("Offer")
        expect(offer.price).toBe("149.90")
        expect(offer.priceCurrency).toBe("EUR")
        expect(offer.url).toBe(`${BASE_URL}/list/${base.slug}`)
    })

    it("declara o idioma da página", () => {
        expect(buildProductSchema(base).inLanguage).toBe("pt")
    })

    it("marca disponibilidade a partir de isActive", () => {
        const ativo = buildProductSchema(base).offers as Record<string, unknown>
        const inativo = buildProductSchema({ ...base, isActive: false }).offers as Record<string, unknown>

        expect(ativo.availability).toBe("https://schema.org/InStock")
        expect(inativo.availability).toBe("https://schema.org/OutOfStock")
    })

    it("não inventa avaliação nem estoque numérico", () => {
        const schema = buildProductSchema(base)

        expect(schema.aggregateRating).toBeUndefined()
        expect(schema.review).toBeUndefined()
    })
})

describe("buildBreadcrumbSchema", () => {
    it("numera as posições a partir de 1", () => {
        const schema = buildBreadcrumbSchema([
            { name: "Catálogo", url: `${BASE_URL}/catalog` },
            { name: "Lista X", url: `${BASE_URL}/list/x` },
        ])

        expect(schema["@type"]).toBe("BreadcrumbList")
        expect(schema.itemListElement).toEqual([
            { "@type": "ListItem", position: 1, name: "Catálogo", item: `${BASE_URL}/catalog` },
            { "@type": "ListItem", position: 2, name: "Lista X", item: `${BASE_URL}/list/x` },
        ])
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- seo/schema`
Expected: FAIL — construtores inexistentes.

- [ ] **Step 3: Implementar os construtores**

Acrescentar a `lib/seo/schema.ts`:

```typescript
export interface ProductSchemaInput {
    name: string
    slug: string
    description: string | null
    price: number
    currency: string
    isActive: boolean
    locale: string
}

/**
 * `price` sai como string com 2 casas: o schema.org espera o valor em texto,
 * e Number.toFixed evita "149.9" (que alguns validadores rejeitam).
 *
 * Sem aggregateRating/review de propósito — não há avaliação real no banco,
 * e rich result inventado é penalizável além de desonesto.
 */
export function buildProductSchema(input: ProductSchemaInput): Record<string, unknown> {
    const url = `${BASE_URL}/list/${input.slug}`

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        url,
        inLanguage: input.locale,
        brand: { "@id": ORGANIZATION_ID },
        offers: {
            "@type": "Offer",
            price: Number(input.price).toFixed(2),
            priceCurrency: input.currency,
            availability: input.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
            seller: { "@id": ORGANIZATION_ID },
        },
    }
}

export function buildBreadcrumbSchema(
    trail: { name: string; url: string }[]
): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((entry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: entry.name,
            item: entry.url,
        })),
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- seo/schema`
Expected: PASS.

- [ ] **Step 5: Renderizar na página da lista**

Em `app/[locale]/list/[slug]/page.tsx`, onde a lista já é carregada do banco, renderizar os dois schemas. `price` vem como `Decimal` do Prisma — converter com `Number(list.price)`.

```tsx
<JsonLd data={buildProductSchema({
    name: list.name,
    slug: list.slug,
    description: list.description,
    price: Number(list.price),
    currency: list.currency,
    isActive: list.isActive,
    locale,
})} />
<JsonLd data={buildBreadcrumbSchema([
    { name: "Catálogo", url: `${BASE_URL}/catalog` },
    { name: list.name, url: `${BASE_URL}/list/${list.slug}` },
])} />
```

Se a página já tiver um early-return para lista inexistente (404), renderizar o schema **depois** dessa guarda, nunca com `list` possivelmente nulo.

- [ ] **Step 6: Verificar no HTML renderizado**

Com o dev server no ar e o slug de uma lista ativa real (obter um com `npx prisma studio` ou pelo catálogo):
```bash
curl -s http://localhost:3001/list/<slug> | grep -o '"@type":"Product"'
curl -s http://localhost:3001/list/<slug> | grep -o '"priceCurrency":"[A-Z]*"'
```
Expected: `Product` presente e a moeda correta da lista.

- [ ] **Step 7: tsc, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/seo/schema.ts lib/seo/schema.test.ts "app/[locale]/list/[slug]/page.tsx"
git commit -m "feat(seo): Product/Offer e BreadcrumbList nas páginas de lista"
```

---

### Task 5: `BlogPosting` schema nos posts

**Files:**
- Modify: `lib/seo/schema.ts`, `lib/seo/schema.test.ts`
- Modify: `app/[locale]/blog/[slug]/page.tsx`

**Interfaces:**
- Produces: `buildBlogPostingSchema(input: { title: string; description: string | null; slug: string; locale: string; publishedAt: Date | string; updatedAt: Date | string; imageUrl?: string | null }): Record<string, unknown>`

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar a `lib/seo/schema.test.ts`:

```typescript
import { buildBlogPostingSchema } from "./schema"

describe("buildBlogPostingSchema", () => {
    const base = {
        title: "Como escolher um importador",
        description: "Guia prático.",
        slug: "como-escolher-importador",
        locale: "pt",
        publishedAt: new Date("2026-07-01T10:00:00Z"),
        updatedAt: new Date("2026-07-10T10:00:00Z"),
    }

    it("emite datas em ISO e publisher pela organização", () => {
        const schema = buildBlogPostingSchema(base)

        expect(schema["@type"]).toBe("BlogPosting")
        expect(schema.headline).toBe(base.title)
        expect(schema.datePublished).toBe("2026-07-01T10:00:00.000Z")
        expect(schema.dateModified).toBe("2026-07-10T10:00:00.000Z")
        expect(schema.publisher).toEqual({ "@id": ORGANIZATION_ID })
    })

    it("omite image quando não há capa", () => {
        expect(buildBlogPostingSchema(base).image).toBeUndefined()
        expect(buildBlogPostingSchema({ ...base, imageUrl: "https://x/i.png" }).image)
            .toBe("https://x/i.png")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- seo/schema` → FAIL.

- [ ] **Step 3: Implementar**

```typescript
export interface BlogPostingSchemaInput {
    title: string
    description: string | null
    slug: string
    locale: string
    publishedAt: Date | string
    updatedAt: Date | string
    imageUrl?: string | null
}

/**
 * Sem `author` de pessoa física: o projeto não tem entidade de autor
 * publicada. O publisher (a organização) é o sinal honesto disponível.
 * Quando existir página de autor, acrescentar `author` apontando para ela.
 */
export function buildBlogPostingSchema(
    input: BlogPostingSchemaInput
): Record<string, unknown> {
    const toIso = (value: Date | string) =>
        value instanceof Date ? value.toISOString() : new Date(value).toISOString()

    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: input.title,
        ...(input.description ? { description: input.description } : {}),
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
        datePublished: toIso(input.publishedAt),
        dateModified: toIso(input.updatedAt),
        inLanguage: input.locale,
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: `${BASE_URL}/blog/${input.slug}`,
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa** — `npm test -- seo/schema` → PASS.

- [ ] **Step 5: Renderizar na página do post**

Em `app/[locale]/blog/[slug]/page.tsx`, após a guarda de post inexistente, renderizar `<JsonLd data={buildBlogPostingSchema({...})} />` com os campos reais do post (a tradução corrente fornece `title`/`slug`; o post fornece `publishedAt`/`updatedAt`/capa).

- [ ] **Step 6: Verificar, tsc, lint e commit**

```bash
curl -s http://localhost:3001/blog/<slug> | grep -o '"@type":"BlogPosting"'
npx tsc --noEmit && npm run lint
git add lib/seo/schema.ts lib/seo/schema.test.ts "app/[locale]/blog/[slug]/page.tsx"
git commit -m "feat(seo): BlogPosting schema nos posts do blog"
```

---

### Task 6: `noindex` nos locales roteáveis não publicados

`/ar` responde 200 com `robots: index, follow` servindo conteúdo em português (o `ar` é roteável mas não está em `PUBLISHED_LOCALES`). É uma página duplicada indexável.

**Files:**
- Create: `lib/seo/indexability.ts`
- Create (test): `lib/seo/indexability.test.ts`
- Modify: `app/[locale]/layout.tsx` (aplicar `robots` na metadata do segmento)

**Interfaces:**
- Produces:
  - `isPublishedLocale(locale: string): boolean`
  - `robotsForLocale(locale: string): { index: boolean; follow: boolean }` — `{ index: false, follow: true }` para não publicados; `{ index: true, follow: true }` para publicados.

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/seo/indexability.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { isPublishedLocale, robotsForLocale } from "./indexability"

describe("isPublishedLocale", () => {
    it("aceita os locales com tradução própria", () => {
        for (const locale of ["pt", "de", "en", "es", "fr", "it", "nl"]) {
            expect(isPublishedLocale(locale)).toBe(true)
        }
    })

    it("recusa locale roteável sem tradução e valor desconhecido", () => {
        expect(isPublishedLocale("ar")).toBe(false)
        expect(isPublishedLocale("xx")).toBe(false)
    })
})

describe("robotsForLocale", () => {
    it("bloqueia indexação de locale não publicado, mas segue os links", () => {
        expect(robotsForLocale("ar")).toEqual({ index: false, follow: true })
    })

    it("libera indexação de locale publicado", () => {
        expect(robotsForLocale("pt")).toEqual({ index: true, follow: true })
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha** — `npm test -- indexability` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

Criar `lib/seo/indexability.ts`:

```typescript
import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"

/**
 * `LOCALES` inclui locales roteáveis sem tradução própria (hoje "ar"), que
 * caem no fallback para pt. Eles respondem 200 servindo português — se forem
 * indexáveis, viram conteúdo duplicado anunciado como outro idioma.
 *
 * `follow: true` de propósito: não queremos indexar a página, mas os links
 * dela apontam para páginas legítimas que devem seguir sendo rastreadas.
 */
export function isPublishedLocale(locale: string): boolean {
    return (PUBLISHED_LOCALES as readonly string[]).includes(locale as Locale)
}

export function robotsForLocale(locale: string): { index: boolean; follow: boolean } {
    return { index: isPublishedLocale(locale), follow: true }
}
```

- [ ] **Step 4: Rodar e confirmar que passa** — `npm test -- indexability` → PASS.

- [ ] **Step 5: Aplicar no layout do segmento de locale**

Em `app/[locale]/layout.tsx`, adicionar (ou estender) um `generateMetadata` que devolva `robots: robotsForLocale(locale)`. Se o arquivo já tiver `generateMetadata`, acrescentar a chave `robots` ao objeto retornado — não criar um segundo.

```typescript
import { robotsForLocale } from "@/lib/seo/indexability"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    return { robots: robotsForLocale(locale) }
}
```

- [ ] **Step 6: Verificar no HTML renderizado**

```bash
curl -s http://localhost:3001/ar | grep -o 'name="robots" content="[^"]*"'
curl -s http://localhost:3001/ | grep -o 'name="robots" content="[^"]*"'
```
Expected: `/ar` → contém `noindex`; `/` → `index, follow`.

- [ ] **Step 7: tsc, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add lib/seo/indexability.ts lib/seo/indexability.test.ts "app/[locale]/layout.tsx"
git commit -m "fix(seo): noindex em locales roteáveis sem tradução publicada"
```

---

### Task 7: Encurtar title e description dentro dos limites de SERP

Medido no HTML renderizado: title da home **102 caracteres** (com o sufixo `| Easy Prospect` do template), description **200**. O Google corta em ~60 e ~155 — hoje a marca é a primeira coisa cortada.

**Files:**
- Modify: `messages/pt.json`, `de.json`, `en.json`, `es.json`, `fr.json`, `it.json`, `nl.json` (chaves `landing.meta.title` e `landing.meta.description`)
- Create (test): `lib/seo/meta-length.test.ts`

**Interfaces:**
- Produces: nenhum código de produção novo — apenas um teste que trava a regressão de comprimento.

**Orçamento de caracteres:** o template do layout raiz acrescenta `" | Easy Prospect"` (16 caracteres) a todo title. Logo `landing.meta.title` deve ter **no máximo 44 caracteres** para o title final caber em 60. A description deve ter no máximo **155**.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/seo/meta-length.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

const TITLE_SUFFIX = " | Easy Prospect"
const MAX_TITLE = 60
const MAX_DESCRIPTION = 155

describe("comprimento da metadata da landing", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: title cabe no limite de SERP com o sufixo da marca`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            const title = messages.landing.meta.title

            expect((title + TITLE_SUFFIX).length).toBeLessThanOrEqual(MAX_TITLE)
        })

        it(`${locale}: description cabe no limite de SERP`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            expect(messages.landing.meta.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION)
        })
    }
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- meta-length`
Expected: FAIL em vários locales (pt tem title 86 + 16 = 102 e description 200).

- [ ] **Step 3: Reescrever title e description nos 7 idiomas**

Regras de reescrita:
- Manter o termo comercial principal do idioma (importadores / distribuidores / o equivalente local) o mais à esquerda possível.
- Não repetir a marca dentro do title — o sufixo `| Easy Prospect` já a inclui.
- A description deve conter uma proposta de valor concreta e um diferencial, não adjetivos vazios.
- **Não** introduzir claims novos: nada de número de listas, de clientes, ou de cadência de atualização (ver Global Constraints).

Sugestão para `pt` (ajustar as demais na mesma linha, respeitando idiomaticidade — traduzir o sentido, não as palavras):

```json
"meta": {
  "title": "Listas de importadores e distribuidores",
  "description": "Listas de importadores e distribuidores por país, setor e perfil de compra, com empresas conferidas em fontes públicas. Para quem exporta."
}
```

`"Listas de importadores e distribuidores"` = 39 caracteres; com o sufixo, 55. A description acima tem 143.

Conferir o comprimento de cada idioma antes de passar adiante — alemão e holandês tendem a estourar; encurtar mais nesses casos.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- meta-length`
Expected: PASS nos 14 casos (7 locales × 2).

- [ ] **Step 5: Rodar a suíte completa e verificar o HTML**

```bash
npm test
curl -s http://localhost:3001/ | grep -o '<title>[^<]*</title>'
```
Expected: suíte verde; title renderizado com no máximo 60 caracteres.

- [ ] **Step 6: Commit**

```bash
git add messages/ lib/seo/meta-length.test.ts
git commit -m "fix(seo): title e description dentro do limite de exibição em SERP"
```

---

### Task 8: Página "Sobre" com metodologia dos dados

Não existe superfície de confiança (só `/terms` e `/privacy`). Isso é, ao mesmo tempo, a objeção comercial nº 1 de quem paga por lista B2B e o bloqueio de citação em GEO.

**⚠️ Esta task tem restrição de veracidade. Ler as Global Constraints antes de escrever qualquer frase.**

O que é verdade e pode ser dito:
- As listas nasceram de **pesquisa própria** e são compiladas pela operação do Easy Prospect.
- Cada empresa é **conferida em fontes públicas online** (site institucional, presença digital, registros públicos).
- O catálogo é **revisado periodicamente**.

O que **não** pode ser dito:
- Que existe equipe/analistas humanos revisando cada registro.
- Qualquer número (de listas, empresas, clientes, vendas, precisão percentual).
- **A cadência mensal, enquanto o primeiro ciclo real não tiver acontecido.** Escrever "atualizada mensalmente" antes disso repete o erro da `StatsSection`. Publicar a promessa de cadência só depois — ou declarar a data da última revisão, que é um fato verificável.
- Não é necessário nem desejável descrever ferramentas internas.

**Files:**
- Create: `app/[locale]/about/page.tsx`
- Modify: `messages/*.json` (7 arquivos, namespace `about`)
- Modify: `app/sitemap.ts` (acrescentar `/about` a `ROUTES`)
- Modify: componente de rodapé/navegação (link para "Sobre") — localizar o footer usado no funil antes de editar

**Interfaces:**
- Consumes: `alternatesFor` (hreflang), `<JsonLd>`, `buildBreadcrumbSchema`.

- [ ] **Step 1: Escrever o conteúdo em pt no `messages/pt.json`**

Criar o namespace `about` com: `meta.title`, `meta.description`, `hero.title`, `hero.subtitle`, e uma seção `methodology` com 3 blocos (origem dos dados, como a conferência é feita, como o catálogo é mantido). Respeitar as restrições acima em cada frase.

O bloco de conferência deve descrever o **critério**, não a ferramenta. Exemplo de formulação aceitável: *"Antes de entrar numa lista, cada empresa é conferida em fontes públicas — site institucional, presença digital e registros disponíveis — para confirmar que existe, que atua no setor indicado e que os canais de contato estão ativos."*

- [ ] **Step 2: Traduzir para os outros 6 idiomas**

Replicar o namespace `about` em `de`, `en`, `es`, `fr`, `it`, `nl`, traduzindo o sentido. Manter a mesma estrutura de chaves em todos (o teste da Task 7 não cobre `about`, mas chaves faltando quebram a página no locale).

- [ ] **Step 3: Criar a página**

Criar `app/[locale]/about/page.tsx` como Server Component, no molde de `app/[locale]/faq/page.tsx`: `generateMetadata` com `title`/`description` do namespace `about` e `alternates: alternatesFor("/about", locale as Locale)`; corpo renderizando as seções e um `<JsonLd data={buildBreadcrumbSchema([...])} />`.

Seguir os componentes de layout já usados nas páginas do funil (as seções da landing em `components/landing/` mostram o padrão visual).

- [ ] **Step 4: Registrar no sitemap e na navegação**

Em `app/sitemap.ts`, acrescentar ao array `ROUTES`:
```typescript
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
```
E acrescentar um link "Sobre" no rodapé do funil (localizar o componente real antes de editar).

- [ ] **Step 5: Verificar**

```bash
npx tsc --noEmit && npm run lint && npm test
curl -s http://localhost:3001/about | grep -o '<title>[^<]*</title>'
curl -s http://localhost:3001/de/about | grep -o '<title>[^<]*</title>'
curl -s http://localhost:3001/sitemap.xml | grep -c '/about'
```
Expected: página responde nos dois idiomas com títulos traduzidos; sitemap lista `/about` uma vez por locale publicado (7).

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/about" messages/ app/sitemap.ts
git commit -m "feat(seo): página Sobre com metodologia verificável dos dados"
```

---

## Self-Review — cobertura da auditoria

| Achado da auditoria | Severidade | Task |
|---|---|---|
| `og:image` ausente na home | 🔴 Alta | Task 1 |
| Zero structured data | 🔴 Alta | Tasks 2, 3, 4, 5 |
| Title 102 / description 200 chars | 🟡 Média | Task 7 |
| `/ar` indexável servindo pt | 🟡 Média | Task 6 |
| Sem superfície de confiança (E-E-A-T) | 🟡 Média | Task 8 |
| Claims sem lastro no copy | 🟡 Média | Task 8 + Global Constraints |
| **7 de 8 respostas do FAQ são placeholder, uma afirma "verificados manualmente"** (descoberto ao escrever o plano, não estava na auditoria) | 🔴 Alta | Task 3 (gate) |
| `alt=""` nas capas do blog | 🟢 Baixa | **Não coberto** — ver abaixo |
| Comentário desatualizado em `locales.ts` | 🟢 Baixa | **Não coberto** — ver abaixo |
| Conteúdo não "answer-shaped" para GEO | 🟢 Baixa | **Não coberto** — ver abaixo |

**Deliberadamente fora deste plano** (baixo impacto, melhor agrupar com trabalho de conteúdo futuro):
- `alt=""` nas capas do blog e o comentário desatualizado em `lib/i18n/locales.ts:9` — correções de uma linha, cabem em qualquer PR que toque esses arquivos.
- Reestruturar o conteúdo para formato pergunta→resposta (GEO) é trabalho de redação, não de engenharia; depende de pesquisa de demanda (`--phase survey`).

## Sequenciamento

- **Task 1** é independente e a de melhor relação esforço/impacto — fazer primeiro.
- **Task 2 é pré-requisito das Tasks 3, 4 e 5** (todas consomem `BASE_URL`, `ORGANIZATION_ID` e `<JsonLd>`).
- **Tasks 6 e 7** são independentes de todas as outras.
- **Task 8** depende da Task 2 apenas para o breadcrumb; pode ser a última.
- Ordem sugerida: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

## Modelo sugerido por tarefa

- **Haiku:** Task 1 (correção de uma linha guiada por teste), Task 6 (função pura pequena).
- **Sonnet:** Tasks 2, 4, 5 (construtores de schema + integração), Task 7 (reescrita de copy em 7 idiomas com limite objetivo verificado por teste).
- **Opus:** Tasks 3 e 8 — as duas envolvem julgamento de veracidade sobre claims comerciais (a 3 reescreve as respostas do FAQ que hoje afirmam verificação manual; a 8 escreve a metodologia). Uma frase errada em qualquer das duas cria um problema de credibilidade que schema nenhum conserta.

## Verificação pós-deploy (produção, não automatizável aqui)

Depois do deploy, conferir com dados reais:
1. **Rich Results Test** do Google nas URLs de home, `/faq` e uma `/list/<slug>`.
2. **Search Console:** submeter o sitemap e observar a aba de aprimoramentos (FAQ, Produto) por ~2 semanas.
3. Confirmar que `NEXT_PUBLIC_APP_URL` está setado na Vercel — todo canonical, hreflang e `@id` de schema depende dele.
4. Compartilhar a home no LinkedIn e no WhatsApp para confirmar visualmente o card com imagem (Task 1).
