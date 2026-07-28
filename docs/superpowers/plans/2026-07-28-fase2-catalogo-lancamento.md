# Fase 2 — Catálogo pronto para o lançamento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o catálogo apresentável para o lançamento de 01.08.2026 — vocabulário de setores com HORECA e FMCG, rótulos sempre traduzidos, filtro por idioma da lista, painel de filtros rolável e a página Quem Somos ligada ao menu com texto revisado.

**Architecture:** Todas as mudanças de vocabulário passam por `lib/constants/catalog-facets.ts` e `lib/constants/list-languages.ts`, que já são fonte única para o formulário do admin e o filtro público. O filtro de idioma segue exatamente o formato dos filtros existentes (query param separado por vírgula → `getFilterCounts` → `CatalogSidebar`). Nenhuma mudança de schema Prisma: o campo `LeadList.language` já existe e está preenchido.

**Tech Stack:** Next.js 16 (App Router), next-intl, Prisma + Supabase (Postgres), Vitest, Tailwind v4.

## Global Constraints

- **Prazo:** lançamento em 01.08.2026. Nada neste plano pode exigir migração de schema Prisma.
- **Sete idiomas publicados**, nesta ordem: `pt` (padrão), `de`, `en`, `es`, `fr`, `it`, `nl` — valor de `PUBLISHED_LOCALES` em `lib/i18n/locales.ts`. Chave nova em `messages/pt.json` exige a mesma chave nos outros seis.
- **Id de faceta nunca aparece na tela.** Quem renderiza faceta traduz.
- **`foodservice` não entra** no vocabulário. Decisão registrada no spec.
- **Ninguém é nomeado** no texto do Quem Somos nesta fase.
- Comentários e mensagens de commit em português, seguindo o repositório.
- Comentário no código explica **por que**, não o que. Só onde a razão não é óbvia.

**Spec:** `docs/superpowers/specs/2026-07-28-fase2-catalogo-lancamento-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `lib/constants/catalog-facets.ts` | Vocabulário de categorias/setores/países + regras de visibilidade de faceta | 1, 4 |
| `lib/constants/catalog-facets.test.ts` | Testes do vocabulário e das regras | 1, 4 |
| `lib/i18n/facetas-rotuladas.test.ts` | **Novo.** Garante que todo id de faceta tem rótulo em `messages/pt.json` | 1 |
| `messages/*.json` | Rótulos e textos, sete idiomas | 1, 3, 6, 7, 8 |
| `lib/constants/list-languages.ts` | Vocabulário de idiomas de lista | 3 |
| `actions/marketplace.ts` | Consulta e contagem de facetas | 3 |
| `app/[locale]/catalog/page.tsx` | Leitura dos filtros da URL | 3 |
| `components/marketplace/catalog-sidebar.tsx` | Renderização dos filtros | 3, 4 |
| `components/marketplace/list-card.tsx` | Card do catálogo | 2, 5 |
| `app/[locale]/list/[slug]/page.tsx` | Página de detalhe | 2 |
| `components/marketplace/catalog-filters-panel.tsx` | Coluna/gaveta dos filtros | 5 |
| `components/marketplace/marketplace-header.tsx` | Menu | 6 |

---

### Task 1: Vocabulário HORECA/FMCG e a rede de segurança dos rótulos

Duas coisas juntas de propósito: o teste de paridade faceta↔rótulo precisa existir **antes** de o vocabulário mudar, senão a própria mudança pode introduzir o defeito que ele previne.

O teste existente `lib/i18n/messages-integridade.test.ts` compara cada locale contra `pt`. Isso pega tradução faltando, mas **não** pega rótulo faltando em `pt` — e é exatamente assim que o id `food` chegou cru na tela.

**Files:**
- Create: `lib/i18n/facetas-rotuladas.test.ts`
- Modify: `lib/constants/catalog-facets.ts`
- Modify: `messages/pt.json`, `messages/de.json`, `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/it.json`, `messages/nl.json`
- Test: `lib/constants/catalog-facets.test.ts` (deve continuar passando)

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: `INDUSTRY_IDS` com `fmcg_food`, `fmcg_nonfood`, `horeca` e sem `food`

- [ ] **Step 1: Aplicar a migração de dados em produção, antes do código**

As 20 listas do catálogo têm `food` em `industries`. A migração roda **primeiro**: assim nenhuma lista fica apontando para um id que o vocabulário não conhece. Na ordem inversa, as 20 listas ficariam sem setor visível durante o intervalo.

Executar no Supabase (projeto `rkctbnigtdahdkenddui`):

```sql
update lead_lists
set industries = array_replace(industries, 'food', 'fmcg_food')
where 'food' = any(industries);
```

Conferir o resultado:

```sql
select i as industria, count(*) from lead_lists, unnest(industries) i group by 1 order by 2 desc;
```

Expected: `fmcg_food` com 20, `retail` com 3, e **nenhuma linha `food`**.

- [ ] **Step 2: Escrever o teste de paridade faceta↔rótulo, que deve falhar**

Criar `lib/i18n/facetas-rotuladas.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { CATEGORY_IDS, COUNTRY_CODES, INDUSTRY_IDS } from "@/lib/constants/catalog-facets"

const pt = JSON.parse(
    readFileSync(join(__dirname, "..", "..", "messages", "pt.json"), "utf8")
) as { catalog: Record<string, Record<string, string>> }

/**
 * `messages-integridade.test.ts` compara cada idioma contra o pt, então uma
 * tradução faltando é reprovada. O que ele NÃO pega é o rótulo faltando no
 * próprio pt — e é assim que um id vaza cru para a tela, que foi o defeito do
 * "food" aparecendo no card em vez de "Alimentos & Bebidas".
 */
describe("todo id de faceta tem rótulo em pt", () => {
    const grupos: Array<[string, readonly string[]]> = [
        ["categories", CATEGORY_IDS],
        ["industries", INDUSTRY_IDS],
        ["countries", COUNTRY_CODES],
    ]

    for (const [grupo, ids] of grupos) {
        it(`catalog.${grupo} cobre todos os ids`, () => {
            const rotulos = pt.catalog[grupo] ?? {}
            const semRotulo = ids.filter((id) => typeof rotulos[id] !== "string")

            expect(semRotulo).toEqual([])
        })

        it(`catalog.${grupo} não tem rótulo órfão`, () => {
            const rotulos = Object.keys(pt.catalog[grupo] ?? {})
            const orfaos = rotulos.filter((chave) => !(ids as readonly string[]).includes(chave))

            expect(orfaos).toEqual([])
        })
    }
})
```

- [ ] **Step 3: Rodar o teste para confirmar que passa com o vocabulário atual**

Run: `npx vitest run lib/i18n/facetas-rotuladas.test.ts`
Expected: PASS — 6 testes. O vocabulário de hoje já está coerente; o teste é a rede que segura o Step 4.

- [ ] **Step 4: Trocar o vocabulário de setores**

Em `lib/constants/catalog-facets.ts`, substituir o array `INDUSTRY_IDS` (linhas 27–40) por:

```ts
export const INDUSTRY_IDS = [
    "fmcg_food",
    "fmcg_nonfood",
    "horeca",
    "tech",
    "fashion",
    "automotive",
    "health",
    "construction",
    "retail",
    "industrial",
    "agriculture",
    "electronics",
    "chemicals",
    "machinery",
] as const
```

`food` sai: "Alimentos & Bebidas" e "FMCG — Bens de Consumo Alimentares" significam praticamente a mesma coisa, e manter os dois põe duas caixas equivalentes no filtro.

Acrescentar ao comentário do topo do arquivo, logo abaixo do parágrafo que já explica os rótulos:

```ts
 * `foodservice` foi avaliado e deixado de fora: no comércio internacional ele
 * se sobrepõe demais a HORECA, e faceta que o cliente não sabe escolher é pior
 * que faceta a menos. Revisar quando o catálogo tiver volume que justifique.
```

- [ ] **Step 5: Rodar o teste para confirmar que agora falha**

Run: `npx vitest run lib/i18n/facetas-rotuladas.test.ts`
Expected: FAIL — `catalog.industries cobre todos os ids` acusa `["fmcg_food", "fmcg_nonfood", "horeca"]`, e `não tem rótulo órfão` acusa `["food"]`.

- [ ] **Step 6: Escrever os rótulos nos sete idiomas**

Em cada `messages/<locale>.json`, dentro de `catalog.industries`, **remover** a chave `food` e **acrescentar** as três novas. A sigla FMCG é preservada em todos os idiomas; só o qualificador é traduzido.

`messages/pt.json`:
```json
"fmcg_food": "FMCG — Bens de Consumo Alimentares",
"fmcg_nonfood": "FMCG — Bens de Consumo Não-Alimentares",
"horeca": "HORECA — Hotelaria, Restauração e Catering",
```

`messages/de.json`:
```json
"fmcg_food": "FMCG — Konsumgüter Food",
"fmcg_nonfood": "FMCG — Konsumgüter Non-Food",
"horeca": "HORECA — Hotellerie, Gastronomie, Catering",
```

`messages/en.json`:
```json
"fmcg_food": "FMCG — Food & Beverage",
"fmcg_nonfood": "FMCG — Non-Food",
"horeca": "HORECA — Hotels, Restaurants & Catering",
```

`messages/es.json`:
```json
"fmcg_food": "FMCG — Bienes de Consumo Alimentarios",
"fmcg_nonfood": "FMCG — Bienes de Consumo No Alimentarios",
"horeca": "HORECA — Hostelería, Restauración y Catering",
```

`messages/fr.json`:
```json
"fmcg_food": "FMCG — Produits de Grande Consommation Alimentaires",
"fmcg_nonfood": "FMCG — Produits de Grande Consommation Non Alimentaires",
"horeca": "CHR — Cafés, Hôtels, Restaurants et Traiteurs",
```

`messages/it.json`:
```json
"fmcg_food": "FMCG — Beni di Largo Consumo Alimentari",
"fmcg_nonfood": "FMCG — Beni di Largo Consumo Non Alimentari",
"horeca": "HORECA — Hotellerie, Ristorazione e Catering",
```

`messages/nl.json`:
```json
"fmcg_food": "FMCG — Food",
"fmcg_nonfood": "FMCG — Non-food",
"horeca": "HORECA — Hotels, Restaurants en Catering",
```

- [ ] **Step 7: Rodar os testes de mensagens e do vocabulário**

Run: `npx vitest run lib/i18n/facetas-rotuladas.test.ts lib/i18n/messages-integridade.test.ts lib/constants/catalog-facets.test.ts`
Expected: PASS em todos. Se `messages-integridade` acusar chave faltando, um dos seis idiomas ficou sem uma das três chaves novas.

- [ ] **Step 8: Confirmar que o id antigo sumiu do código**

Run: `grep -rn '"food"' lib components app actions messages --include=*.ts --include=*.tsx --include=*.json`
Expected: nenhuma saída.

- [ ] **Step 9: Typecheck e commit**

Run: `npx tsc --noEmit`
Expected: exit 0

```bash
git add lib/constants/catalog-facets.ts lib/i18n/facetas-rotuladas.test.ts messages/
git commit -m "feat(catalog): HORECA e FMCG substituem o setor generico de alimentos"
```

---

### Task 2: Rótulo traduzido no card e na página de detalhe

O defeito que fez o usuário ver "food" na tela. O filtro traduz; o card e o detalhe imprimem o id cru do banco.

**Files:**
- Modify: `components/marketplace/list-card.tsx:125-138`
- Modify: `app/[locale]/list/[slug]/page.tsx:194`
- Test: verificação manual no dev server (componentes de apresentação, sem lógica própria)

**Interfaces:**
- Consumes: `INDUSTRY_IDS` da Task 1; chaves `catalog.industries.*` e `catalog.categories.*` de `messages/`
- Produces: nenhum export novo

- [ ] **Step 1: Traduzir os setores no card**

Em `components/marketplace/list-card.tsx`, o hook `useTranslations("catalog")` já está em escopo como `t` (linha 46). Substituir o bloco de setores (linhas 125–138) por:

```tsx
                    {/* Setores */}
                    {list.industries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {list.industries.slice(0, 3).map((industry) => (
                                <Badge key={industry} variant="secondary" className="text-xs">
                                    {t(`industries.${industry}`)}
                                </Badge>
                            ))}
                            {list.industries.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{list.industries.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
```

- [ ] **Step 2: Traduzir os setores na página de detalhe**

Em `app/[locale]/list/[slug]/page.tsx`, a linha 194 é:

```tsx
                            <DataItem label={t("fieldIndustries")} value={list.industries.join(", ")} icon={Target} fallback={t("notInformed")} />
```

Substituir por:

```tsx
                            <DataItem
                                label={t("fieldIndustries")}
                                value={list.industries.map((id) => t(`industries.${id}`)).join(", ")}
                                icon={Target}
                                fallback={t("notInformed")}
                            />
```

- [ ] **Step 3: Subir o dev server e conferir as duas telas**

```bash
npm run dev
```

Abrir `http://localhost:3001/catalog` e `http://localhost:3001/de/catalog`.

Expected: os cards mostram "FMCG — Bens de Consumo Alimentares" em `/catalog` e "FMCG — Konsumgüter Food" em `/de/catalog`. Nenhum card mostra `fmcg_food`.

Abrir a página de detalhe de qualquer lista (link "Ver detalhes" de um card).

Expected: o campo de setores mostra o rótulo traduzido, não o id.

- [ ] **Step 4: Commit**

```bash
git add components/marketplace/list-card.tsx "app/[locale]/list/[slug]/page.tsx"
git commit -m "fix(catalog): card e pagina de detalhe traduzem o setor em vez de imprimir o id"
```

---

### Task 3: Filtro por idioma da lista

Com 17 das 20 listas em inglês, nada hoje informa ao visitante que existem listas em português. Este é o filtro de maior valor imediato.

Os rótulos são os **nomes nativos** já presentes em `LIST_LANGUAGES` (`Português`, `English`, `Deutsch`…). Nome de idioma se escreve na própria língua — não há tradução a fazer, e isso evita 7×7 chaves novas.

**Files:**
- Modify: `lib/constants/list-languages.ts`
- Modify: `lib/constants/list-languages.test.ts`
- Modify: `actions/marketplace.ts`
- Modify: `app/[locale]/catalog/page.tsx`
- Modify: `components/marketplace/catalog-sidebar.tsx`
- Modify: `messages/*.json` (uma chave: o título da seção)

**Interfaces:**
- Consumes: `visibleFacets` de `lib/constants/catalog-facets.ts`
- Produces: `LIST_LANGUAGE_CODES: readonly ListLanguageCode[]`; `getFilterCounts()` passa a devolver `languageCounts: Record<string, number>`; `getMarketplaceLists` aceita `languages?: string[]`; `CatalogSidebar` aceita `selectedLanguages: string[]` e `languageCounts: Record<string, number>`

- [ ] **Step 1: Escrever o teste que falha**

Em `lib/constants/list-languages.test.ts`, acrescentar ao final do arquivo:

```ts
describe("LIST_LANGUAGE_CODES", () => {
    it("expõe os códigos na mesma ordem de LIST_LANGUAGES", () => {
        expect(LIST_LANGUAGE_CODES).toEqual(LIST_LANGUAGES.map((l) => l.code))
    })

    it("serve de vocabulário para visibleFacets", () => {
        // Só idioma com lista publicada entra no filtro, igual às outras facetas.
        expect(visibleFacets(LIST_LANGUAGE_CODES, { pt: 2, en: 17 }, [])).toEqual(["pt", "en"])
    })
})
```

Ajustar os imports do topo do arquivo para incluir `LIST_LANGUAGE_CODES` e `visibleFacets`:

```ts
import { visibleFacets } from "@/lib/constants/catalog-facets"
import { LIST_LANGUAGES, LIST_LANGUAGE_CODES, getListLanguage } from "./list-languages"
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run lib/constants/list-languages.test.ts`
Expected: FAIL — `LIST_LANGUAGE_CODES` não é exportado.

- [ ] **Step 3: Exportar os códigos**

Em `lib/constants/list-languages.ts`, acrescentar após a declaração de `LIST_LANGUAGES`:

```ts
// Vocabulário para o filtro do catálogo, no mesmo formato dos ids de faceta.
export const LIST_LANGUAGE_CODES: readonly ListLanguageCode[] = LIST_LANGUAGES.map(
    (l) => l.code
)
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run: `npx vitest run lib/constants/list-languages.test.ts`
Expected: PASS

- [ ] **Step 5: Contar e filtrar por idioma no servidor**

Em `actions/marketplace.ts`:

Na interface `GetListsParams` (linha 7), acrescentar após `industries`:

```ts
    languages?: string[]
```

Na desestruturação de `getMarketplaceLists` (linha 17), acrescentar após `industries = []`:

```ts
        languages = [],
```

Após o bloco `if (industries.length > 0) { ... }` (linhas 41–45), acrescentar:

```ts
    // `language` é coluna escalar, não array: casa por inclusão, não por hasSome.
    if (languages.length > 0) {
        where.language = { in: languages }
    }
```

Em `getFilterCounts`, acrescentar `language: true` ao `select` (após `category: true`), declarar o acumulador junto dos outros:

```ts
    const languageCounts: Record<string, number> = {}
```

acrescentar a contagem dentro do `forEach`, junto do bloco de `category`:

```ts
        if (list.language) {
            languageCounts[list.language] = (languageCounts[list.language] || 0) + 1
        }
```

e incluir no retorno:

```ts
    return { countryCounts, industryCounts, categoryCounts, languageCounts }
```

- [ ] **Step 6: Ler o filtro da URL na página do catálogo**

Em `app/[locale]/catalog/page.tsx`:

No tipo `CatalogSearchParams` (linha 35), acrescentar após `industries?: string`:

```ts
    languages?: string
```

Em `buildPageHref` (linha 47), acrescentar após a linha de `industries`:

```ts
    if (params.languages) nextParams.set("languages", params.languages)
```

No corpo de `CatalogPage`, após a linha de `industries` (linha 64):

```ts
    const languages = params.languages?.split(",").filter(Boolean) || []
```

Passar `languages` para `getCatalogData` (acrescentar ao objeto da chamada na linha 70 e ao tipo do parâmetro de `getCatalogData` na linha 238):

```ts
    languages: string[]
```

Incluir no `activeFilterCount` (linha 78):

```ts
    const activeFilterCount =
        countries.length + industries.length + languages.length + (category ? 1 : 0) + (search ? 1 : 0)
```

Acrescentar `languageCounts: {}` ao `filterCounts` do bloco `catch` de `getCatalogData` (linha 262), para o fallback de falha continuar com o mesmo formato do sucesso.

Passar as duas props novas ao `CatalogFiltersPanel` (linha 131):

```tsx
                        selectedLanguages={languages}
                        languageCounts={filterCounts.languageCounts}
```

- [ ] **Step 7: Renderizar a seção no sidebar**

Em `components/marketplace/catalog-sidebar.tsx`:

Acrescentar ao import de constantes:

```ts
import { LIST_LANGUAGES, LIST_LANGUAGE_CODES } from "@/lib/constants/list-languages"
```

Na interface `CatalogSidebarProps`, acrescentar:

```ts
    selectedLanguages: string[]
    languageCounts: Record<string, number>
```

Na desestruturação do componente, acrescentar `selectedLanguages,` e `languageCounts,`.

Acrescentar o estado de abertura junto dos outros (linha 66):

```ts
    const [languagesOpen, setLanguagesOpen] = useState(true)
```

Acrescentar o toggle junto de `toggleIndustry`:

```ts
    const toggleLanguage = (code: string) => {
        const newLanguages = selectedLanguages.includes(code)
            ? selectedLanguages.filter((l) => l !== code)
            : [...selectedLanguages, code]
        updateFilters("languages", newLanguages)
    }
```

Incluir no `hasActiveFilters`:

```ts
    const hasActiveFilters =
        selectedCountries.length > 0 ||
        selectedIndustries.length > 0 ||
        selectedLanguages.length > 0 ||
        Boolean(selectedCategory)
```

Calcular as facetas visíveis junto das outras:

```ts
    const idiomas = visibleFacets(LIST_LANGUAGE_CODES, languageCounts, selectedLanguages)
```

Acrescentar a seção **depois** da de setores e **antes** do botão de limpar filtros:

```tsx
            {setores.length > 0 && idiomas.length > 0 && <hr className="border-border" />}

            {/* Filtro de Idioma da lista */}
            {idiomas.length > 0 && (
            <div>
                <button
                    type="button"
                    onClick={() => setLanguagesOpen(!languagesOpen)}
                    aria-expanded={languagesOpen}
                    aria-controls={`${panelId}-languages`}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    <span>{t("filterLanguages")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${languagesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-languages`} hidden={!languagesOpen}>
                    <div className="space-y-2">
                        {idiomas.map((code) => {
                            const count = languageCounts[code] || 0
                            const isDisabled = count === 0
                            const isChecked = selectedLanguages.includes(code)
                            // Nome do idioma na própria língua: "Deutsch", não
                            // "Alemão". Endônimo é o padrão em seletor de idioma
                            // e dispensa 7x7 traduções.
                            const name = LIST_LANGUAGES.find((l) => l.code === code)?.label ?? code

                            return (
                                <label
                                    key={code}
                                    className={`group flex items-center gap-3 ${
                                        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => toggleLanguage(code)}
                                        disabled={isDisabled}
                                    />
                                    <FilterCheckbox checked={isChecked} disabled={isDisabled} />
                                    <span className="flex-1 text-sm text-muted-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}
```

- [ ] **Step 8: Acrescentar o título da seção nos sete idiomas**

Em cada `messages/<locale>.json`, dentro de `catalog`, junto de `filterIndustries`:

- `pt`: `"filterLanguages": "Idioma da lista",`
- `de`: `"filterLanguages": "Sprache der Liste",`
- `en`: `"filterLanguages": "List language",`
- `es`: `"filterLanguages": "Idioma de la lista",`
- `fr`: `"filterLanguages": "Langue de la liste",`
- `it`: `"filterLanguages": "Lingua dell'elenco",`
- `nl`: `"filterLanguages": "Taal van de lijst",`

- [ ] **Step 9: Typecheck, testes e verificação no navegador**

Run: `npx tsc --noEmit && npx vitest run`
Expected: exit 0; todos os testes passando

```bash
npm run dev
```

Abrir `http://localhost:3001/catalog`.

Expected: a seção "Idioma da lista" aparece com três opções — `English (17)`, `Português (2)`, `Español (1)`. Os idiomas sem lista (Deutsch, Français, Italiano, Nederlands) **não** aparecem.

Marcar "Português".

Expected: a URL vira `/catalog?languages=pt`, o catálogo mostra 2 listas, e o contador de filtros ativos sobe para 1.

- [ ] **Step 10: Commit**

```bash
git add lib/constants/list-languages.ts lib/constants/list-languages.test.ts actions/marketplace.ts "app/[locale]/catalog/page.tsx" components/marketplace/catalog-sidebar.tsx messages/
git commit -m "feat(catalog): filtro por idioma da lista"
```

---

### Task 4: Esconder seção de filtro sem escolha real

Todas as 20 listas são `importers`, então a seção de categoria mostra **uma** caixa. Um filtro com uma opção não filtra nada: ocupa espaço e sugere que falta catálogo.

A regra vale para qualquer seção. A exceção é obrigatória: se houver filtro ativo naquela seção, ela continua visível mesmo com uma faceta só — senão um filtro vindo de link antigo ficaria aplicado sem aparecer em lugar nenhum para ser desmarcado.

**Files:**
- Modify: `lib/constants/catalog-facets.ts`
- Modify: `lib/constants/catalog-facets.test.ts`
- Modify: `components/marketplace/catalog-sidebar.tsx`

**Interfaces:**
- Consumes: `visibleFacets` (já existente)
- Produces: `secaoOfereceEscolha(visiveis: readonly string[], selecionados: readonly string[]): boolean`

- [ ] **Step 1: Escrever o teste que falha**

Em `lib/constants/catalog-facets.test.ts`, acrescentar ao final:

```ts
describe("secaoOfereceEscolha", () => {
    it("esconde a seção com uma faceta só", () => {
        expect(secaoOfereceEscolha(["importers"], [])).toBe(false)
    })

    it("mostra a seção com duas ou mais", () => {
        expect(secaoOfereceEscolha(["importers", "exporters"], [])).toBe(true)
    })

    it("esconde a seção vazia", () => {
        expect(secaoOfereceEscolha([], [])).toBe(false)
    })

    it("mostra a seção com faceta única SE houver filtro ativo nela", () => {
        // Link antigo com ?category=importers: sem esta exceção o filtro ficaria
        // aplicado e invisível, sem como desmarcar.
        expect(secaoOfereceEscolha(["importers"], ["importers"])).toBe(true)
    })
})
```

Acrescentar `secaoOfereceEscolha` ao import do topo do arquivo.

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run lib/constants/catalog-facets.test.ts`
Expected: FAIL — `secaoOfereceEscolha` não é exportado.

- [ ] **Step 3: Implementar**

Em `lib/constants/catalog-facets.ts`, acrescentar ao final:

```ts
/**
 * Se vale a pena renderizar a seção de filtro.
 *
 * Uma faceta sozinha não oferece escolha — marcar a única opção devolve o mesmo
 * catálogo. A seção só ocupa espaço e sugere que o catálogo está incompleto.
 *
 * A exceção é filtro já ativo: aí a seção fica visível mesmo com uma faceta só,
 * senão um filtro vindo de link antigo ficaria aplicado sem aparecer em lugar
 * nenhum para ser desmarcado.
 */
export function secaoOfereceEscolha(
    visiveis: readonly string[],
    selecionados: readonly string[]
): boolean {
    return visiveis.length > 1 || selecionados.length > 0
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run: `npx vitest run lib/constants/catalog-facets.test.ts`
Expected: PASS — 4 testes novos

- [ ] **Step 5: Aplicar no sidebar**

Em `components/marketplace/catalog-sidebar.tsx`, acrescentar `secaoOfereceEscolha` ao import de `@/lib/constants/catalog-facets`.

Logo abaixo do cálculo das facetas visíveis, acrescentar:

```ts
    const selecaoCategoria = selectedCategory ? [selectedCategory] : []
    const mostrarCategorias = secaoOfereceEscolha(categorias, selecaoCategoria)
    const mostrarPaises = secaoOfereceEscolha(paises, selectedCountries)
    const mostrarSetores = secaoOfereceEscolha(setores, selectedIndustries)
    const mostrarIdiomas = secaoOfereceEscolha(idiomas, selectedLanguages)
```

Trocar as quatro condições de renderização e as três de separador:

| Antes | Depois |
|---|---|
| `{categorias.length > 0 && (` | `{mostrarCategorias && (` |
| `{categorias.length > 0 && paises.length > 0 && <hr ... />}` | `{mostrarCategorias && mostrarPaises && <hr ... />}` |
| `{paises.length > 0 && (` | `{mostrarPaises && (` |
| `{paises.length > 0 && setores.length > 0 && <hr ... />}` | `{mostrarPaises && mostrarSetores && <hr ... />}` |
| `{setores.length > 0 && (` | `{mostrarSetores && (` |
| `{setores.length > 0 && idiomas.length > 0 && <hr ... />}` | `{mostrarSetores && mostrarIdiomas && <hr ... />}` |
| `{idiomas.length > 0 && (` | `{mostrarIdiomas && (` |

- [ ] **Step 6: Verificar no navegador**

```bash
npm run dev
```

Abrir `http://localhost:3001/catalog`.

Expected: a seção "Categoria" **não** é renderizada (só existe `importers`). As seções de País, Setor e Idioma continuam.

Abrir `http://localhost:3001/catalog?category=importers`.

Expected: a seção "Categoria" **aparece**, com "Importadores" marcado, e é possível desmarcar.

- [ ] **Step 7: Typecheck, testes e commit**

Run: `npx tsc --noEmit && npx vitest run`
Expected: exit 0

```bash
git add lib/constants/catalog-facets.ts lib/constants/catalog-facets.test.ts components/marketplace/catalog-sidebar.tsx
git commit -m "feat(catalog): esconde secao de filtro que nao oferece escolha"
```

---

### Task 5: Acabamento visual do catálogo

Dois ajustes pequenos que se reforçam: com a quarta seção de filtro, o painel passa a estourar a altura da tela com facilidade.

**Files:**
- Modify: `components/marketplace/list-card.tsx:86-105`
- Modify: `components/marketplace/catalog-filters-panel.tsx:64`

**Interfaces:**
- Consumes: nada
- Produces: nenhum export novo

- [ ] **Step 1: Tirar a bandeira de idioma do card**

Duas bandeiras no mesmo canto — uma de país, uma de idioma — leem como quatro países. Ficam só as de país, que é o que o cliente compra. O idioma da lista continua visível na página de detalhe, onde já tem rótulo próprio (`fieldLanguage` e `quickLanguage`).

Em `components/marketplace/list-card.tsx`, remover o bloco das linhas 100–104:

```tsx
                            {language && (
                                <span className="ml-1 flex items-center" title={language.label}>
                                    <FlagIcon code={language.flagCode} size="sm" className="shadow-sm ring-1 ring-brand-accent/40" />
                                </span>
                            )}
```

Remover também a linha 49, que fica sem uso:

```tsx
    const language = getListLanguage(list.language)
```

e o import da linha 13:

```tsx
import { getListLanguage } from "@/lib/constants/list-languages"
```

`FlagIcon` continua importado — as bandeiras de país permanecem.

- [ ] **Step 2: Tornar o painel de filtros rolável**

Em `components/marketplace/catalog-filters-panel.tsx`, a linha 64 é:

```tsx
            <aside className="hidden rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24 lg:block lg:w-72 lg:shrink-0">
```

Substituir por:

```tsx
            {/* Sem altura máxima o painel gruda no topo e o fim da lista fica
                inalcançável: a roda do mouse rola a página, não o painel. */}
            <aside className="hidden rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
```

- [ ] **Step 3: Verificar no navegador**

```bash
npm run dev
```

Abrir `http://localhost:3001/catalog` numa janela de aproximadamente 800px de altura, com todas as seções de filtro abertas.

Expected: nenhum card mostra bandeira de idioma; as bandeiras de país continuam. Rolando a roda do mouse **sobre o painel de filtros**, o painel rola internamente e o botão "Limpar filtros" fica alcançável.

- [ ] **Step 4: Typecheck, lint e commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0; nenhum aviso novo de import sem uso

```bash
git add components/marketplace/list-card.tsx components/marketplace/catalog-filters-panel.tsx
git commit -m "feat(catalog): bandeira de idioma sai do card e painel de filtros rola"
```

---

### Task 6: Quem Somos no menu

A página `/about` já existe e está completa. Só não está ligada ao menu — nem no desktop nem na gaveta mobile.

**Files:**
- Modify: `components/marketplace/marketplace-header.tsx`
- Modify: `messages/*.json` (uma chave)

**Interfaces:**
- Consumes: rota `/about`, que já existe
- Produces: nenhum export novo

- [ ] **Step 1: Acrescentar a chave nos sete idiomas**

Em cada `messages/<locale>.json`, dentro de `nav`, logo após `"howItWorks"`:

- `pt`: `"about": "Quem somos",`
- `de`: `"about": "Über uns",`
- `en`: `"about": "About us",`
- `es`: `"about": "Quiénes somos",`
- `fr`: `"about": "À propos",`
- `it`: `"about": "Chi siamo",`
- `nl`: `"about": "Over ons",`

- [ ] **Step 2: Ligar no menu desktop**

Em `components/marketplace/marketplace-header.tsx`, no `<nav className="hidden items-center gap-6 md:flex">`, inserir entre o link de `/blog` e o de `/faq`:

```tsx
                    <LocaleLink
                        href="/about"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {t("about")}
                    </LocaleLink>
```

- [ ] **Step 3: Ligar na gaveta mobile**

No `<nav className="mt-8 flex flex-col gap-4">`, inserir entre o `SheetClose` de `/blog` e o de `/faq`:

```tsx
                                <SheetClose asChild>
                                    <LocaleLink href="/about" className="text-lg font-medium">
                                        {t("about")}
                                    </LocaleLink>
                                </SheetClose>
```

- [ ] **Step 4: Verificar no navegador**

```bash
npm run dev
```

Expected em `http://localhost:3001/`: "Quem somos" aparece no menu, entre Blog e FAQ, e leva a `/about`.
Expected em `http://localhost:3001/de`: o item aparece como "Über uns" e leva a `/de/about`, preservando o idioma.
Expected numa janela estreita (menos de 768px): o item aparece na gaveta e a gaveta fecha ao clicar.

- [ ] **Step 5: Testes e commit**

Run: `npx vitest run lib/i18n/messages-integridade.test.ts && npx tsc --noEmit`
Expected: exit 0

```bash
git add components/marketplace/marketplace-header.tsx messages/
git commit -m "feat(nav): Quem somos no menu do funil"
```

---

### Task 7: Texto do Quem Somos em português

Reescreve o conteúdo de `about.*` em `messages/pt.json` com o material do sócio, aplicados os cortes do spec. **A estrutura de chaves não muda** — só os valores. `app/[locale]/about/page.tsx` não é tocado.

Decisões que o texto abaixo já incorpora, e que **não devem ser revertidas** na hora de traduzir:

- A IA aparece como método de análise ao lado da revisão manual, nunca como argumento de venda.
- As fontes são reais e ficam, com "entre elas" — a composição varia de lista para lista, então nenhuma frase promete que toda lista passou por todas.
- Os 20+ anos de experiência são atribuídos a uma pessoa, **sem nomeá-la**.
- O número "100.000" não entra em lugar nenhum.

**Files:**
- Modify: `messages/pt.json` (bloco `about`)

**Interfaces:**
- Consumes: chaves já consumidas por `app/[locale]/about/page.tsx`
- Produces: nenhum export novo

- [ ] **Step 1: Substituir o bloco `about` de `messages/pt.json`**

```json
    "about": {
        "meta": {
            "title": "Quem somos e como as listas são feitas",
            "description": "Como as listas de importadores e distribuidores são produzidas: mais de duas décadas de experiência em exportação, pesquisa em fontes públicas e conferência empresa por empresa."
        },
        "hero": {
            "eyebrow": "Sobre",
            "title": "Quem está por trás das listas",
            "subtitle": "O Easy Prospect nasce de mais de duas décadas de experiência no comércio de exportação. Cada lista reúne importadores e distribuidores de um mercado, acompanhada de um estudo compacto de entrada nesse mercado — para quem exporta saber com quem falar, e como."
        },
        "methodology": {
            "eyebrow": "Metodologia",
            "title": "Como as listas são produzidas",
            "intro": "Quem paga por dados B2B tem o direito de saber de onde eles vêm. O processo está descrito abaixo, sem promessas que não possamos sustentar.",
            "blocks": [
                {
                    "title": "Origem dos dados",
                    "body": "As listas partem de material acumulado em anos de operação no comércio de exportação e são ampliadas com pesquisa em fontes públicas — entre elas sites institucionais, câmaras de comércio, associações setoriais e diretórios empresariais. A análise é apoiada por tecnologia; a decisão do que entra é de quem revisa."
                },
                {
                    "title": "Conferência empresa por empresa",
                    "body": "Antes de entrar numa lista, cada empresa é conferida em fontes públicas: se atua no setor indicado, se há atividade de importação ou distribuição, se mantém presença profissional e se os canais de contato estão ativos. A conferência não substitui a sua própria qualificação comercial, mas aumenta a chance de que a empresa listada seja relevante."
                },
                {
                    "title": "Manutenção do catálogo",
                    "body": "Contatos e estruturas societárias mudam o tempo todo. O catálogo é revisado periodicamente, e quando uma lista deixa de refletir o mercado que descreve, ela sai de venda em vez de continuar disponível."
                }
            ]
        },
        "delivery": {
            "title": "O que você recebe",
            "body": "Cada compra dá acesso a um estudo de entrada no mercado em PDF: visão geral do setor no país de destino, requisitos de acesso, estrutura de distribuição e o diretório de importadores e distribuidores da lista escolhida, com orientação sobre como preparar o primeiro contato."
        },
        "limits": {
            "title": "O que não prometemos",
            "body": "Não prometemos que toda empresa vai responder ao seu contato, nem que uma lista substitui a sua avaliação antes de negociar. Negócio internacional depende de demanda real, preço competitivo e do momento certo — fatores fora do nosso controle. Nossos diretórios também não foram feitos para disparo em massa: eles servem a uma abordagem preparada, empresa por empresa. O que garantimos é o critério: nenhuma empresa entra numa lista sem ter sido conferida em fontes públicas."
        },
        "cta": {
            "title": "Ainda com dúvidas?",
            "body": "As perguntas mais comuns sobre as listas, a entrega e o pagamento estão respondidas no FAQ.",
            "faq": "Ver perguntas frequentes",
            "catalog": "Ver catálogo"
        },
        "breadcrumb": {
            "home": "Início",
            "current": "Sobre"
        }
    },
```

- [ ] **Step 2: Verificar que nenhuma frase proibida entrou**

Run: `grep -n "100.000\|100000\|mais avançados\|anos de experiência no desenvolvimento" messages/pt.json`
Expected: nenhuma saída.

- [ ] **Step 3: Verificar no navegador**

```bash
npm run dev
```

Abrir `http://localhost:3001/about`.

Expected: a página renderiza os três blocos de metodologia com os títulos novos, sem chave crua na tela e sem quebra de layout. O bloco de metodologia continua com exatamente três cartões — `BLOCK_ICONS` tem três ícones e cicla, mas um quarto bloco repetiria o primeiro ícone.

- [ ] **Step 4: Commit**

```bash
git add messages/pt.json
git commit -m "feat(about): texto do Quem somos com o material revisado"
```

---

### Task 8: Texto do Quem Somos nos outros seis idiomas

Traduz a partir do português aprovado na Task 7, **não** dos documentos originais — os documentos ainda trazem a ênfase em IA e o número "100.000" que o spec cortou. Traduzir do original reintroduziria os dois.

O tom de referência é o do documento alemão `Warum EasyProspect- (1).docx`: direto, IA como método e não como argumento.

**Files:**
- Modify: `messages/de.json`, `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/it.json`, `messages/nl.json` (bloco `about`)

**Interfaces:**
- Consumes: o bloco `about` de `messages/pt.json` produzido na Task 7
- Produces: nenhum export novo

- [ ] **Step 1: Traduzir o bloco `about` em cada idioma**

Para cada um dos seis arquivos, substituir o bloco `about` pela tradução do bloco português da Task 7, mantendo **exatamente** a mesma estrutura de chaves e os mesmos três itens em `methodology.blocks`.

Regras que valem para todos os idiomas:

- "mais de duas décadas de experiência" → equivalente idiomático, sempre atribuído a quem está por trás do projeto, **nunca à empresa** e **sem nomear ninguém**.
- A tecnologia aparece como apoio à análise, seguida da revisão humana na mesma frase. Nunca em posição de destaque, nunca como superlativo.
- A lista de fontes é sempre introduzida por "entre elas" (`unter anderem`, `among them`, `entre ellas`, `parmi lesquelles`, `tra cui`, `onder meer`) — nunca como lista fechada.
- Nenhum número de empresas em nenhum idioma.
- "estudo de entrada no mercado" usa o termo consagrado do idioma: `Markteintrittsstudie` (de), `market entry study` (en), `estudio de entrada en el mercado` (es), `étude d'entrée sur le marché` (fr), `studio di ingresso nel mercato` (it), `marktintredestudie` (nl).

- [ ] **Step 2: Confirmar a paridade de chaves**

Run: `npx vitest run lib/i18n/messages-integridade.test.ts`
Expected: PASS. Falha em `tem todas as chaves de pt` significa que um bloco ficou com estrutura diferente do português — provavelmente número de itens em `methodology.blocks`.

- [ ] **Step 3: Verificar que nenhum número proibido entrou**

Run: `grep -rn "100.000\|100000\|100,000" messages/`
Expected: nenhuma saída.

- [ ] **Step 4: Verificar duas páginas no navegador**

```bash
npm run dev
```

Expected: `http://localhost:3001/de/about` e `http://localhost:3001/en/about` renderizam o texto traduzido, com três cartões de metodologia e sem chave crua na tela.

- [ ] **Step 5: Commit**

```bash
git add messages/
git commit -m "feat(about): Quem somos nos seis idiomas restantes"
```

---

## Verificação de aceite da fase

Rodar antes de abrir o PR:

```bash
npx tsc --noEmit && npm run lint && npx vitest run && npm run build
```

Expected: exit 0 nos quatro.

Depois, com `npm run dev`, confirmar cada item:

- [ ] Nenhum id de faceta aparece na tela: card, página de detalhe e filtro mostram rótulo traduzido
- [ ] As 20 listas exibem "FMCG — Bens de Consumo Alimentares" em `/catalog` e "FMCG — Konsumgüter Food" em `/de/catalog`
- [ ] `grep -rn '"food"' lib components app actions messages` não retorna nada
- [ ] `npx vitest run lib/i18n/facetas-rotuladas.test.ts` passa, e falha se um id for acrescentado sem rótulo em `pt`
- [ ] O filtro de idioma lista English (17), Português (2) e Español (1); `?languages=pt` devolve exatamente 2 listas
- [ ] A seção de categoria não é renderizada em `/catalog`, mas **é** renderizada em `/catalog?category=importers` e permite desmarcar
- [ ] Nenhum card mostra bandeira de idioma; as de país continuam
- [ ] Numa janela de ~800px de altura, a roda do mouse sobre o painel de filtros alcança "Limpar filtros"
- [ ] "Quem somos" aparece no menu desktop e na gaveta mobile, e leva a `/about` preservando o idioma
- [ ] `/about` e `/de/about` mostram o texto revisado, sem chave crua
- [ ] `grep -rn "100.000\|100000\|100,000" messages/` não retorna nada
