# Fase 2B — Multi-moeda (EUR/BRL/USD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o visitante escolhe entre EUR, BRL e USD, vê o preço cadastrado naquela moeda em toda a vitrine, e é cobrado exatamente nesse valor pelos dois provedores de pagamento.

**Architecture:** tabela nova `LeadListPrice` guarda um preço fixo por lista por moeda (EUR obrigatório); `LeadList.price` continua como espelho do preço em EUR, com um único caminho de escrita. A moeda ativa vive num cookie `CURRENCY`, decidido uma vez pelo `proxy.ts` a partir da geografia do IP e trocável por um seletor no header. Nenhuma cotação de câmbio é consultada em lugar nenhum: preço convertido em runtime flutua entre a vitrine e o checkout.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` como middleware, Node runtime), Prisma + PostgreSQL (Supabase), next-intl, Vitest, PayPal Server SDK, Stripe.

## Global Constraints

- **Nenhuma conversão de câmbio em runtime.** Toda exibição e toda cobrança usam valor cadastrado. A única taxa de câmbio do sistema é a que o admin digita no gerador em massa (Task 10), e ela some depois de gravar.
- **O servidor nunca aceita preço vindo do cliente.** As rotas de checkout recebem no máximo o *código* da moeda, e o validam contra `SUPPORTED_CURRENCIES`.
- **Moedas suportadas: `EUR`, `BRL`, `USD`.** EUR é o padrão e o único obrigatório por lista.
- **Fallback é assimétrico:** na vitrine, lista sem preço na moeda escolhida exibe o valor em EUR **com o símbolo €**; no checkout, o mesmo caso é erro `400`.
- **Moeda é independente do idioma** nos dois sentidos: trocar de idioma não troca a moeda, trocar de moeda não troca o idioma.
- **Node não está no PATH desta máquina.** Todo comando de shell precisa de `export PATH="/c/Program Files/nodejs:$PATH"` antes (não persiste entre chamadas).
- **`prisma migrate dev` FALHA neste projeto** (o pooler do Supabase não permite criar shadow database). Migração se faz com `migrate diff` → `db execute` → `migrate resolve`, como detalhado na Task 2.
- **Vitest só coleta `**/*.test.ts`** (não `.tsx`) em ambiente `node`. Nenhuma tarefa deste plano escreve teste de componente React; o que precisa de teste vira função pura em `lib/`.
- Testes seguem o padrão de `lib/checkout/fulfillment.test.ts`: banco injetado como parâmetro e mockado com `vi.fn()`, nunca um Prisma real. **Nenhum teste deste repositório abre conexão com o banco** — `lib/rate-limit.test.ts` e `lib/exports/purchase-export.test.ts` mockam `@/lib/prisma` de propósito, e o vitest não carrega `.env`. Nenhuma tarefa deste plano quebra essa regra; a verificação que precisa do banco real é um script (Task 12).
- **`npm run lint` exit 0 é impossível neste repositório**: a linha de base, medida em 2026-07-30, é **1361 erros e 94648 avisos** pré-existentes (`react-hooks`, `no-img-element`), nenhum deles nos arquivos desta fase. O critério válido é **zero problema novo nos arquivos tocados**, verificável com `npx eslint <arquivos que a task alterou>`.
- Branch de trabalho: `feat/multimoeda` (já criada, com a spec commitada).

---

## Estrutura de arquivos

**Criados**

| Arquivo | Responsabilidade |
|---|---|
| `lib/currency/index.ts` | Vocabulário de moedas e as duas funções puras: validar código, adivinhar moeda |
| `lib/currency/index.test.ts` | Testes do acima |
| `lib/currency/server.ts` | Leitura do cookie `CURRENCY` em Server Component / server action |
| `lib/marketplace/list-prices.ts` | Escolha de preço (pura) + leitura e escrita de `LeadListPrice` |
| `lib/marketplace/list-prices.test.ts` | Testes do acima |
| `actions/currency.ts` | Server action que grava o cookie |
| `actions/cart-prices.ts` | Server action que recalcula o carrinho numa moeda |
| `components/marketplace/currency-switcher.tsx` | Seletor no header |
| `components/admin/seed-prices-dialog.tsx` | Diálogo do gerador em massa |
| `prisma/check-precos.ts` | Guarda de dados: toda lista ativa tem preço em EUR |
| `prisma/migrations/20260730120000_add_lead_list_price/migration.sql` | Tabela nova + semeadura das linhas EUR |

**Modificados**

| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | Modelo `LeadListPrice` + relação em `LeadList` |
| `proxy.ts` | Grava `CURRENCY` quando ausente |
| `lib/utils.ts` | `formatCurrency` passa a receber o locale |
| `components/marketplace/marketplace-header.tsx` | Monta o `CurrencySwitcher` |
| `actions/marketplace.ts` | `getMarketplaceLists` devolve preço na moeda ativa |
| `app/[locale]/list/[slug]/page.tsx` | Preço e JSON-LD por moeda |
| `components/marketplace/cart-drawer.tsx` | Moeda resolvida, não `items[0]` |
| `contexts/cart-context.tsx` | Recalcula ao trocar de moeda |
| `app/[locale]/checkout/page.tsx` | Envia o código da moeda aos dois botões |
| `components/checkout/paypal-buttons.tsx` | Moeda dinâmica no SDK |
| `components/checkout/stripe-checkout-button.tsx` | Envia o código da moeda |
| `app/api/checkout/create-order/route.ts` | Resolve preço por `LeadListPrice` |
| `app/api/checkout/stripe/create-session/route.ts` | Idem |
| `actions/admin/lists.ts` | Grava os três preços; sai o `currency` por lista |
| `components/admin/list-form.tsx` | Campos BRL/USD; sai o seletor de moeda |
| `app/(app)/super-admin/marketplace/lists/page.tsx` | Botão do gerador em massa |
| `app/[locale]/my-purchases/page.tsx` | Total por moeda |
| `lib/seo/schema.ts` | Um `Offer` por moeda |
| `messages/{pt,en,de,es,fr,it,nl}.json` | Chaves novas |

---

### Task 1: Vocabulário de moedas (`lib/currency/`)

Módulo puro, sem React e sem Prisma. Tudo que decide "qual moeda" mora aqui, para que o resto do sistema nunca escreva `"EUR"` solto.

**Files:**
- Create: `lib/currency/index.ts`
- Test: `lib/currency/index.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `SUPPORTED_CURRENCIES`, `DEFAULT_CURRENCY`, `CURRENCY_COOKIE`, `type Currency`, `parseCurrency(value: string | null | undefined): Currency | null`, `guessCurrency(input: { country?: string | null; locale?: string | null }): Currency`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/currency/index.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    parseCurrency,
    guessCurrency,
} from "./index"

describe("SUPPORTED_CURRENCIES", () => {
    it("são exatamente EUR, BRL e USD", () => {
        expect([...SUPPORTED_CURRENCIES]).toEqual(["EUR", "BRL", "USD"])
    })

    it("tem EUR como padrão — é a única moeda obrigatória por lista", () => {
        expect(DEFAULT_CURRENCY).toBe("EUR")
    })
})

describe("parseCurrency", () => {
    it("aceita código suportado", () => {
        expect(parseCurrency("BRL")).toBe("BRL")
    })

    it("aceita minúsculas — o Stripe devolve a moeda assim", () => {
        expect(parseCurrency("usd")).toBe("USD")
    })

    it("recusa moeda não suportada em vez de cair no padrão", () => {
        expect(parseCurrency("GBP")).toBeNull()
    })

    it("recusa vazio, nulo e indefinido", () => {
        expect(parseCurrency("")).toBeNull()
        expect(parseCurrency(null)).toBeNull()
        expect(parseCurrency(undefined)).toBeNull()
    })
})

describe("guessCurrency", () => {
    it("Brasil vê real", () => {
        expect(guessCurrency({ country: "BR", locale: "de" })).toBe("BRL")
    })

    it("Estados Unidos e Canadá veem dólar", () => {
        expect(guessCurrency({ country: "US", locale: "pt" })).toBe("USD")
        expect(guessCurrency({ country: "CA", locale: "pt" })).toBe("USD")
    })

    it("o resto do mundo vê euro", () => {
        expect(guessCurrency({ country: "DE", locale: "pt" })).toBe("EUR")
        expect(guessCurrency({ country: "JP", locale: "en" })).toBe("EUR")
    })

    it("a geografia manda sobre o idioma: alemão morando no Brasil vê real", () => {
        expect(guessCurrency({ country: "BR", locale: "de" })).toBe("BRL")
    })

    it("sem país, cai no idioma", () => {
        expect(guessCurrency({ country: null, locale: "pt" })).toBe("BRL")
        expect(guessCurrency({ country: null, locale: "en" })).toBe("USD")
        expect(guessCurrency({ country: null, locale: "fr" })).toBe("EUR")
    })

    it("sem país e sem idioma, cai no padrão", () => {
        expect(guessCurrency({})).toBe("EUR")
    })

    it("país em minúsculas conta igual", () => {
        expect(guessCurrency({ country: "br" })).toBe("BRL")
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/currency/index.test.ts
```

Esperado: FAIL, `Failed to resolve import "./index"`.

- [ ] **Step 3: Implementar**

Criar `lib/currency/index.ts`:

```ts
/**
 * Vocabulário único de moedas do marketplace.
 *
 * Preço é FIXO por moeda, cadastrado à mão — nunca convertido em runtime.
 * Um valor convertido na hora flutua entre a vitrine e o checkout, e a
 * diferença aparece no momento exato em que a pessoa decide pagar.
 */
export const SUPPORTED_CURRENCIES = ["EUR", "BRL", "USD"] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

/** EUR é o padrão e a única moeda obrigatória por lista. */
export const DEFAULT_CURRENCY: Currency = "EUR"

export const CURRENCY_COOKIE = "CURRENCY"

/**
 * Devolve `null` — não o padrão — para código não suportado. Quem chama decide
 * se aquilo é "cai no euro" (cookie corrompido, vitrine) ou "erro 400"
 * (checkout). Cair no padrão aqui dentro apagaria essa distinção.
 */
export function parseCurrency(value: string | null | undefined): Currency | null {
    if (!value) return null
    const upper = value.toUpperCase()
    return SUPPORTED_CURRENCIES.includes(upper as Currency) ? (upper as Currency) : null
}

const COUNTRY_CURRENCY: Record<string, Currency> = {
    BR: "BRL",
    US: "USD",
    CA: "USD",
}

const LOCALE_CURRENCY: Record<string, Currency> = {
    pt: "BRL",
    en: "USD",
}

/**
 * Palpite inicial, nunca uma decisão final: assim que a pessoa usa o seletor,
 * o cookie manda e esta função não é mais consultada.
 *
 * A geografia vem antes do idioma de propósito. O idioma sozinho erra os dois
 * casos reais do projeto — o alemão morando no Brasil e o brasileiro lendo a
 * página em inglês.
 */
export function guessCurrency(input: { country?: string | null; locale?: string | null }): Currency {
    const country = input.country?.toUpperCase()
    if (country && COUNTRY_CURRENCY[country]) {
        return COUNTRY_CURRENCY[country]
    }

    const locale = input.locale?.toLowerCase()
    if (locale && LOCALE_CURRENCY[locale]) {
        return LOCALE_CURRENCY[locale]
    }

    return DEFAULT_CURRENCY
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/currency/index.test.ts
```

Esperado: PASS, 13 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/currency/index.ts lib/currency/index.test.ts
git commit -m "feat(currency): vocabulario de moedas e palpite por geografia"
```

---

### Task 2: Tabela `LeadListPrice` e semeadura em EUR

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260730120000_add_lead_list_price/migration.sql`

**Interfaces:**
- Consumes: nada.
- Produces: modelo Prisma `LeadListPrice { id, listId, list, currency, amount }` com `@@unique([listId, currency])`; relação `LeadList.prices`.

- [ ] **Step 1: Registrar o estado atual do banco (a semeadura será comparada contra ele)**

Rodar via MCP do Supabase (projeto `rkctbnigtdahdkenddui`) ou psql:

```sql
select count(*) as listas, count(*) filter (where currency = 'EUR') as em_eur from lead_lists;
```

Esperado: `listas = 20`, `em_eur = 20`. **Se `em_eur` for menor que `listas`, PARE** — existe lista em moeda diferente e o SQL de semeadura da Step 4 (que assume o preço atual como preço em EUR) estaria gravando um valor errado. Nesse caso, relate ao usuário antes de continuar.

- [ ] **Step 2: Declarar o modelo no schema**

Em `prisma/schema.prisma`, adicionar dentro do model `LeadList`, junto às demais relações (perto de `leads MarketplaceLead[]`):

```prisma
  prices        LeadListPrice[]
```

E o modelo novo, logo após o `model LeadList`:

```prisma
// Preço de uma lista numa moeda. Um registro por moeda oferecida.
//
// O preço é FIXO e cadastrado, nunca convertido em runtime.
// LeadList.price/currency continuam existindo e significam o preço em EUR —
// a linha EUR desta tabela é o mesmo número, mantido em sincronia por
// lib/marketplace/list-prices.ts, que é o único caminho de escrita.
model LeadListPrice {
  id String @id @default(cuid())

  listId String
  list   LeadList @relation(fields: [listId], references: [id], onDelete: Cascade)

  currency String
  amount   Decimal @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([listId, currency])
  @@index([listId])
  @@map("lead_list_prices")
}
```

- [ ] **Step 3: Gerar o SQL da migração**

`prisma migrate dev` não funciona neste projeto (o pooler do Supabase não deixa criar shadow database). O caminho é gerar o diff:

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > /tmp/multimoeda.sql && cat /tmp/multimoeda.sql
```

Esperado: um `CREATE TABLE "lead_list_prices"` mais os dois índices e a foreign key. **Confira o arquivo antes de aplicar:** se aparecer `DROP` ou alteração em qualquer outra tabela, é o drift pré-existente do projeto vazando — remova essas linhas e deixe só o que se refere a `lead_list_prices`.

- [ ] **Step 4: Montar a migração com a semeadura**

Criar `prisma/migrations/20260730120000_add_lead_list_price/migration.sql` com o conteúdo gerado acima seguido do bloco de semeadura:

```sql
-- CreateTable
CREATE TABLE "lead_list_prices" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_list_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_list_prices_listId_idx" ON "lead_list_prices"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_list_prices_listId_currency_key" ON "lead_list_prices"("listId", "currency");

-- AddForeignKey
ALTER TABLE "lead_list_prices" ADD CONSTRAINT "lead_list_prices_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lead_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Semeadura: o preço atual de cada lista vira a linha da sua moeda atual.
-- Verificado em 2026-07-30: as 20 listas do banco estão todas em EUR, então
-- na prática isto cria 20 linhas EUR. A cláusula usa `currency` da própria
-- lista em vez de literal 'EUR' para não inventar moeda caso alguma tenha sido
-- cadastrada diferente entre o planejamento e a execução.
INSERT INTO "lead_list_prices" ("id", "listId", "currency", "amount", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "currency",
    "price",
    NOW(),
    NOW()
FROM "lead_lists"
ON CONFLICT ("listId", "currency") DO NOTHING;
```

- [ ] **Step 5: Aplicar e registrar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx prisma db execute --file prisma/migrations/20260730120000_add_lead_list_price/migration.sql --schema prisma/schema.prisma && npx prisma migrate resolve --applied 20260730120000_add_lead_list_price && npx prisma generate
```

Esperado: `Script executed successfully`, `Migration marked as applied`, `Generated Prisma Client`.

- [ ] **Step 6: Verificar a semeadura no banco**

```sql
select
  (select count(*) from lead_lists) as listas,
  (select count(*) from lead_list_prices where currency = 'EUR') as precos_eur,
  (select count(*) from lead_lists l
     join lead_list_prices p on p."listId" = l.id and p.currency = l.currency
    where p.amount <> l.price) as divergentes;
```

Esperado: `listas = 20`, `precos_eur = 20`, `divergentes = 0`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260730120000_add_lead_list_price/
git commit -m "feat(db): tabela LeadListPrice com semeadura dos precos em EUR"
```

---

### Task 3: Leitura e escrita de preços (`lib/marketplace/list-prices.ts`)

O coração da fase. `pickPrice` é pura e carrega a regra de fallback; as outras duas só falam com o banco.

**Files:**
- Create: `lib/marketplace/list-prices.ts`
- Test: `lib/marketplace/list-prices.test.ts`

**Interfaces:**
- Consumes: `Currency`, `DEFAULT_CURRENCY`, `SUPPORTED_CURRENCIES` de `lib/currency`.
- Produces:
  - `interface ResolvedPrice { amount: number; currency: Currency; isFallback: boolean }`
  - `interface StoredPrice { currency: string; amount: Decimal | number | string }`
  - `pickPrice(prices: StoredPrice[], wanted: Currency): ResolvedPrice | null`
  - `resolveListPrices(db, listIds: string[], wanted: Currency): Promise<Map<string, ResolvedPrice>>`
  - `writeListPrices(db, listId: string, amounts: Partial<Record<Currency, number>>): Promise<void>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/marketplace/list-prices.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import { pickPrice, resolveListPrices, writeListPrices } from "./list-prices"

describe("pickPrice", () => {
    const prices = [
        { currency: "EUR", amount: "45.00" },
        { currency: "BRL", amount: "289.00" },
    ]

    it("devolve o preço da moeda pedida", () => {
        expect(pickPrice(prices, "BRL")).toEqual({ amount: 289, currency: "BRL", isFallback: false })
    })

    it("cai para EUR quando a moeda pedida não tem preço, e marca o fallback", () => {
        expect(pickPrice(prices, "USD")).toEqual({ amount: 45, currency: "EUR", isFallback: true })
    })

    it("devolve null quando nem EUR existe — lista sem preço não tem o que exibir", () => {
        expect(pickPrice([{ currency: "BRL", amount: "289.00" }], "USD")).toBeNull()
    })

    it("aceita Decimal, number e string como veio do banco", () => {
        expect(pickPrice([{ currency: "EUR", amount: 45 }], "EUR")?.amount).toBe(45)
        expect(pickPrice([{ currency: "EUR", amount: "45.50" }], "EUR")?.amount).toBe(45.5)
    })

    it("ignora moeda desconhecida guardada no banco", () => {
        const comLixo = [{ currency: "GBP", amount: "30.00" }, { currency: "EUR", amount: "45.00" }]
        expect(pickPrice(comLixo, "EUR")).toEqual({ amount: 45, currency: "EUR", isFallback: false })
    })
})

describe("resolveListPrices", () => {
    function createMockDb(rows: Array<{ listId: string; currency: string; amount: string }>) {
        return {
            leadListPrice: {
                findMany: vi.fn().mockResolvedValue(rows),
            },
        }
    }

    it("devolve um preço por lista, na moeda pedida", async () => {
        const db = createMockDb([
            { listId: "a", currency: "EUR", amount: "45.00" },
            { listId: "a", currency: "BRL", amount: "289.00" },
            { listId: "b", currency: "EUR", amount: "20.00" },
        ])

        const result = await resolveListPrices(db as never, ["a", "b"], "BRL")

        expect(result.get("a")).toEqual({ amount: 289, currency: "BRL", isFallback: false })
        expect(result.get("b")).toEqual({ amount: 20, currency: "EUR", isFallback: true })
    })

    it("omite do mapa a lista sem nenhum preço", async () => {
        const db = createMockDb([])
        const result = await resolveListPrices(db as never, ["a"], "EUR")
        expect(result.has("a")).toBe(false)
    })

    it("não consulta o banco com lista de ids vazia", async () => {
        const db = createMockDb([])
        const result = await resolveListPrices(db as never, [], "EUR")
        expect(result.size).toBe(0)
        expect(db.leadListPrice.findMany).not.toHaveBeenCalled()
    })
})

describe("writeListPrices", () => {
    function createMockDb() {
        const tx = {
            leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
            leadList: { update: vi.fn() },
        }
        return {
            tx,
            db: { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) },
        }
    }

    it("grava cada moeda informada e espelha o EUR em LeadList.price", async () => {
        const { db, tx } = createMockDb()

        await writeListPrices(db as never, "list-1", { EUR: 45, BRL: 289 })

        expect(tx.leadListPrice.upsert).toHaveBeenCalledTimes(2)
        expect(tx.leadList.update).toHaveBeenCalledWith({
            where: { id: "list-1" },
            data: { price: 45, currency: "EUR" },
        })
    })

    it("recusa gravar sem EUR — é a moeda obrigatória", async () => {
        const { db } = createMockDb()
        await expect(writeListPrices(db as never, "list-1", { BRL: 289 })).rejects.toThrow(/EUR/)
    })

    it("recusa valor não positivo", async () => {
        const { db } = createMockDb()
        await expect(writeListPrices(db as never, "list-1", { EUR: 0 })).rejects.toThrow(/positivo/)
    })

    it("apaga a linha da moeda cujo valor foi enviado como undefined", async () => {
        const { db, tx } = createMockDb()

        await writeListPrices(db as never, "list-1", { EUR: 45, BRL: undefined })

        expect(tx.leadListPrice.deleteMany).toHaveBeenCalledWith({
            where: { listId: "list-1", currency: { in: ["BRL", "USD"] } },
        })
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: FAIL, `Failed to resolve import "./list-prices"`.

- [ ] **Step 3: Implementar**

Criar `lib/marketplace/list-prices.ts`:

```ts
import type { PrismaClient } from "@prisma/client"
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency"

export interface ResolvedPrice {
    amount: number
    currency: Currency
    isFallback: boolean
}

export interface StoredPrice {
    currency: string
    amount: { toString(): string } | number | string
}

/**
 * Escolhe o preço a exibir. `isFallback` existe para a tela poder avisar que
 * está mostrando euro — o que nunca pode acontecer é R$ sobre um valor em EUR.
 *
 * `null` quando nem EUR existe: a lista não tem preço, e inventar um seria
 * pior que não exibir.
 */
export function pickPrice(prices: StoredPrice[], wanted: Currency): ResolvedPrice | null {
    const exact = prices.find((p) => p.currency === wanted)
    if (exact) {
        return { amount: Number(exact.amount.toString()), currency: wanted, isFallback: false }
    }

    const fallback = prices.find((p) => p.currency === DEFAULT_CURRENCY)
    if (fallback) {
        return {
            amount: Number(fallback.amount.toString()),
            currency: DEFAULT_CURRENCY,
            isFallback: true,
        }
    }

    return null
}

type PriceDb = Pick<PrismaClient, "leadListPrice" | "leadList" | "$transaction">

/**
 * Uma consulta só para todas as listas da página — evitar N+1 aqui importa: o
 * catálogo renderiza 12 cards por vez.
 */
export async function resolveListPrices(
    db: PriceDb,
    listIds: string[],
    wanted: Currency
): Promise<Map<string, ResolvedPrice>> {
    const result = new Map<string, ResolvedPrice>()
    if (listIds.length === 0) return result

    const rows = await db.leadListPrice.findMany({
        where: { listId: { in: listIds } },
        select: { listId: true, currency: true, amount: true },
    })

    for (const listId of listIds) {
        const price = pickPrice(
            rows.filter((row) => row.listId === listId),
            wanted
        )
        if (price) result.set(listId, price)
    }

    return result
}

/**
 * ÚNICO caminho de escrita de preço no sistema.
 *
 * O preço em EUR vive em dois lugares — `LeadListPrice` (fonte de verdade da
 * leitura) e `LeadList.price` (espelho que SEO, super-admin e e-mail já
 * consomem). Concentrar a escrita aqui, numa transação, é o que impede os dois
 * divergirem. Nenhum outro módulo grava preço.
 *
 * Moeda ausente do objeto = a lista deixa de ter preço nela (a linha é
 * apagada). EUR nunca pode ser ausente.
 */
export async function writeListPrices(
    db: PriceDb,
    listId: string,
    amounts: Partial<Record<Currency, number>>
): Promise<void> {
    const eur = amounts[DEFAULT_CURRENCY]
    if (eur === undefined) {
        throw new Error("Preço em EUR é obrigatório: é a moeda de referência da lista.")
    }

    for (const [currency, amount] of Object.entries(amounts)) {
        if (amount !== undefined && !(amount > 0)) {
            throw new Error(`Preço em ${currency} precisa ser positivo.`)
        }
    }

    const toRemove = SUPPORTED_CURRENCIES.filter((c) => amounts[c] === undefined)

    await db.$transaction(async (tx) => {
        for (const currency of SUPPORTED_CURRENCIES) {
            const amount = amounts[currency]
            if (amount === undefined) continue

            await tx.leadListPrice.upsert({
                where: { listId_currency: { listId, currency } },
                create: { listId, currency, amount },
                update: { amount },
            })
        }

        if (toRemove.length > 0) {
            await tx.leadListPrice.deleteMany({
                where: { listId, currency: { in: toRemove } },
            })
        }

        await tx.leadList.update({
            where: { id: listId },
            data: { price: eur, currency: DEFAULT_CURRENCY },
        })
    })
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: PASS, 12 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/marketplace/list-prices.ts lib/marketplace/list-prices.test.ts
git commit -m "feat(marketplace): leitura e escrita de precos por moeda"
```

---

### Task 4: Cookie `CURRENCY` no proxy e leitura no servidor

**Files:**
- Modify: `proxy.ts`
- Create: `lib/currency/server.ts`
- Test: `lib/currency/index.test.ts` (acrescentar bloco)

**Interfaces:**
- Consumes: `guessCurrency`, `parseCurrency`, `CURRENCY_COOKIE`, `DEFAULT_CURRENCY`, `Currency`.
- Produces: `decideCurrencyCookie(input: { existing: string | null; country: string | null; pathname: string }): Currency | null` em `lib/currency/index.ts` (null = não gravar nada); `getActiveCurrency(): Promise<Currency>` em `lib/currency/server.ts`.

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar ao final de `lib/currency/index.test.ts`:

```ts
import { decideCurrencyCookie } from "./index"

describe("decideCurrencyCookie", () => {
    it("não regrava quando o cookie já existe — escolha da pessoa não é sobrescrita", () => {
        expect(decideCurrencyCookie({ existing: "EUR", country: "BR", pathname: "/catalog" })).toBeNull()
    })

    it("grava o palpite quando não há cookie", () => {
        expect(decideCurrencyCookie({ existing: null, country: "BR", pathname: "/catalog" })).toBe("BRL")
    })

    it("cookie com valor inválido é tratado como ausente", () => {
        expect(decideCurrencyCookie({ existing: "GBP", country: "US", pathname: "/catalog" })).toBe("USD")
    })

    it("sem país, usa o idioma do caminho", () => {
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/en/catalog" })).toBe("USD")
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/de/catalog" })).toBe("EUR")
    })

    it("caminho sem prefixo de idioma é português (o locale padrão do site)", () => {
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/catalog" })).toBe("BRL")
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/currency/index.test.ts
```

Esperado: FAIL, `decideCurrencyCookie is not a function`.

- [ ] **Step 3: Implementar a decisão**

Acrescentar ao final de `lib/currency/index.ts`:

```ts
import { stripLocale } from "@/lib/i18n/strip-locale"

/**
 * Decide o que o proxy grava no cookie. `null` = não mexer.
 *
 * A geografia só é consultada UMA vez, aqui. As páginas leem o cookie e nada
 * mais: ler geografia dentro do render foi o que já tornou o funil inteiro
 * dinâmico neste projeto uma vez, e o custo não se paga de novo.
 */
export function decideCurrencyCookie(input: {
    existing: string | null
    country: string | null
    pathname: string
}): Currency | null {
    if (parseCurrency(input.existing)) return null

    // stripLocale devolve DEFAULT_LOCALE ("pt") quando o caminho não tem
    // prefixo de idioma — é por isso que "/catalog" resulta em BRL.
    const { locale } = stripLocale(input.pathname)

    return guessCurrency({ country: input.country, locale })
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/currency/index.test.ts
```

Esperado: PASS, 18 testes.

- [ ] **Step 5: Ligar no proxy**

Em `proxy.ts`, importar no topo:

```ts
import { decideCurrencyCookie, CURRENCY_COOKIE } from "@/lib/currency"
```

E dentro de `respond()`, antes do `return`, aplicar o cookie nas duas saídas. Substituir a função inteira (linhas 158-166) por:

```ts
    // A moeda é decidida uma única vez, na primeira visita, a partir do país do
    // IP. Só vale para as rotas do funil — CRM e super-admin não têm vitrine.
    const currencyToSet = isLocaleSegmentRoute
        ? decideCurrencyCookie({
            existing: request.cookies.get(CURRENCY_COOKIE)?.value ?? null,
            country: request.headers.get("x-vercel-ip-country"),
            pathname,
        })
        : null

    const withCurrencyCookie = (response: NextResponse) => {
        if (currencyToSet) {
            response.cookies.set(CURRENCY_COOKIE, currencyToSet, {
                path: "/",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365,
            })
        }
        return response
    }

    const respond = () => {
        if (!isLocaleSegmentRoute) return supabaseResponse

        const intlResponse = intlMiddleware(request)
        for (const cookie of supabaseResponse.cookies.getAll()) {
            intlResponse.cookies.set(cookie)
        }
        return withCurrencyCookie(intlResponse)
    }
```

- [ ] **Step 6: Criar a leitura no servidor**

Criar `lib/currency/server.ts`:

```ts
import { cookies } from "next/headers"
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency, type Currency } from "./index"

/**
 * Moeda ativa da requisição. Cookie inválido ou ausente cai no euro — na
 * vitrine, cair no padrão é o comportamento certo (ver parseCurrency, que
 * devolve null justamente para deixar essa escolha a quem chama).
 */
export async function getActiveCurrency(): Promise<Currency> {
    const cookie = (await cookies()).get(CURRENCY_COOKIE)?.value
    return parseCurrency(cookie) ?? DEFAULT_CURRENCY
}
```

- [ ] **Step 7: Verificar que o proxy compila**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit
```

Esperado: exit 0, sem erros.

- [ ] **Step 8: Commit**

```bash
git add proxy.ts lib/currency/
git commit -m "feat(currency): proxy grava cookie CURRENCY pela geografia do IP"
```

---

### Task 5: Seletor de moeda no header

**Files:**
- Create: `actions/currency.ts`, `components/marketplace/currency-switcher.tsx`
- Modify: `components/marketplace/marketplace-header.tsx:97-99`, `lib/utils.ts:10-21`, `messages/{pt,en,de,es,fr,it,nl}.json`

**Interfaces:**
- Consumes: `SUPPORTED_CURRENCIES`, `Currency`, `parseCurrency`, `CURRENCY_COOKIE`, `getActiveCurrency`.
- Produces: `setCurrencyCookie(currency: string): Promise<void>`; componente `<CurrencySwitcher current={Currency} />`; `formatCurrency(value: number, currency: string, locale: string)`.

- [ ] **Step 1: Corrigir `formatCurrency`**

Hoje ele deriva o locale da moeda — BRL sempre sai `pt-BR`, mesmo para um leitor alemão. Substituir `lib/utils.ts:10-21` por:

```ts
/**
 * O locale formata (separador de milhar, posição do símbolo); a moeda é só a
 * moeda. Derivar o locale da moeda, como era antes, mostrava "R$ 1.234,56" com
 * pontuação brasileira para um leitor alemão lendo a página em alemão.
 */
export function formatCurrency(
  value: number,
  currency: string = "EUR",
  locale: string = "de-DE"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value)
}
```

- [ ] **Step 2: Compilar e corrigir as chamadas existentes**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx eslint lib/utils.ts
```

Esperado: exit 0. O terceiro parâmetro tem default, então nenhuma chamada atual quebra. As chamadas passam a receber o locale nas Tasks 6, 7 e 11.

- [ ] **Step 3: Criar a server action**

Criar `actions/currency.ts`:

```ts
"use server"

import { cookies } from "next/headers"
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency } from "@/lib/currency"

export async function setCurrencyCookie(currency: string): Promise<void> {
    const resolved = parseCurrency(currency) ?? DEFAULT_CURRENCY
    ;(await cookies()).set(CURRENCY_COOKIE, resolved, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
    })
}
```

- [ ] **Step 4: Criar o seletor**

O seletor lê o cookie **no cliente**, e não recebe a moeda como prop. Isso é deliberado e não é negociável: `marketplace-header.tsx` é `"use client"` e é montado em `app/[locale]/layout.tsx:129`, o layout de **todo** o funil. Resolver a moeda no servidor para passá-la como prop obrigaria o layout a chamar `cookies()`, e isso torna dinâmica cada página do funil — foi exatamente esse mecanismo (`getLocale` no layout raiz) que já causou a regressão de performance registrada neste projeto. O preço em si continua resolvido no servidor, nas rotas que já são dinâmicas.

Criar `components/marketplace/currency-switcher.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Coins } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/i18n/navigation"
import { setCurrencyCookie } from "@/actions/currency"
import {
    CURRENCY_COOKIE,
    DEFAULT_CURRENCY,
    SUPPORTED_CURRENCIES,
    parseCurrency,
    type Currency,
} from "@/lib/currency"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SYMBOLS: Record<Currency, string> = {
    EUR: "€",
    BRL: "R$",
    USD: "US$",
}

function readCurrencyCookie(): Currency {
    if (typeof document === "undefined") return DEFAULT_CURRENCY
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]+)`))
    return parseCurrency(match?.[1]) ?? DEFAULT_CURRENCY
}

export function CurrencySwitcher() {
    const router = useRouter()
    const t = useTranslations("nav")
    // O primeiro render é o do servidor, que não vê document.cookie. Ler no
    // efeito evita divergência de hidratação; o custo é o rótulo aparecer como
    // EUR por um instante, num badge de 3 letras.
    const [current, setCurrent] = useState<Currency>(DEFAULT_CURRENCY)

    useEffect(() => {
        setCurrent(readCurrencyCookie())
    }, [])

    // Trocar de moeda NÃO troca de idioma: são cookies independentes e a rota
    // continua a mesma. router.refresh() basta para os Server Components
    // relerem o cookie e recalcularem os preços.
    const switchTo = async (target: Currency) => {
        if (target === current) return
        await setCurrencyCookie(target)
        setCurrent(target)
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t("currency")}>
                    <Coins className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{current}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {SUPPORTED_CURRENCIES.map((c) => (
                    <DropdownMenuItem
                        key={c}
                        onClick={() => switchTo(c)}
                        className={c === current ? "font-semibold" : undefined}
                    >
                        {SYMBOLS[c]} {c}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

- [ ] **Step 5: Montar no header**

Em `components/marketplace/marketplace-header.tsx`, importar:

```tsx
import { CurrencySwitcher } from "@/components/marketplace/currency-switcher"
```

E renderizar entre `LocaleSwitcher` e `CartBadge` (linhas 97-99):

```tsx
                    <ThemeToggle />
                    <LocaleSwitcher />
                    <CurrencySwitcher />
                    <CartBadge />
```

**Não** toque em `app/[locale]/layout.tsx`. Se em algum momento parecer necessário chamar `getActiveCurrency()` lá, pare: é o caminho para o funil inteiro virar dinâmico de novo.

- [ ] **Step 6: Traduzir o rótulo nos 7 idiomas**

Acrescentar a chave `currency` ao namespace `nav` em cada arquivo de `messages/`:

- `pt.json`: `"currency": "Moeda"`
- `en.json`: `"currency": "Currency"`
- `de.json`: `"currency": "Währung"`
- `es.json`: `"currency": "Moneda"`
- `fr.json`: `"currency": "Devise"`
- `it.json`: `"currency": "Valuta"`
- `nl.json`: `"currency": "Valuta"`

- [ ] **Step 7: Verificar a paridade de mensagens**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/i18n/messages-integridade.test.ts
```

Esperado: PASS. Se reprovar por chave faltando, o arquivo do idioma apontado não recebeu `nav.currency`.

- [ ] **Step 8: Commit**

```bash
git add actions/currency.ts components/marketplace/currency-switcher.tsx components/marketplace/marketplace-header.tsx lib/utils.ts messages/
git commit -m "feat(currency): seletor de moeda no header do marketplace"
```

---

### Task 6: Vitrine — catálogo e página de lista na moeda ativa

**Files:**
- Modify: `actions/marketplace.ts` (`getMarketplaceLists`, a partir da linha 68), `components/marketplace/list-card.tsx:32,60,139`, `app/[locale]/list/[slug]/page.tsx:74,239`

**Interfaces:**
- Consumes: `getActiveCurrency`, `resolveListPrices`, `pickPrice`, `formatCurrency` com locale.
- Produces: `MarketplaceListCardData` ganha os campos `price: number`, `currency: string` **já resolvidos na moeda ativa** (os nomes não mudam, o significado sim) e `priceIsFallback: boolean`.

- [ ] **Step 1: Resolver o preço em `getMarketplaceLists`**

Em `actions/marketplace.ts`, depois do `Promise.all` que busca `lists` e `total` (linha 68-76), acrescentar:

```ts
    const currency = await getActiveCurrency()
    const prices = await resolveListPrices(prisma, lists.map((l) => l.id), currency)

    // O card recebe o preço JÁ resolvido: `price` e `currency` passam a
    // significar "o que esta pessoa vê", não "o que a lista custa em euro".
    // Lista sem preço nenhum mantém o valor da coluna antiga em vez de
    // desaparecer da vitrine.
    const listsWithPrice = lists.map((list) => {
        const resolved = prices.get(list.id)
        return {
            ...list,
            price: resolved ? resolved.amount : Number(list.price),
            currency: resolved ? resolved.currency : list.currency,
            priceIsFallback: resolved?.isFallback ?? false,
        }
    })
```

E devolver `listsWithPrice` no lugar de `lists` no objeto de retorno da função. Importar no topo:

```ts
import { getActiveCurrency } from "@/lib/currency/server"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
```

- [ ] **Step 2: Declarar o campo novo no card**

Em `components/marketplace/list-card.tsx`, acrescentar a `MarketplaceListCardData` (após `currency: string`, linha 32):

```ts
    priceIsFallback?: boolean
```

- [ ] **Step 3: Passar o locale para a formatação**

Ainda em `list-card.tsx`, o componente já usa `useTranslations`. Acrescentar `useLocale` ao import de `next-intl` e, dentro do componente:

```tsx
    const locale = useLocale()
```

Trocar a linha 139:

```tsx
                                {formatCurrency(list.price, list.currency, locale)}
```

- [ ] **Step 4: Resolver o preço na página de lista**

Em `app/[locale]/list/[slug]/page.tsx`, substituir a linha 74 (`const price = Number(list.price)`) por:

```tsx
    const currency = await getActiveCurrency()
    const priceRows = await prisma.leadListPrice.findMany({
        where: { listId: list.id },
        select: { currency: true, amount: true },
    })
    // Lista sem nenhuma linha de preço cai na coluna antiga: a página nunca
    // fica sem preço por causa de um cadastro incompleto.
    const resolved = pickPrice(priceRows, currency)
        ?? { amount: Number(list.price), currency: list.currency as Currency, isFallback: false }
    const price = resolved.amount
```

Importar no topo:

```tsx
import { getActiveCurrency } from "@/lib/currency/server"
import { pickPrice } from "@/lib/marketplace/list-prices"
import type { Currency } from "@/lib/currency"
```

E trocar a linha 239:

```tsx
                                {formatCurrency(price, resolved.currency, locale)}
```

- [ ] **Step 5: Verificar compilação e testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run
```

Esperado: exit 0 nos dois.

- [ ] **Step 6: Verificar na tela**

Subir o dev server pelo `.claude/launch.json` (porta 3001, **nunca** via Bash) e conferir:
- `/catalog` com o cookie `CURRENCY=EUR` mostra `€ 45,00`;
- trocando para `BRL` no seletor, as listas **com** preço em real mostram `R$`, e as **sem** continuam em `€` — nunca `R$` sobre o número em euro;
- trocar o idioma no header não muda a moeda exibida.

Como o browser embutido não executa o swap de Suspense do Next 16, valide por `curl` no HTML servido ou peça ao usuário para olhar no navegador real.

- [ ] **Step 7: Commit**

```bash
git add actions/marketplace.ts components/marketplace/list-card.tsx app/\[locale\]/list/\[slug\]/page.tsx
git commit -m "feat(catalogo): vitrine exibe preco na moeda ativa"
```

---

### Task 7: Carrinho recalculado na troca de moeda

**Files:**
- Create: `actions/cart-prices.ts`
- Modify: `contexts/cart-context.tsx`, `components/marketplace/cart-drawer.tsx:70`, `app/[locale]/cart/page.tsx:113,159,174`
- Test: `lib/marketplace/list-prices.test.ts` (acrescentar bloco)

**Interfaces:**
- Consumes: `resolveListPrices`, `parseCurrency`, `getActiveCurrency`.
- Produces: `resolveCartPrices(listIds: string[], currency: string): Promise<{ currency: Currency; fellBack: boolean; prices: Record<string, number> }>`; `useCart()` ganha `currency: string` e `repriceTo(currency: string): Promise<void>`.

- [ ] **Step 1: Escrever o teste da regra de queda do carrinho**

A regra é pura e vale a pena testar isolada. Acrescentar ao final de `lib/marketplace/list-prices.test.ts`:

```ts
import { cartCurrencyFor } from "./list-prices"

describe("cartCurrencyFor", () => {
    it("mantém a moeda pedida quando todos os itens têm preço nela", () => {
        const prices = new Map([
            ["a", { amount: 289, currency: "BRL" as const, isFallback: false }],
            ["b", { amount: 129, currency: "BRL" as const, isFallback: false }],
        ])
        expect(cartCurrencyFor(prices, "BRL")).toEqual({ currency: "BRL", fellBack: false })
    })

    it("derruba o carrinho INTEIRO para EUR se um único item não tem preço na moeda", () => {
        const prices = new Map([
            ["a", { amount: 289, currency: "BRL" as const, isFallback: false }],
            ["b", { amount: 20, currency: "EUR" as const, isFallback: true }],
        ])
        expect(cartCurrencyFor(prices, "BRL")).toEqual({ currency: "EUR", fellBack: true })
    })

    it("carrinho vazio fica na moeda pedida", () => {
        expect(cartCurrencyFor(new Map(), "USD")).toEqual({ currency: "USD", fellBack: false })
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: FAIL, `cartCurrencyFor is not a function`.

- [ ] **Step 3: Implementar a regra**

Acrescentar ao final de `lib/marketplace/list-prices.ts`:

```ts
/**
 * Um carrinho com duas moedas não tem total. Se qualquer item não tem preço na
 * moeda escolhida, o carrinho inteiro cai para EUR — e quem chama avisa a
 * pessoa, porque o número na tela acabou de mudar sem ela ter pedido.
 */
export function cartCurrencyFor(
    prices: Map<string, ResolvedPrice>,
    wanted: Currency
): { currency: Currency; fellBack: boolean } {
    for (const price of prices.values()) {
        if (price.isFallback) {
            return { currency: DEFAULT_CURRENCY, fellBack: true }
        }
    }
    return { currency: wanted, fellBack: false }
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: PASS, 15 testes.

- [ ] **Step 5: Criar a server action**

Criar `actions/cart-prices.ts`:

```ts
"use server"

import { prisma } from "@/lib/prisma"
import { DEFAULT_CURRENCY, parseCurrency, type Currency } from "@/lib/currency"
import { resolveListPrices, cartCurrencyFor } from "@/lib/marketplace/list-prices"

export interface RepricedCart {
    currency: Currency
    fellBack: boolean
    prices: Record<string, number>
}

/**
 * Reprecifica o carrinho no servidor. O `localStorage` guarda preço só para a
 * tela não piscar; ele nunca é fonte de verdade — as rotas de checkout já
 * ignoram qualquer valor vindo do cliente.
 */
export async function resolveCartPrices(listIds: string[], currency: string): Promise<RepricedCart> {
    const wanted = parseCurrency(currency) ?? DEFAULT_CURRENCY
    const resolved = await resolveListPrices(prisma, listIds, wanted)
    const { currency: effective, fellBack } = cartCurrencyFor(resolved, wanted)

    // Na queda, TODOS os itens são relidos em euro de uma vez — inclusive os
    // que tinham preço na moeda pedida, que no primeiro mapa estão com o valor
    // na moeda errada para o total que vai ser exibido.
    const final = fellBack ? await resolveListPrices(prisma, listIds, DEFAULT_CURRENCY) : resolved

    const prices: Record<string, number> = {}
    for (const [listId, price] of final) {
        prices[listId] = price.amount
    }

    return { currency: effective, fellBack, prices }
}
```

- [ ] **Step 6: Ligar no contexto do carrinho**

Em `contexts/cart-context.tsx`, acrescentar ao `CartContextType`:

```ts
    currency: string
    repriceTo: (currency: string) => Promise<void>
```

E dentro do `CartProvider`, após `const [isOpen, setIsOpen] = useState(false)`:

```tsx
    const repriceTo = async (currency: string) => {
        const current = parseCartItems(getCartSnapshot())
        if (current.length === 0) return

        const result = await resolveCartPrices(current.map((i) => i.id), currency)

        writeCartItems(
            current.map((item) => ({
                ...item,
                price: result.prices[item.id] ?? item.price,
                currency: result.currency,
            }))
        )

        if (result.fellBack) {
            toast.info(tCart("currencyFellBack"))
        }
    }
```

Onde `tCart` vem de `useTranslations("cart")` (importar `useTranslations` de `next-intl`) e `resolveCartPrices` de `@/actions/cart-prices`. A moeda do carrinho passa a ser derivada dos itens, num único lugar:

```tsx
    const currency = items[0]?.currency ?? "EUR"
```

Expor `currency` e `repriceTo` no `value` do provider.

- [ ] **Step 7: Chamar na troca de moeda**

Em `components/marketplace/currency-switcher.tsx`, dentro de `switchTo`, entre `setCurrencyCookie` e `router.refresh()`:

```tsx
        await repriceTo(target)
```

Com `const { repriceTo } = useCart()` no topo do componente e o import de `@/contexts/cart-context`.

- [ ] **Step 8: Consumir a moeda única nas telas do carrinho**

Em `components/marketplace/cart-drawer.tsx`, trocar a linha 70 (`items[0]?.currency || "EUR"`) por `currency` vindo de `useCart()`, e passar o locale:

```tsx
                {formatCurrency(total, currency, locale)}
```

Fazer o mesmo em `app/[locale]/cart/page.tsx` nas linhas 113, 159 e 174 — usar `currency` do contexto e `useLocale()` para o terceiro parâmetro.

- [ ] **Step 9: Traduzir o aviso nos 7 idiomas**

Acrescentar a chave `currencyFellBack` ao namespace `cart`:

- `pt.json`: `"currencyFellBack": "Uma das listas do carrinho não tem preço nessa moeda. O carrinho voltou para euro."`
- `en.json`: `"currencyFellBack": "One of the lists in your cart has no price in that currency. The cart switched back to euros."`
- `de.json`: `"currencyFellBack": "Eine der Listen im Warenkorb hat keinen Preis in dieser Währung. Der Warenkorb wurde auf Euro zurückgestellt."`
- `es.json`: `"currencyFellBack": "Una de las listas del carrito no tiene precio en esa moneda. El carrito volvió a euros."`
- `fr.json`: `"currencyFellBack": "L'une des listes du panier n'a pas de prix dans cette devise. Le panier est revenu à l'euro."`
- `it.json`: `"currencyFellBack": "Una delle liste nel carrello non ha un prezzo in questa valuta. Il carrello è tornato all'euro."`
- `nl.json`: `"currencyFellBack": "Een van de lijsten in je winkelwagen heeft geen prijs in die valuta. De winkelwagen staat weer in euro's."`

- [ ] **Step 10: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint $(git diff --name-only HEAD | grep -E "\.(ts|tsx)$")
```

Esperado: exit 0 nos três.

- [ ] **Step 11: Commit**

```bash
git add actions/cart-prices.ts contexts/cart-context.tsx components/marketplace/ app/\[locale\]/cart/page.tsx messages/ lib/marketplace/list-prices.ts lib/marketplace/list-prices.test.ts
git commit -m "feat(carrinho): recalcula precos na troca de moeda, com queda para EUR"
```

---

### Task 8: Checkout nos dois provedores

**Files:**
- Modify: `app/api/checkout/create-order/route.ts:14-19,64-97`, `app/api/checkout/stripe/create-session/route.ts:14-19,68-100`, `components/checkout/paypal-buttons.tsx:13-15,65,82`, `components/checkout/stripe-checkout-button.tsx:13-15,43`, `app/[locale]/checkout/page.tsx:53,113,116`

**Interfaces:**
- Consumes: `parseCurrency`, `SUPPORTED_CURRENCIES`, `resolveListPrices`.
- Produces: as duas rotas passam a aceitar `{ items, currency }` no corpo; `PayPalButtonsWrapper` e `StripeCheckoutButton` ganham a prop `currency: string`.

- [ ] **Step 1: Aceitar e validar a moeda no PayPal**

Em `app/api/checkout/create-order/route.ts`, no schema (linha 14-19), acrescentar:

```ts
const createOrderSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
        quantity: z.number().int().positive().max(99).default(1),
    })).min(1).max(50),
    // O cliente envia o CÓDIGO da moeda, nunca um valor. O preço sai do banco.
    currency: z.enum(SUPPORTED_CURRENCIES),
})
```

Importar `SUPPORTED_CURRENCIES` de `@/lib/currency` e `resolveListPrices` de `@/lib/marketplace/list-prices`.

- [ ] **Step 2: Resolver o preço pela tabela nova**

Substituir o bloco de cálculo (o `const currencies = new Set(...)` e o `purchaseItems`/`subtotal` que o seguem) por:

```ts
        const currency = parsedBody.data.currency
        const prices = await resolveListPrices(prisma, listIds, currency)

        // Fallback é comportamento de VITRINE. No checkout, exibir euro e
        // cobrar euro depois de a pessoa ter escolhido real seria cobrar
        // diferente do combinado — então aqui é erro, não queda silenciosa.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== currency)
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in the selected currency" },
                { status: 400 }
            )
        }

        let subtotal = 0
        const purchaseItems = lists.map((list) => {
            const quantity = items.find((item) => item.listId === list.id)?.quantity ?? 1
            const unitPrice = prices.get(list.id)!.amount
            subtotal += unitPrice * quantity

            return {
                listId: list.id,
                name: list.name,
                price: unitPrice,
                quantity,
                leadsCount: list.totalLeads,
            }
        })

        const total = subtotal.toFixed(2)
```

Remover a verificação antiga de `currencies.size !== 1`: ela existia porque cada lista carregava sua própria moeda. Agora a moeda é uma só por definição — vem do corpo da requisição e é validada contra `SUPPORTED_CURRENCIES`.

Confira que o resto da rota (montagem do `order`, criação do `Purchase`) usa `currency` e `purchaseItems[].price` — os nomes não mudaram.

- [ ] **Step 3: Repetir no Stripe**

Aplicar exatamente as mesmas duas mudanças em `app/api/checkout/stripe/create-session/route.ts` (schema na linha 14-19, bloco de cálculo a partir da linha 78). A rota já converte para centavos com `toStripeAmount(item.price)` e para minúsculas com `currency.toLowerCase()` — nada disso muda.

- [ ] **Step 4: Enviar a moeda a partir dos botões**

Em `components/checkout/paypal-buttons.tsx`:

```tsx
interface PayPalButtonsWrapperProps {
    items: Array<{ listId: string; quantity: number }>
    currency: string
}
```

Trocar a linha 65 (`currency: "EUR"` fixo no `PayPalScriptProvider`) por `currency,` e o corpo do `fetch` (linha 82) por:

```tsx
                            body: JSON.stringify({ items, currency }),
```

O `currency` fixo era divergência latente: o SDK carregava em euro enquanto o pedido era montado na moeda da lista. Inofensivo enquanto tudo era EUR, quebrado no primeiro preço em real.

Em `components/checkout/stripe-checkout-button.tsx`, acrescentar a mesma prop `currency: string` e trocar o corpo do fetch (linha 43) por `JSON.stringify({ items, currency })`.

- [ ] **Step 5: Passar a moeda na página de checkout**

Em `app/[locale]/checkout/page.tsx`, trocar a linha 53 por:

```tsx
    const { items, total, currency } = useCart()
```

(removendo o `const currency = items[0]?.currency || "EUR"`), e passar a prop nos dois botões (linhas 113 e 116):

```tsx
                                    <StripeCheckoutButton items={paypalItems} currency={currency} />
...
                                        <PayPalButtonsWrapper items={paypalItems} currency={currency} />
```

Passar também o locale às duas chamadas de `formatCurrency` (linhas 169 e 185), usando `useLocale()` de `next-intl`.

- [ ] **Step 6: Verificar que nenhuma moeda ficou fixa no checkout**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && grep -rn 'currency: "EUR"' components/checkout/ app/api/checkout/
```

Esperado: nenhuma saída.

- [ ] **Step 7: Verificar compilação e testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run
```

Esperado: exit 0. `lib/checkout/fulfillment.test.ts` continua passando sem alteração — `amountMatches` já compara valor **e** moeda, e é ele que impede uma captura de 45 BRL fechar uma compra de 45 EUR.

- [ ] **Step 8: Commit**

```bash
git add app/api/checkout/ components/checkout/ app/\[locale\]/checkout/page.tsx
git commit -m "feat(checkout): cobra na moeda escolhida nos dois provedores"
```

---

### Task 9: Cadastro dos três preços no admin

**Files:**
- Modify: `actions/admin/lists.ts:14-45,100-175`, `components/admin/list-form.tsx:71,120,163,655-670`

**Interfaces:**
- Consumes: `writeListPrices`, `SUPPORTED_CURRENCIES`.
- Produces: `CreateListData` troca `price: number; currency: string` por `prices: { EUR: number; BRL?: number; USD?: number }`.

- [ ] **Step 1: Trocar o contrato da action**

Em `actions/admin/lists.ts`, na interface `CreateListData` e no `listDataSchema`, remover `price` e `currency` e acrescentar:

```ts
    prices: {
        EUR: number
        BRL?: number
        USD?: number
    }
```

```ts
    // A lista não tem mais UMA moeda: tem um preço por moeda oferecida.
    // EUR é obrigatório — é a moeda de referência e o fallback da vitrine.
    prices: z.object({
        EUR: z.number().finite().positive().max(999999),
        BRL: z.number().finite().positive().max(999999).optional(),
        USD: z.number().finite().positive().max(999999).optional(),
    }),
```

- [ ] **Step 2: Gravar pelo caminho único**

Em `createList`, trocar `price: validated.price, currency: validated.currency` no `data` do `prisma.leadList.create` por `price: validated.prices.EUR, currency: "EUR"`, e logo após a criação, antes do `revalidateListPaths`:

```ts
    await writeListPrices(prisma, list.id, validated.prices)
```

Em `updateList`, remover `price` e `currency` do `data` do `prisma.leadList.update` (o espelho é gravado por `writeListPrices`) e acrescentar, logo após o update:

```ts
    await writeListPrices(prisma, list.id, validated.prices)
```

Importar `writeListPrices` de `@/lib/marketplace/list-prices`.

- [ ] **Step 3: Trocar os campos do formulário**

Em `components/admin/list-form.tsx`:
- no tipo da linha 71, trocar `currency: string` por `prices: { EUR: number; BRL?: number; USD?: number }`;
- no schema zod (linha 120), trocar `currency: z.string().default("EUR")` pelos três campos;
- no `defaultValues` (linha 163), trocar `currency: list?.currency || "EUR"` por `prices: { EUR: list?.prices?.EUR ?? 0, BRL: list?.prices?.BRL, USD: list?.prices?.USD }`;
- remover o `Select` de moeda (linhas ~655-670) e pôr, no lugar, três campos numéricos rotulados `Preço (EUR) *`, `Preço (BRL)` e `Preço (USD)`, com uma nota abaixo: *"BRL e USD são opcionais. Sem eles, quem escolher essa moeda vê o preço em euro."*

A action que carrega a lista para edição precisa devolver os preços; inclua `prices: { select: { currency: true, amount: true } }` no `findUnique` que alimenta o form e converta para o objeto `{ EUR, BRL, USD }` no `serializeList`.

- [ ] **Step 4: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint $(git diff --name-only HEAD | grep -E "\.(ts|tsx)$")
```

Esperado: exit 0 nos três.

- [ ] **Step 5: Verificar na tela**

Com o dev server no ar, editar uma lista em `/super-admin/marketplace/lists`, preencher os três preços e salvar. Conferir no banco:

```sql
select currency, amount from lead_list_prices where "listId" = '<id da lista editada>' order by currency;
```

Esperado: três linhas, com os valores digitados. E `select price, currency from lead_lists where id = '<id>'` mostrando o valor em EUR.

- [ ] **Step 6: Commit**

```bash
git add actions/admin/lists.ts components/admin/list-form.tsx
git commit -m "feat(admin): cadastro de preco por moeda na lista"
```

---

### Task 10: Gerador em massa de preços

**Files:**
- Create: `actions/admin/list-prices-bulk.ts`
- Modify: `app/(app)/super-admin/marketplace/lists/page.tsx`
- Test: `lib/marketplace/list-prices.test.ts` (acrescentar bloco)

**Interfaces:**
- Consumes: `writeListPrices`, `recordAudit`, `checkAdminRateLimit`, `requireAdmin`.
- Produces: `roundCommercial(value: number, currency: Currency): number` em `lib/marketplace/list-prices.ts`; `seedPricesFromRate(currency: string, rate: number): Promise<{ updated: number }>`.

- [ ] **Step 1: Escrever o teste do arredondamento**

Acrescentar ao final de `lib/marketplace/list-prices.test.ts`:

```ts
import { roundCommercial } from "./list-prices"

describe("roundCommercial", () => {
    it("real arredonda para o 9 acima da dezena", () => {
        expect(roundCommercial(232.5, "BRL")).toBe(239)
        expect(roundCommercial(240, "BRL")).toBe(249)
    })

    it("dólar e euro arredondam para o 9 acima da unidade", () => {
        expect(roundCommercial(46.2, "USD")).toBe(49)
        expect(roundCommercial(21.4, "EUR")).toBe(29)
    })

    it("nunca devolve valor menor que a entrada", () => {
        expect(roundCommercial(289, "BRL")).toBeGreaterThanOrEqual(289)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: FAIL, `roundCommercial is not a function`.

- [ ] **Step 3: Implementar**

Acrescentar a `lib/marketplace/list-prices.ts`:

```ts
/**
 * Arredondamento comercial: sobe até o próximo valor terminado em 9. Nunca
 * arredonda para baixo — o preço convertido é um piso, não um alvo.
 *
 * Real usa passo de 10 porque os valores são uma ordem de grandeza maiores
 * (€45 ≈ R$289): terminar em 9 na unidade não muda nada perceptível ali.
 */
export function roundCommercial(value: number, currency: Currency): number {
    const step = currency === "BRL" ? 10 : 1
    return Math.ceil((value + 1) / step) * step - 1
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/marketplace/list-prices.test.ts
```

Esperado: PASS, 18 testes.

- [ ] **Step 5: Escrever a action**

Criar `actions/admin/list-prices-bulk.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { checkAdminRateLimit } from "@/lib/rate-limit"
import { parseCurrency, DEFAULT_CURRENCY } from "@/lib/currency"
import { roundCommercial } from "@/lib/marketplace/list-prices"

/**
 * Semeia preços numa moeda a partir de uma taxa digitada pelo admin.
 *
 * A taxa serve para SEMEAR e desaparece: o valor gravado é fixo, editável, e
 * nenhuma tela volta a consultá-la. Não sobrescreve preço existente — rodar
 * duas vezes com taxas diferentes não desfaz um ajuste feito à mão.
 */
export async function seedPricesFromRate(
    currency: string,
    rate: number
): Promise<{ updated: number }> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("list.prices.seed", admin.id, 5, 60_000)

    const target = parseCurrency(currency)
    if (!target || target === DEFAULT_CURRENCY) {
        throw new Error("Escolha BRL ou USD: o preço em euro é o de referência, não é gerado.")
    }
    if (!(rate > 0) || rate > 1000) {
        throw new Error("Taxa inválida.")
    }

    const semPreco = await prisma.leadList.findMany({
        where: { prices: { none: { currency: target } } },
        select: { id: true, prices: { where: { currency: DEFAULT_CURRENCY }, select: { amount: true } } },
    })

    let updated = 0
    for (const list of semPreco) {
        const euro = list.prices[0]
        if (!euro) continue

        await prisma.leadListPrice.create({
            data: {
                listId: list.id,
                currency: target,
                amount: roundCommercial(Number(euro.amount) * rate, target),
            },
        })
        updated += 1
    }

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "list.prices.seed",
        // A operação é em lote: o alvo é o conjunto de listas, não uma lista.
        // `targetType: "list"` é o mesmo valor usado por list.deleted e
        // list.reviewed em actions/admin/lists.ts.
        targetType: "list",
        targetId: `bulk:${target}`,
        metadata: { currency: target, rate, updated },
    })

    revalidatePath("/super-admin/marketplace/lists")
    revalidatePath("/catalog")

    return { updated }
}
```

`AuditAction` é um union fechado em `lib/audit.ts:5-15`. Acrescentar a entrada nova à lista, junto das demais de lista:

```ts
    | "list.prices.seed"
```

- [ ] **Step 6: Ligar na tela**

Criar `components/admin/seed-prices-dialog.tsx` e montá-lo na barra de ações de `app/(app)/super-admin/marketplace/lists/page.tsx`, ao lado dos botões já existentes:

```tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
import { seedPricesFromRate } from "@/actions/admin/list-prices-bulk"
import { roundCommercial } from "@/lib/marketplace/list-prices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function SeedPricesDialog() {
    const [open, setOpen] = useState(false)
    const [currency, setCurrency] = useState<"BRL" | "USD">("BRL")
    const [rate, setRate] = useState("6.40")
    const [isSaving, setIsSaving] = useState(false)

    const parsedRate = Number(rate)
    // Exemplo vivo com um preço típico do catálogo (as listas vão de 20 a 70).
    const exemplo = parsedRate > 0 ? roundCommercial(45 * parsedRate, currency) : null

    async function handleSubmit() {
        setIsSaving(true)
        try {
            const { updated } = await seedPricesFromRate(currency, parsedRate)
            toast.success(`${updated} lista(s) ganharam preço em ${currency}.`)
            setOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao gerar preços.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Gerar preços</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerar preços a partir de uma taxa</DialogTitle>
                    <DialogDescription>
                        A taxa serve só para semear: o valor gravado é fixo e editável depois.
                        Listas que já têm preço nessa moeda não são alteradas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Moeda</Label>
                        <div className="flex gap-2">
                            {(["BRL", "USD"] as const).map((c) => (
                                <Button
                                    key={c}
                                    type="button"
                                    variant={currency === c ? "default" : "outline"}
                                    onClick={() => setCurrency(c)}
                                >
                                    {c}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rate">Taxa (1 EUR = ?)</Label>
                        <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        />
                    </div>

                    {exemplo !== null && (
                        <p className="text-sm text-muted-foreground">
                            Exemplo: uma lista de € 45,00 fica em {currency === "BRL" ? "R$" : "US$"}{" "}
                            {exemplo},00
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSaving || !(parsedRate > 0)}>
                        {isSaving ? "Gerando..." : "Gerar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
```

O super-admin não passa por next-intl nesta tela (ver `CRM-U3`, pendente), então os textos ficam em português, como o resto da área.

- [ ] **Step 7: Verificar a idempotência**

Com o dev server no ar, rodar o gerador em BRL com taxa 6,4 e conferir o número de listas afetadas. Rodar de novo, com taxa 7,0:

```sql
select count(*) from lead_list_prices where currency = 'BRL';
select action, metadata from audit_logs where action = 'list.prices.seed' order by "createdAt" desc limit 2;
```

Esperado: a segunda execução devolve `updated = 0`, a contagem de linhas BRL não muda, e as duas execuções aparecem no log de auditoria.

- [ ] **Step 8: Commit**

```bash
git add actions/admin/list-prices-bulk.ts components/admin/seed-prices-dialog.tsx app/\(app\)/super-admin/marketplace/lists/page.tsx lib/audit.ts lib/marketplace/list-prices.ts lib/marketplace/list-prices.test.ts
git commit -m "feat(admin): gerador em massa de precos por taxa, sem sobrescrever"
```

---

### Task 11: Corrigir o que multi-moeda transforma em falsidade

Três lugares que hoje são inofensivos porque só existe euro.

**Files:**
- Modify: `app/[locale]/my-purchases/page.tsx:95,157,205-225`, `lib/seo/schema.ts:67-106`, `app/[locale]/list/[slug]/page.tsx` (chamada de `buildProductSchema`)
- Test: `lib/seo/schema.test.ts` (acrescentar bloco; criar o arquivo se não existir)

**Interfaces:**
- Consumes: `ProductSchemaInput`.
- Produces: `ProductSchemaInput` troca `price: number; currency: string` por `offers: Array<{ price: number; currency: string }>`.

- [ ] **Step 1: Escrever o teste do schema**

Acrescentar a `lib/seo/schema.test.ts`:

```ts
describe("buildProductSchema com várias moedas", () => {
    const input = {
        name: "Importadores de alimentos — Alemanha",
        slug: "importadores-alimentos-alemanha",
        description: null,
        offers: [
            { price: 45, currency: "EUR" },
            { price: 289, currency: "BRL" },
        ],
        isActive: true,
        locale: "pt",
    }

    it("emite um Offer por moeda cadastrada", () => {
        const schema = buildProductSchema(input) as { offers: Array<Record<string, unknown>> }
        expect(schema.offers).toHaveLength(2)
        expect(schema.offers.map((o) => o.priceCurrency)).toEqual(["EUR", "BRL"])
    })

    it("mantém o preço como texto com duas casas", () => {
        const schema = buildProductSchema(input) as { offers: Array<Record<string, unknown>> }
        expect(schema.offers[0].price).toBe("45.00")
    })

    it("uma moeda só continua saindo como lista de um item", () => {
        const schema = buildProductSchema({ ...input, offers: [{ price: 45, currency: "EUR" }] }) as {
            offers: Array<Record<string, unknown>>
        }
        expect(schema.offers).toHaveLength(1)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/seo/schema.test.ts
```

Esperado: FAIL — `offers` é objeto, não array.

- [ ] **Step 3: Implementar**

Em `lib/seo/schema.ts`, trocar `price: number; currency: string` em `ProductSchemaInput` por:

```ts
    offers: Array<{ price: number; currency: string }>
```

E o bloco `offers` de `buildProductSchema` por:

```ts
        // Um Offer por moeda cadastrada. O crawler não tem cookie de moeda:
        // emitir só euro enquanto a página é renderizada em real seria dado
        // estruturado amplificando divergência — exatamente o que este projeto
        // decidiu não fazer.
        offers: input.offers.map((offer) => ({
            "@type": "Offer",
            price: Number(offer.price).toFixed(2),
            priceCurrency: offer.currency,
            availability: input.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
            seller: { "@id": ORGANIZATION_ID },
        })),
```

- [ ] **Step 4: Atualizar a chamada**

Em `app/[locale]/list/[slug]/page.tsx`, a chamada de `buildProductSchema` passa a receber as linhas já buscadas na Task 6:

```tsx
        offers: priceRows.length > 0
            ? priceRows.map((row) => ({ price: Number(row.amount), currency: row.currency }))
            : [{ price: Number(list.price), currency: list.currency }],
```

- [ ] **Step 5: Total por moeda em `/my-purchases`**

Substituir `getPurchaseStats` (linhas ~205-225) para acumular o gasto por moeda:

```tsx
function getPurchaseStats(purchases: UserPurchase[]) {
    return purchases.reduce(
        (stats, purchase) => {
            stats.totalPurchases += 1
            stats.totalLists += purchase.items.length
            stats.totalLeads += purchase.items.reduce((sum, item) => sum + item.list.totalLeads, 0)
            // Somar EUR com BRL num número só produz um valor que não existe.
            stats.spentByCurrency[purchase.currency] =
                (stats.spentByCurrency[purchase.currency] ?? 0) + purchase.total
            return stats
        },
        {
            totalPurchases: 0,
            totalLists: 0,
            totalLeads: 0,
            spentByCurrency: {} as Record<string, number>,
        }
    )
}
```

Remover `const currency = purchases[0]?.currency || "EUR"` (linha 95) e trocar o `StatCard` do gasto (linha 157) por:

```tsx
                            value={Object.entries(stats.spentByCurrency)
                                .map(([currency, amount]) => formatCurrency(amount, currency, locale))
                                .join(" + ")}
```

Com `locale` vindo dos `params` da página.

- [ ] **Step 6: Verificar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npx eslint $(git diff --name-only HEAD | grep -E "\.(ts|tsx)$")
```

Esperado: exit 0 nos três.

- [ ] **Step 7: Commit**

```bash
git add lib/seo/schema.ts lib/seo/schema.test.ts app/\[locale\]/my-purchases/page.tsx app/\[locale\]/list/\[slug\]/page.tsx
git commit -m "fix(multimoeda): total por moeda, schema com um Offer por moeda"
```

---

### Task 12: Script de integridade e verificação final

**Files:**
- Create: `prisma/check-precos.ts`
- Modify: `package.json` (script `check:precos`)

**Interfaces:**
- Consumes: `DEFAULT_CURRENCY`.
- Produces: comando `npm run check:precos`.

**Por que script e não teste:** nenhum dos testes deste repositório abre conexão com o banco — `lib/rate-limit.test.ts` e `lib/exports/purchase-export.test.ts` mockam `@/lib/prisma` explicitamente, e o vitest não carrega `.env`. Um teste que conectasse ao Supabase levaria a suite inteira ao banco de produção a cada execução e quebraria em qualquer ambiente sem `DATABASE_URL`. A verificação é de **dados**, não de lógica, então ela vive fora da suite. Decisão do Werner em 2026-07-30.

- [ ] **Step 1: Escrever o script**

Criar `prisma/check-precos.ts`:

```ts
/**
 * Integridade dos preços do catálogo. Roda com `npm run check:precos`.
 *
 * Duas invariantes que a vitrine não consegue defender sozinha:
 *
 * 1. Toda lista ativa tem preço em EUR. A vitrine cai para euro quando falta
 *    preço na moeda escolhida; se faltar o euro também, não há para onde cair
 *    e a lista aparece sem preço.
 * 2. `LeadList.price` bate com a linha em EUR de `LeadListPrice`. O preço em
 *    euro vive em dois lugares, e este é o alarme de eles terem divergido.
 *
 * Fica fora do vitest de propósito: nenhum teste deste projeto toca o banco.
 */
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"

config()

const DEFAULT_CURRENCY = "EUR"
const prisma = new PrismaClient()

async function main() {
    const semEuro = await prisma.leadList.findMany({
        where: { isActive: true, prices: { none: { currency: DEFAULT_CURRENCY } } },
        select: { slug: true },
    })

    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        select: {
            slug: true,
            price: true,
            prices: { where: { currency: DEFAULT_CURRENCY }, select: { amount: true } },
        },
    })

    const divergentes = lists
        .filter((l) => l.prices[0] && Number(l.prices[0].amount) !== Number(l.price))
        .map((l) => l.slug)

    let falhou = false

    if (semEuro.length > 0) {
        falhou = true
        console.error(`✖ ${semEuro.length} lista(s) ativa(s) sem preço em EUR:`)
        for (const l of semEuro) console.error(`   - ${l.slug}`)
        console.error("  Corrija pelo formulário do admin, NUNCA por SQL direto: o caminho")
        console.error("  único de escrita existe justamente para os dois espelhos não divergirem.")
    } else {
        console.log(`✓ ${lists.length} lista(s) ativa(s), todas com preço em EUR`)
    }

    if (divergentes.length > 0) {
        falhou = true
        console.error(`✖ ${divergentes.length} lista(s) com LeadList.price divergindo da linha EUR:`)
        for (const slug of divergentes) console.error(`   - ${slug}`)
    } else {
        console.log("✓ LeadList.price bate com a linha em EUR em todas as listas ativas")
    }

    await prisma.$disconnect()
    process.exit(falhou ? 1 : 0)
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
```

- [ ] **Step 2: Registrar o comando**

Em `package.json`, ao lado de `seed:templates` (que já usa o mesmo `tsconfig.seed.json`):

```json
    "check:precos": "npx ts-node --project tsconfig.seed.json prisma/check-precos.ts",
```

- [ ] **Step 3: Rodar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm run check:precos
```

Esperado: exit 0, com as duas linhas `✓`. Se sair `✖` listando slugs, essas listas precisam de preço em EUR pelo formulário do admin.

Se o script não conseguir conectar (falta `DATABASE_URL` no `.env`), pare e relate ao usuário — não enfraqueça a verificação para ela "passar".

- [ ] **Step 3: Suite completa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npx vitest run && npm run build && npx eslint $(git diff --name-only main...HEAD | grep -E "\.(ts|tsx)$")
```

Esperado: exit 0 nos quatro.

- [ ] **Step 4: Percorrer a lista de aceite da spec**

Abrir `docs/superpowers/specs/2026-07-30-fase2b-multimoeda-design.md` e marcar item a item a seção "Verificação de aceite". Os itens de tela (troca de moeda no header, fallback em €, queda do carrinho, compra em BRL ponta a ponta no Stripe) exigem o dev server e um navegador real — o browser embutido não executa o swap de Suspense do Next 16. Relate ao usuário quais itens dependem dele para verificar.

- [ ] **Step 5: Commit**

```bash
git add prisma/check-precos.ts package.json
git commit -m "chore(multimoeda): script de integridade dos precos em EUR"
```

---

## Notas para quem executa

- **Ordem importa.** Tasks 1-3 são fundação sem efeito visível; a Task 6 é a primeira em que algo muda na tela. Não pule para a 6 antes de a 3 passar.
- **Nada de `prisma migrate dev`.** Ver Task 2, Step 3.
- **Nunca suba o dev server pelo Bash.** Use o `.claude/launch.json` (porta 3001).
- **Nenhuma cotação de câmbio é consultada em runtime, em nenhuma tarefa.** Se em algum momento parecer que buscar uma taxa resolveria o problema, é sinal de que a tarefa foi entendida errada — pare e pergunte.
