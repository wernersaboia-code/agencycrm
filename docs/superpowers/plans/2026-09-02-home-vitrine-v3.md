# Vitrine v3 da home — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Dar hierarquia à home — ritmo visual, uma faixa com o tamanho real do catálogo lida do banco, e o material forte que hoje está enterrado no `/about` trazido para a página principal.

**Arquitetura:** Nenhum modelo novo. Uma função de leitura em cache (`getResumoCatalogo`) no molde de `lib/free-sample/amostra-ativa.ts`, invalidada pela tag no único ponto de estrangulamento que o admin já tem (`revalidateListPaths`). Três seções novas na landing, todas devolvendo `null` quando não há lastro. Texto nos 7 arquivos de `messages/`; do banco vem só número.

**Stack:** Next.js 16 (App Router, server components), Prisma, next-intl, Tailwind, vitest.

**Spec:** [`docs/superpowers/specs/2026-09-02-home-vitrine-v3-design.md`](../specs/2026-09-02-home-vitrine-v3-design.md)

## Restrições globais

- **Idiomas do funil público: 7** — `pt, en, es, fr, de, it, nl`. Toda chave nova em `messages/` entra nos sete, senão `lib/i18n/messages-integridade.test.ts` reprova.
- **Idiomas do painel admin: 3** — `pt, en, de`. Os outros quatro não têm bloco `admin` e isso é intencional; não criar.
- **`vitest.config.ts` só coleta `**/*.test.ts`** — não `.tsx`. **Não existe teste de componente React neste repositório.** Tarefas que só mexem em componente verificam pelo preview, não por teste automatizado.
- **Nenhum teste toca o banco.** Prisma é mockado com `vi.hoisted` — ver `actions/admin/free-sample.test.ts` como referência canônica.
- **IA nunca como argumento de venda** em texto voltado ao cliente.
- **Nenhum número sem base.** Todo número exibido ao visitante vem de consulta ao banco, nunca cravado em `messages/`.
- **Ninguém nomeado.** Sem depoimento com nome, cargo ou foto.
- **Nunca `git add -A`** neste repo: o Werner edita em paralelo. Sempre listar os caminhos, um a um.
- **Não usar cor crua do Tailwind** (`bg-white`, `text-gray-950`). Só tokens semânticos — ver `DESIGN.md`.
- Comentários e mensagens de commit **em português**, explicando o *porquê*, não o *o quê*.

### Fatos do ambiente (medidos — não reinvestigar)

- Node v24.18.0. Antes de qualquer `npm`/`npx`: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **`npm run lint` com exit 0 é INATINGÍVEL** (erros pré-existentes em worktrees antigos). Critério: `npx eslint <arquivos tocados>`.
- Dev server **só pelo preview** (`.claude/launch.json`, porta 3001), nunca por Bash. `npm run build` exige o dev server PARADO.
- `updateTag` (não `revalidateTag`) em Server Action — invalidação imediata. Em Route Handler, `revalidateTag(tag, { expire: 0 })`. O motivo está comentado em `actions/admin/free-sample.ts:32`.

### Regra de processo

**Comando bloqueado é PARADA e escalação, nunca tentativa por outro caminho.** Trocar de shell para driblar uma negativa anula o mecanismo que existe para consultar o Werner. Reportar BLOCKED e parar.

### Fora deste plano

- **Texto do hero** — decisão do Werner: não muda.
- **Os 19 países sem faceta** — branch `claude/elastic-poitras-3a4395`.
- **Blocos 06–09 (as quatro seções de produto)** — exigem ler os 61 PDFs para escrever as capacidades. Planejar agora obrigaria a inventar o conteúdo, que é exatamente o que este trabalho evita. Vira plano próprio depois da Task 7.

---

### Task 1: Ritmo e respiro das seções

Hoje as doze seções usam `py-14 md:py-16` e o mesmo container. Sem hierarquia, a página lê como um bloco só.

**Files:**
- Modify: `components/landing/section.tsx:30-43`

**Interfaces:**
- Consome: nada.
- Produz: `Section` ganha a prop opcional `size?: "default" | "lead"`. `"lead"` dá respiro maior a uma seção que abre um assunto. Assinatura completa: `Section({ id, tone, width, size, className, children })`.

- [ ] **Step 1: Ampliar o espaçamento e adicionar o tamanho `lead`**

Em `components/landing/section.tsx`, substituir o tipo e o corpo:

```tsx
type SectionTone = "default" | "muted"
type SectionWidth = "narrow" | "wide"
type SectionSize = "default" | "lead"

export function Section({
    id,
    tone = "default",
    width = "wide",
    size = "default",
    className,
    children,
}: {
    id?: string
    tone?: SectionTone
    width?: SectionWidth
    size?: SectionSize
    className?: string
    children: React.ReactNode
}) {
    return (
        <section
            id={id}
            className={cn(
                "border-t border-border",
                // O respiro subiu de py-14/16 para py-20/28. A home tinha doze
                // seções no mesmo espaçamento e lia como um bloco contínuo: sem
                // pausa, nada se destaca. `lead` abre assunto novo e ganha mais.
                size === "lead" ? "py-24 md:py-32" : "py-20 md:py-28",
                tone === "muted" ? "bg-muted/40" : "bg-background",
                className
            )}
        >
            <div className={cn("container mx-auto px-4", width === "narrow" && "max-w-3xl")}>
                {children}
            </div>
        </section>
    )
}
```

- [ ] **Step 2: Abrir a home no preview e conferir**

Não há teste de componente neste repo. A verificação é visual.

Subir o preview (`.claude/launch.json`, porta 3001) e abrir `http://localhost:3001/pt`. Conferir:
- As seções têm respiro visivelmente maior que antes.
- A alternância de fundo (`tone="muted"`) continua em pares, sem duas `muted` seguidas.
- Nenhuma seção encostou no rodapé nem estourou a largura.

Tirar um screenshot da home inteira para comparação.

- [ ] **Step 3: Rodar o lint nos arquivos tocados**

Run: `npx eslint components/landing/section.tsx`
Expected: exit 0, nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add components/landing/section.tsx
git commit -m "feat(landing): mais respiro entre as secoes da home"
```

---

### Task 2: A função de resumo do catálogo

**Files:**
- Create: `lib/marketplace/resumo-catalogo.ts`
- Create: `lib/marketplace/resumo-catalogo.test.ts`

**Interfaces:**
- Consome: `prisma` de `@/lib/prisma`.
- Produz:
  - `export const TAG_RESUMO_CATALOGO = "resumo-catalogo"` — string usada pela Task 3.
  - `export type ResumoCatalogo = { estudos: number; paises: number; setores: number; revisadoEm: Date | null }`
  - `export const getResumoCatalogo: () => Promise<ResumoCatalogo>` — usada pela Task 4.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/marketplace/resumo-catalogo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    leadList: { findMany: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
// `unstable_cache` envolve a função no topo do módulo; sem mock o import
// falha antes do teste rodar. Mesmo motivo comentado em
// actions/admin/free-sample.test.ts.
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))

import { getResumoCatalogo } from "./resumo-catalogo"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("getResumoCatalogo", () => {
    it("conta paises e setores DISTINTOS, nao ocorrencias", async () => {
        // Tres estudos, mas Alemanha aparece duas vezes e horeca tres.
        // O numero que vai para a home e "quantos paises distintos", nao
        // "quantas linhas de pais" — foi assim que a analise inicial errou.
        prismaMock.leadList.findMany.mockResolvedValue([
            { countries: ["DE"], industries: ["horeca"], dataReviewedAt: new Date("2026-07-01") },
            { countries: ["DE"], industries: ["horeca"], dataReviewedAt: new Date("2026-08-26") },
            { countries: ["FR"], industries: ["horeca", "fmcg"], dataReviewedAt: null },
        ])

        const resumo = await getResumoCatalogo()

        expect(resumo.estudos).toBe(3)
        expect(resumo.paises).toBe(2)
        expect(resumo.setores).toBe(2)
    })

    it("le apenas estudos ativos", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([])

        await getResumoCatalogo()

        expect(prismaMock.leadList.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            select: { countries: true, industries: true, dataReviewedAt: true },
        })
    })

    it("devolve a revisao MAIS RECENTE, ignorando as nulas", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([
            { countries: ["DE"], industries: [], dataReviewedAt: new Date("2026-07-01") },
            { countries: ["FR"], industries: [], dataReviewedAt: null },
            { countries: ["IT"], industries: [], dataReviewedAt: new Date("2026-08-26") },
        ])

        const resumo = await getResumoCatalogo()

        expect(resumo.revisadoEm).toEqual(new Date("2026-08-26"))
    })

    it("catalogo vazio devolve zeros e revisao nula, sem estourar", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([])

        const resumo = await getResumoCatalogo()

        expect(resumo).toEqual({ estudos: 0, paises: 0, setores: 0, revisadoEm: null })
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/marketplace/resumo-catalogo.test.ts`
Expected: FAIL — `Cannot find module './resumo-catalogo'`.

- [ ] **Step 3: Escrever a implementação mínima**

Criar `lib/marketplace/resumo-catalogo.ts`:

```ts
// lib/marketplace/resumo-catalogo.ts
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/** Tag revalidada sempre que o admin mexe num estudo. */
export const TAG_RESUMO_CATALOGO = "resumo-catalogo"

export type ResumoCatalogo = {
    estudos: number
    paises: number
    setores: number
    revisadoEm: Date | null
}

/**
 * O tamanho real do catálogo, para a faixa de números da home.
 *
 * Estes números NÃO podem morar em `messages/`. O catálogo cresce sem aviso —
 * entre 31/08 e 02/09/2026 ele passou de 49 para 61 estudos, e um número
 * cravado no arquivo de textos já estava mentindo. Ler do banco é o que faz a
 * faixa continuar respeitando a regra "nenhum número sem base".
 *
 * Espelha `getFilterCounts()` em `actions/marketplace.ts`, que percorre a mesma
 * consulta. A diferença é que aqui interessa a CONTAGEM DE CHAVES DISTINTAS, e
 * não o mapa de ocorrências: 61 estudos cobrem 49 países, não 61.
 *
 * `paises` também não é `COUNTRY_CODES.length`. O vocabulário de facetas conhece
 * 30 códigos e o catálogo tem 49 países — são coisas diferentes, e confundi-las
 * mostraria um número menor que a verdade.
 *
 * Em cache com tag porque isto entra na HOME, a página mais visitada, e o
 * catálogo muda algumas vezes por mês. Ao contrário da amostra grátis, aqui não
 * há caso P2021 a tolerar: `lead_lists` sempre existe. Qualquer erro é relançado
 * de propósito — a Suspense boundary da seção cai sozinha, o Sentry registra, e
 * o resto da home continua de pé.
 */
export const getResumoCatalogo = unstable_cache(
    async (): Promise<ResumoCatalogo> => {
        const estudos = await prisma.leadList.findMany({
            where: { isActive: true },
            select: { countries: true, industries: true, dataReviewedAt: true },
        })

        const paises = new Set<string>()
        const setores = new Set<string>()
        let revisadoEm: Date | null = null

        for (const estudo of estudos) {
            estudo.countries.forEach((pais) => paises.add(pais))
            estudo.industries.forEach((setor) => setores.add(setor))

            if (estudo.dataReviewedAt && (!revisadoEm || estudo.dataReviewedAt > revisadoEm)) {
                revisadoEm = estudo.dataReviewedAt
            }
        }

        return {
            estudos: estudos.length,
            paises: paises.size,
            setores: setores.size,
            revisadoEm,
        }
    },
    ["resumo-catalogo"],
    { tags: [TAG_RESUMO_CATALOGO] }
)
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/marketplace/resumo-catalogo.test.ts`
Expected: PASS — 4 testes.

- [ ] **Step 5: Lint e commit**

Run: `npx eslint lib/marketplace/resumo-catalogo.ts lib/marketplace/resumo-catalogo.test.ts`
Expected: exit 0.

```bash
git add lib/marketplace/resumo-catalogo.ts lib/marketplace/resumo-catalogo.test.ts
git commit -m "feat(landing): funcao de resumo do catalogo, lida do banco"
```

---

### Task 3: Invalidar o resumo quando o admin mexe num estudo

Sem isto a faixa da home congela no primeiro valor e volta a ser um número sem base.

**Files:**
- Modify: `actions/admin/lists.ts:4` (import) e `:91-104` (`revalidateListPaths`)
- Create: `actions/admin/lists-revalidacao.test.ts`

**Interfaces:**
- Consome: `TAG_RESUMO_CATALOGO` da Task 2.
- Produz: nada consumido por tarefa posterior.

- [ ] **Step 1: Escrever o teste que falha**

`revalidateListPaths` é privada, então o teste cobre pela porta pública `markListReviewed` — é a ação mais simples que passa por ela.

Criar `actions/admin/lists-revalidacao.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    leadList: { update: vi.fn() },
}))
const updateTagMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
    updateTag: updateTagMock,
    unstable_cache: (fn: unknown) => fn,
}))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }))

import { markListReviewed } from "./lists"
import { TAG_RESUMO_CATALOGO } from "@/lib/marketplace/resumo-catalogo"

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.leadList.update.mockResolvedValue({
        slug: "horeca-alemanha",
        name: "HoReCa & Foodservice Market - Germany",
        dataReviewedAt: new Date("2026-08-26"),
    })
})

describe("revalidacao do resumo do catalogo", () => {
    // O bug que este teste evita: a faixa de numeros da home congelar. Ela le
    // de unstable_cache com tag; sem updateTag o admin publica um estudo novo
    // e a home segue anunciando o total antigo — um numero sem base, que e
    // exatamente o que a faixa existe para nao ser.
    it("expira a tag do resumo ao registrar revisao de um estudo", async () => {
        await markListReviewed("lista-1")

        expect(updateTagMock).toHaveBeenCalledWith(TAG_RESUMO_CATALOGO)
    })

    it("continua revalidando as rotas que ja revalidava", async () => {
        await markListReviewed("lista-1")

        expect(revalidatePathMock).toHaveBeenCalledWith("/catalog")
        expect(revalidatePathMock).toHaveBeenCalledWith("/list/horeca-alemanha")
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run actions/admin/lists-revalidacao.test.ts`
Expected: FAIL no primeiro teste — `updateTagMock` não foi chamado.

- [ ] **Step 3: Adicionar a invalidação da tag**

Em `actions/admin/lists.ts`, trocar a linha 4:

```ts
import { revalidatePath, updateTag } from "next/cache"
```

E adicionar o import do módulo da Task 2, junto dos outros imports de `@/lib`:

```ts
import { TAG_RESUMO_CATALOGO } from "@/lib/marketplace/resumo-catalogo"
```

Substituir `revalidateListPaths` (linhas 91-104):

```ts
// Helper para revalidar todas as rotas relacionadas
function revalidateListPaths(listSlug?: string) {
    // Super Admin
    revalidatePath("/super-admin/marketplace")
    revalidatePath("/super-admin/marketplace/lists")

    // Catálogo público
    revalidatePath("/catalog")

    // Página específica da lista
    if (listSlug) {
        revalidatePath(`/list/${listSlug}`)
    }

    // A faixa de números da home lê de `unstable_cache` com tag. Sem esta
    // linha ela congela no primeiro valor: o admin publica o estudo 62 e a
    // home segue anunciando 61. `updateTag` (e não `revalidateTag`) porque
    // isto roda dentro de Server Action e precisa de expiração imediata —
    // motivo detalhado em actions/admin/free-sample.ts:32.
    updateTag(TAG_RESUMO_CATALOGO)
}
```

Este é o único ponto necessário: `createList`, `updateList`, `deleteList`, `markListReviewed`, `uploadLeadsToList` e `deleteMarketplaceLead` já passam todas por aqui.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run actions/admin/lists-revalidacao.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 5: Rodar a suíte inteira para conferir que nada quebrou**

Run: `npx vitest run`
Expected: todos os arquivos passando. O número de testes deve ser o da linha de base **mais os 6 novos** (4 da Task 2 + 2 desta).

- [ ] **Step 6: Lint e commit**

Run: `npx eslint actions/admin/lists.ts actions/admin/lists-revalidacao.test.ts`
Expected: exit 0.

```bash
git add actions/admin/lists.ts actions/admin/lists-revalidacao.test.ts
git commit -m "fix(landing): resumo do catalogo congelava depois da primeira leitura"
```

---

### Task 4: A faixa de números na home

**Files:**
- Create: `components/landing/catalog-stats-section.tsx`
- Modify: `messages/pt.json`, `messages/en.json`, `messages/de.json`, `messages/es.json`, `messages/fr.json`, `messages/it.json`, `messages/nl.json` (bloco `landing.stats`)
- Modify: `app/[locale]/page.tsx:70-76`

**Interfaces:**
- Consome: `getResumoCatalogo` e `ResumoCatalogo` da Task 2; `Section`/`SectionHeading` de `./section`.
- Produz: `export async function CatalogStatsSection({ locale }: { locale: LandingLocale })`.

- [ ] **Step 1: Adicionar o bloco `landing.stats` nos sete arquivos**

Inserir dentro do objeto `landing`, logo depois do bloco `intro`, em cada arquivo.

`messages/pt.json`:
```json
"stats": {
  "eyebrow": "O catálogo hoje",
  "title": "Pesquisa cuidadosa em vez de listas confusas.",
  "studies": "estudos publicados",
  "countries": "países cobertos",
  "sectors": "setores",
  "reviewed": "dados revisados"
}
```

`messages/en.json`:
```json
"stats": {
  "eyebrow": "The catalogue today",
  "title": "Careful research instead of confusing lists.",
  "studies": "published studies",
  "countries": "countries covered",
  "sectors": "sectors",
  "reviewed": "data reviewed"
}
```

`messages/de.json`:
```json
"stats": {
  "eyebrow": "Der Katalog heute",
  "title": "Sorgfältige Recherche statt unübersichtlicher Listen.",
  "studies": "veröffentlichte Studien",
  "countries": "abgedeckte Länder",
  "sectors": "Branchen",
  "reviewed": "Daten geprüft"
}
```

`messages/es.json`:
```json
"stats": {
  "eyebrow": "El catálogo hoy",
  "title": "Investigación cuidadosa en lugar de listas confusas.",
  "studies": "estudios publicados",
  "countries": "países cubiertos",
  "sectors": "sectores",
  "reviewed": "datos revisados"
}
```

`messages/fr.json`:
```json
"stats": {
  "eyebrow": "Le catalogue aujourd'hui",
  "title": "Une recherche soignée plutôt que des listes confuses.",
  "studies": "études publiées",
  "countries": "pays couverts",
  "sectors": "secteurs",
  "reviewed": "données vérifiées"
}
```

`messages/it.json`:
```json
"stats": {
  "eyebrow": "Il catalogo oggi",
  "title": "Ricerca accurata invece di elenchi confusi.",
  "studies": "studi pubblicati",
  "countries": "paesi coperti",
  "sectors": "settori",
  "reviewed": "dati verificati"
}
```

`messages/nl.json`:
```json
"stats": {
  "eyebrow": "De catalogus vandaag",
  "title": "Zorgvuldig onderzoek in plaats van onoverzichtelijke lijsten.",
  "studies": "gepubliceerde studies",
  "countries": "gedekte landen",
  "sectors": "sectoren",
  "reviewed": "gegevens gecontroleerd"
}
```

O `title` é a tradução já aprovada de "Pesquisa cuidadosa em vez de listas confusas" — é o subtítulo da seção "Nossa metodologia" em `content/about/about.<locale>.ts`. Conferir cada idioma nesse arquivo antes de colar, e usar a redação de lá quando divergir.

- [ ] **Step 2: Rodar o teste de integridade das mensagens**

Run: `npx vitest run lib/i18n/messages-integridade.test.ts`
Expected: PASS. Se reprovar, falta a chave em algum dos sete arquivos ou há namespace duplicado.

- [ ] **Step 3: Escrever a seção**

Criar `components/landing/catalog-stats-section.tsx`:

```tsx
import { getTranslations } from "next-intl/server"
import { getResumoCatalogo } from "@/lib/marketplace/resumo-catalogo"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * O tamanho real do catálogo, em quatro números.
 *
 * Substitui o que a referência (duna.com) põe neste lugar: "10.6x mais rápido",
 * "37% mais conversão". Aqueles são números de RESULTADO — promessa de efeito no
 * negócio do cliente, que este projeto não faz. Estes são números de INVENTÁRIO:
 * contáveis, verificáveis, e verdadeiros por construção porque saem do banco.
 *
 * Sem estudo ativo a seção devolve `null`, mesmo critério de `FreeSampleSection`
 * e de `visibleFacets` no catálogo: bloco sem lastro é promessa que a página não
 * cumpre.
 */
export async function CatalogStatsSection({ locale }: { locale: LandingLocale }) {
    const resumo = await getResumoCatalogo()
    if (resumo.estudos === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.stats" })

    const numeros = [
        { valor: String(resumo.estudos), rotulo: t("studies") },
        { valor: String(resumo.paises), rotulo: t("countries") },
        { valor: String(resumo.setores), rotulo: t("sectors") },
    ]

    if (resumo.revisadoEm) {
        numeros.push({
            valor: new Intl.DateTimeFormat(locale, {
                month: "short",
                year: "numeric",
            }).format(resumo.revisadoEm),
            rotulo: t("reviewed"),
        })
    }

    return (
        <Section tone="muted">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} centered />

            <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
                {numeros.map((numero) => (
                    <div key={numero.rotulo} className="bg-card p-6 text-center">
                        <dt className="sr-only">{numero.rotulo}</dt>
                        <dd>
                            <span className="block text-3xl font-bold tabular-nums text-brand-accent-strong md:text-4xl">
                                {numero.valor}
                            </span>
                            <span className="mt-2 block text-sm text-muted-foreground">
                                {numero.rotulo}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
        </Section>
    )
}
```

- [ ] **Step 4: Ligar na home**

Em `app/[locale]/page.tsx`, adicionar o import junto dos outros de `@/components/landing`:

```tsx
import { CatalogStatsSection } from "@/components/landing/catalog-stats-section"
```

E inserir a seção logo depois de `IntroSection` (entre as linhas 71-73 atuais), antes de `TargetMarketsSection`:

```tsx
            <Suspense fallback={<SectionFallback className="h-56" />}>
                <CatalogStatsSection locale={locale} />
            </Suspense>
```

A posição é deliberada: o visitante acabou de ler no `intro` o que é um estudo, e a pergunta seguinte é "quantos vocês têm?".

- [ ] **Step 5: Conferir no preview**

Subir o preview e abrir `http://localhost:3001/pt`. Conferir:
- A faixa mostra **61 estudos, 49 países, 5 setores** e a data de revisão (ago. de 2026 na data deste plano).
- Abrir `/de` e conferir que os rótulos estão em alemão e a data formatada em alemão ("Aug. 2026").
- Alternar o tema para escuro e conferir que os números continuam legíveis.

Se algum número divergir, **não ajustar o componente**: rodar a consulta no banco e descobrir por quê. O componente conta chaves distintas; divergência significa dado inesperado.

- [ ] **Step 6: Lint e commit**

Run: `npx eslint components/landing/catalog-stats-section.tsx app/[locale]/page.tsx`
Expected: exit 0.

```bash
git add components/landing/catalog-stats-section.tsx app/[locale]/page.tsx messages/pt.json messages/en.json messages/de.json messages/es.json messages/fr.json messages/it.json messages/nl.json
git commit -m "feat(landing): faixa com o tamanho real do catalogo na home"
```

---

### Task 5: Honestidade e método na home

Traz para a home dois textos que hoje só existem no fim do `/about`: os limites declarados e o checklist de verificação. São o substituto do que a referência põe nesses dois lugares — depoimento nominal e manchete de IA — e nenhum dos dois é utilizável aqui.

**Files:**
- Create: `components/landing/method-section.tsx`
- Modify: os sete `messages/*.json` (bloco `landing.method`)
- Modify: `app/[locale]/page.tsx`

**Interfaces:**
- Consome: `Section`/`SectionHeading`.
- Produz: `export async function MethodSection({ locale }: { locale: LandingLocale })`.

- [ ] **Step 1: Adicionar o bloco `landing.method` nos sete arquivos**

Inserir dentro de `landing`, depois do bloco `daten`.

`messages/pt.json`:
```json
"method": {
  "eyebrow": "Como trabalhamos",
  "checksTitle": "Como cada empresa é conferida",
  "checks": [
    "se a empresa atua no respectivo setor",
    "se existem atividades de importação ou distribuição",
    "se possui presença profissional",
    "se há dados de contato atualizados",
    "se pode ser considerada um potencial parceiro comercial"
  ],
  "limitsTitle": "O que não podemos prometer",
  "limitsBody": "O sucesso de um projeto de exportação depende de muitos fatores. Não podemos garantir resposta de todas as empresas nem o fechamento imediato de negócios. Podemos, porém, oferecer uma base sólida para seu planejamento e economizar um tempo considerável na identificação de parceiros comerciais."
}
```

**Para os outros seis idiomas, não traduzir do zero.** O texto já existe, aprovado pelo sócio, em `content/about/about.<locale>.ts`:
- `checks` → o bloco `kind: "lista"` da seção `id: "verificacao"`, os cinco itens na ordem.
- `limitsTitle` → o `heading` da seção `id: "limites"`.
- `limitsBody` → o parágrafo dessa mesma seção.
- `checksTitle` → o `heading` da seção `id: "verificacao"`.

Copiar de lá, palavra por palavra. `eyebrow` é chave nova e traduz como: en `How we work`, de `Wie wir arbeiten`, es `Cómo trabajamos`, fr `Notre méthode`, it `Come lavoriamo`, nl `Hoe wij werken`.

- [ ] **Step 2: Rodar o teste de integridade das mensagens**

Run: `npx vitest run lib/i18n/messages-integridade.test.ts`
Expected: PASS.

- [ ] **Step 3: Escrever a seção**

Criar `components/landing/method-section.tsx`:

```tsx
import { CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * O checklist de verificação e os limites declarados, lado a lado.
 *
 * Os dois textos são transcrição do documento do sócio e já viviam em
 * `content/about/about.<locale>.ts`. Aqui eles aparecem DE NOVO, em
 * `messages/`, e a duplicação é deliberada: `content/about` é transcrição
 * literal que não se reescreve, e a home precisa da versão curta. Não unificar
 * — mexer numa quebra a outra.
 *
 * O bloco de limites ocupa, de propósito, o lugar onde a referência (duna.com)
 * põe um depoimento com nome e foto de cliente. Declarar o que não se promete,
 * onde o concorrente põe elogio, é a troca mais barata desta página.
 */
export async function MethodSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.method" })
    const checks = t.raw("checks") as string[]

    return (
        <Section tone="default" size="lead">
            <SectionHeading eyebrow={t("eyebrow")} title={t("checksTitle")} centered />

            <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
                <ul className="space-y-3 rounded-lg border border-border bg-card p-6">
                    {checks.map((check) => (
                        <li key={check} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                            {check}
                        </li>
                    ))}
                </ul>

                <div className="rounded-lg border border-border bg-muted/40 p-6">
                    <h3 className="font-semibold text-foreground">{t("limitsTitle")}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("limitsBody")}</p>
                </div>
            </div>
        </Section>
    )
}
```

- [ ] **Step 4: Ligar na home**

Em `app/[locale]/page.tsx`, adicionar o import e inserir a seção **entre `DataQualitySection` e `AdvantageSection`** — depois de o visitante ler que os dados são revisados, e antes da promessa de vantagem:

```tsx
import { MethodSection } from "@/components/landing/method-section"
```

```tsx
            <Suspense fallback={<SectionFallback className="h-80" />}>
                <MethodSection locale={locale} />
            </Suspense>
```

- [ ] **Step 5: Conferir no preview**

Abrir `http://localhost:3001/pt` e `http://localhost:3001/de`. Conferir:
- Os cinco itens do checklist aparecem, no idioma certo.
- O bloco de limites está ao lado (desktop) e embaixo (mobile, largura 375).
- Nenhum texto vazou de `content/about` para a home com marcação estranha.

- [ ] **Step 6: Lint e commit**

Run: `npx eslint components/landing/method-section.tsx app/[locale]/page.tsx`
Expected: exit 0.

```bash
git add components/landing/method-section.tsx app/[locale]/page.tsx messages/pt.json messages/en.json messages/de.json messages/es.json messages/fr.json messages/it.json messages/nl.json
git commit -m "feat(landing): verificacao e limites declarados saem do /about para a home"
```

---

### Task 6: Rodapé com setores e mercados

**Files:**
- Modify: `components/marketplace/marketplace-footer.tsx`
- Modify: os sete `messages/*.json` (chaves novas em `footer`)

**Interfaces:**
- Consome: `INDUSTRY_IDS` de `@/lib/constants/catalog-facets`; rótulos de `catalog.industries.*`, que já existem nos sete idiomas.
- Produz: nada consumido depois.

- [ ] **Step 1: Adicionar os títulos de coluna nos sete arquivos**

Dentro do bloco `footer` existente. Só dois títulos novos — os rótulos de setor já existem em `catalog.industries.*` e são reaproveitados.

`pt`: `"sectorsTitle": "Setores"`, `"marketsTitle": "Mercados"`
`en`: `"sectorsTitle": "Sectors"`, `"marketsTitle": "Markets"`
`de`: `"sectorsTitle": "Branchen"`, `"marketsTitle": "Märkte"`
`es`: `"sectorsTitle": "Sectores"`, `"marketsTitle": "Mercados"`
`fr`: `"sectorsTitle": "Secteurs"`, `"marketsTitle": "Marchés"`
`it`: `"sectorsTitle": "Settori"`, `"marketsTitle": "Mercati"`
`nl`: `"sectorsTitle": "Sectoren"`, `"marketsTitle": "Markten"`

- [ ] **Step 2: Rodar o teste de integridade das mensagens**

Run: `npx vitest run lib/i18n/messages-integridade.test.ts`
Expected: PASS.

- [ ] **Step 3: Adicionar as duas colunas no rodapé**

Dentro do grid de colunas existente, acrescentar:

```tsx
<div>
    <h3 className="text-sm font-semibold text-foreground">{t("sectorsTitle")}</h3>
    <ul className="mt-3 space-y-2">
        {INDUSTRY_IDS.map((id) => (
            <li key={id}>
                <Link
                    href={`/catalog?industries=${id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    {tCatalog(`industries.${id}`)}
                </Link>
            </li>
        ))}
    </ul>
</div>
```

Usar `INDUSTRY_IDS` e não uma lista escrita à mão: setor novo no vocabulário entra no rodapé sozinho, e setor que sair não deixa link morto.

A coluna de mercados usa as regiões linguísticas que já estão em `landing.zielmaerkte.regions` — as mesmas cinco, cada uma apontando para `/catalog` com os países daquela região.

- [ ] **Step 4: Conferir no preview**

Abrir a home e rolar até o rodapé. Conferir:
- As cinco entradas de setor aparecem e cada link leva ao catálogo já filtrado.
- Em `/de` os rótulos estão em alemão.
- Em 375px de largura as colunas empilham sem estourar.

- [ ] **Step 5: Lint e commit**

Run: `npx eslint components/marketplace/marketplace-footer.tsx`
Expected: exit 0.

```bash
git add components/marketplace/marketplace-footer.tsx messages/pt.json messages/en.json messages/de.json messages/es.json messages/fr.json messages/it.json messages/nl.json
git commit -m "feat(landing): rodape ganha colunas de setor e de mercado"
```

---

### Task 7: Tempo de leitura no card do blog

A categoria **já está implementada** — `blog-teaser-section.tsx` renderiza `post.categoryName`. Falta só o tempo de leitura.

**Files:**
- Create: `lib/blog/tempo-leitura.ts`
- Create: `lib/blog/tempo-leitura.test.ts`
- Modify: `lib/blog/queries.ts:103-121` (`getLatestPostsForTeaser`)
- Modify: `components/landing/blog-teaser-section.tsx`
- Modify: os sete `messages/*.json` (chave `landing.blog.readingTime`)

**Interfaces:**
- Consome: nada.
- Produz: `export function minutosDeLeitura(texto: string): number`. `getLatestPostsForTeaser` passa a devolver o campo `minutosLeitura: number` em cada item.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/blog/tempo-leitura.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { minutosDeLeitura } from "./tempo-leitura"

describe("minutosDeLeitura", () => {
    it("arredonda para cima e nunca devolve zero", () => {
        // Um post de dez palavras leva segundos, mas "0 min" nao e uma
        // informacao util para o leitor — o piso e 1.
        expect(minutosDeLeitura("uma duas tres quatro cinco seis sete oito nove dez")).toBe(1)
    })

    it("usa 200 palavras por minuto", () => {
        const texto = Array.from({ length: 400 }, () => "palavra").join(" ")
        expect(minutosDeLeitura(texto)).toBe(2)
    })

    it("ignora marcacao HTML na contagem", () => {
        // `contentHtml` vem com marcacao; contar as tags inflaria o numero.
        const texto = `<p>${Array.from({ length: 200 }, () => "palavra").join(" ")}</p>`
        expect(minutosDeLeitura(texto)).toBe(1)
    })

    it("texto vazio devolve 1, nao zero nem NaN", () => {
        expect(minutosDeLeitura("")).toBe(1)
        expect(minutosDeLeitura("   ")).toBe(1)
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/blog/tempo-leitura.test.ts`
Expected: FAIL — `Cannot find module './tempo-leitura'`.

- [ ] **Step 3: Escrever a implementação**

Criar `lib/blog/tempo-leitura.ts`:

```ts
// lib/blog/tempo-leitura.ts

/** Palavras por minuto. 200 é a média de leitura silenciosa em prosa. */
const PALAVRAS_POR_MINUTO = 200

/**
 * Minutos de leitura de um post, para o card do blog.
 *
 * Piso de 1: "0 min" não informa nada, e um post curtíssimo ainda custa a
 * atenção de abrir. A marcação de `contentHtml` sai antes da contagem, senão
 * as tags inflariam o número num corpo de post normal.
 */
export function minutosDeLeitura(texto: string): number {
    const limpo = texto.replace(/<[^>]*>/g, " ").trim()
    if (!limpo) return 1

    const palavras = limpo.split(/\s+/).length
    return Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO))
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/blog/tempo-leitura.test.ts`
Expected: PASS — 4 testes.

- [ ] **Step 5: Devolver o tempo na consulta do teaser**

`getLatestPostsForTeaser` já faz `include: { translations: { where: { locale } } }`, e `contentHtml` vem junto — nenhuma consulta nova é necessária.

O cálculo fica aqui, e não no componente, para `contentHtml` (uma coluna `@db.Text`) não atravessar a fronteira: o card precisa do número, não do corpo do post.

Em `lib/blog/queries.ts`, adicionar o import no topo:

```ts
import { minutosDeLeitura } from "./tempo-leitura"
```

E acrescentar o campo no `map` de `getLatestPostsForTeaser`:

```ts
    return rows.map((p) => ({
        postId: p.id,
        slug: p.translations[0]?.slug ?? "",
        title: p.translations[0]?.title ?? "",
        excerpt: p.translations[0]?.excerpt ?? "",
        coverImageUrl: p.coverImageUrl,
        categoryName: p.category?.translations[0]?.name ?? null,
        minutosLeitura: minutosDeLeitura(p.translations[0]?.contentHtml ?? ""),
    }))
```

- [ ] **Step 6: Adicionar a chave nos sete arquivos**

Dentro do bloco `landing.blog`:

`pt`: `"readingTime": "{minutes} min de leitura"`
`en`: `"readingTime": "{minutes} min read"`
`de`: `"readingTime": "{minutes} Min. Lesezeit"`
`es`: `"readingTime": "{minutes} min de lectura"`
`fr`: `"readingTime": "{minutes} min de lecture"`
`it`: `"readingTime": "{minutes} min di lettura"`
`nl`: `"readingTime": "{minutes} min lezen"`

Run: `npx vitest run lib/i18n/messages-integridade.test.ts`
Expected: PASS.

- [ ] **Step 7: Mostrar categoria e tempo na mesma linha**

Em `components/landing/blog-teaser-section.tsx`, a categoria hoje é renderizada sozinha:

```tsx
{post.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">{post.categoryName}</p>}
```

Substituir por uma linha que junta os dois, no molde da referência (`Product · 7 min`):

```tsx
<p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">
    {post.categoryName ? `${post.categoryName} · ` : ""}
    {t("readingTime", { minutes: post.minutosLeitura })}
</p>
```

O tempo aparece mesmo sem categoria — post sem categoria continua informando quanto custa ler.

- [ ] **Step 8: Conferir no preview e rodar a suíte**

Abrir `http://localhost:3001/pt` e conferir que cada card do blog mostra "Categoria · N min de leitura". Abrir `/de` e conferir "Kategorie · N Min. Lesezeit".

Run: `npx vitest run`
Expected: tudo passando.

- [ ] **Step 9: Lint e commit**

Run: `npx eslint lib/blog/tempo-leitura.ts lib/blog/tempo-leitura.test.ts lib/blog/queries.ts components/landing/blog-teaser-section.tsx`
Expected: exit 0.

```bash
git add lib/blog/tempo-leitura.ts lib/blog/tempo-leitura.test.ts lib/blog/queries.ts components/landing/blog-teaser-section.tsx messages/pt.json messages/en.json messages/de.json messages/es.json messages/fr.json messages/it.json messages/nl.json
git commit -m "feat(landing): tempo de leitura no card do blog"
```

---

## Depois deste plano

**Blocos 06–09 — as quatro seções de produto.** Panorama do mercado, canais de distribuição, perfis de importadores e como abordar. É a parte que mais muda a página, e a única que não dá para planejar aqui: as capacidades de cada bloco têm que sair do conteúdo real dos estudos, e os campos do banco que descreveriam isso (`productPortfolio`, `sourcing`, `salesPointsCount`) estão vazios nos 61 estudos ativos. Exige abrir os PDFs. Vira plano próprio.

**Conferir com o Werner:** há 5 estudos com `isFeatured` e `getFeaturedLists(4)` mostra 4. Um nunca aparece na home. O limite de 4 é deliberado; a dúvida é se ele sabe que marcou 5.
