# Paddle como Provedor Internacional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que compradores fora do Brasil paguem em EUR ou USD via Paddle, enquanto o Mercado Pago continua atendendo o carrinho em BRL com Pix.

**Architecture:** Quarto provedor no caminho que PayPal, Stripe e Mercado Pago já ocupam — cliente fino, rota de criação, rota de confirmação e webhook. Duas diferenças estruturais: o Paddle usa *overlay* (o comprador não sai do site, não há página de retorno) e é Merchant of Record (cobra o IVA, o que obriga preço tax-inclusive). A correlação é pelo **nosso** `purchase.id`, enviado em `custom_data`, exatamente como no Mercado Pago.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 6 + PostgreSQL (Supabase), zod 4, vitest 4, next-intl 4.

**Spec:** `docs/superpowers/specs/2026-08-05-paddle-provedor-internacional-design.md`

## Global Constraints

- **Roteamento por moeda:** carrinho `BRL` → Mercado Pago; carrinho `EUR`/`USD` → Paddle. **Imposto nos dois lados** — a tela escolhe o botão E as rotas do servidor recusam a moeda errada com 400.
- **Preço tax-inclusive obrigatório** (`tax_mode: "internal"` na price não-catálogo). Com tax-exclusive o `grand_total` volta como preço + IVA e `amountMatches` reprova toda compra internacional.
- **Preço nunca vem do cliente.** Sai sempre de `resolveListPrices` no servidor.
- **Corpo do webhook lido CRU** (`await request.text()`), nunca `request.json()` antes de verificar. Qualquer reformatação quebra a assinatura HMAC.
- **Toda verificação de assinatura é fail-closed:** sem secret ou assinatura inválida → 401 sem processar.
- **Nenhum teste toca o banco.** Função pura ou `db` injetado por parâmetro com mock (`lib/checkout/fulfillment.test.ts`).
- **Migrations Prisma rodam sem shadow database** neste projeto.
- **Comentários e mensagens de commit em português**, no estilo dos arquivos existentes: o comentário explica *por que*, não *o que*.
- **Indentação: 4 espaços. Sem ponto e vírgula** no fim das linhas.
- **Nunca marcar `failed` uma compra já `paid`.**
- Base da API: `https://api.paddle.com` (produção) e `https://sandbox-api.paddle.com` (sandbox), escolhida por `NEXT_PUBLIC_PADDLE_ENV`.
- Textos de UI existem em 7 idiomas: `messages/{pt,en,de,fr,es,it,nl}.json`. Chave nova entra nos 7.
- Textos legais existem em 7 idiomas: `content/legal/{terms,privacy}.{pt,en,de,fr,es,it,nl}.ts`.
- **Node não está no PATH por padrão.** Antes de qualquer `npm`/`npx`, no Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Linha de base da suíte: 69 arquivos, 628 testes passando.**
- **`npm run lint` com exit 0 é inatingível** (2378 erros pré-existentes). O critério é **zero problema novo nos arquivos tocados**, com `npx eslint <arquivos>`.
- **Nunca usar `git add <diretório>`** — o Werner edita em paralelo. Sempre listar os arquivos explicitamente.
- **Dev server só pelo preview (`.claude/launch.json`), porta 3001, nunca pelo Bash.** `npm run build` exige o dev server parado no Windows (o Prisma falha com `EPERM ... query_engine-windows.dll.node`).

---

### Task 1: Páginas legais nos 7 idiomas

**Vem primeiro de propósito.** A aprovação do Paddle depende dessas páginas estarem no ar, leva dias e pode ser recusada. Nenhum código de pagamento adianta se a conta não for liberada.

**Files:**
- Modify: `content/legal/terms.pt.ts:46` e os equivalentes em `terms.{en,de,fr,es,it,nl}.ts`
- Modify: `content/legal/privacy.pt.ts:23`, `:62` e os equivalentes em `privacy.{en,de,fr,es,it,nl}.ts`

**Interfaces:**
- Consumes: nada (primeira task).
- Produces: nada consumido por outras tasks. A estrutura `LegalDocument` (`content/legal/types.ts`) não muda.

- [ ] **Step 1: Localizar as três menções em cada idioma**

Run: `npx tsc --noEmit` não ajuda aqui. Use:

```bash
grep -rn -i 'stripe' content/legal/
```

Expected: três ocorrências por idioma — uma em `terms.*` (processamento e reembolso) e duas em `privacy.*` (dados de pagamento, lista de operadores).

- [ ] **Step 2: Substituir o parágrafo de pagamento e reembolso em `terms.*`**

Em `content/legal/terms.pt.ts`, trocar o bloco da linha 46 por:

```ts
                { kind: "paragrafo", texto: "Compras em reais são processadas pelo Mercado Pago. Compras em euro ou dólar são processadas pelo Paddle, que atua como vendedor registrado (Merchant of Record) da transação e é o responsável pelo recolhimento dos impostos aplicáveis, incluindo o IVA na União Europeia. Nesses casos, a cobrança aparece no extrato em nome do Paddle." },
                { kind: "paragrafo", texto: "Reembolsos podem ser solicitados em até 14 dias após a compra, desde que o arquivo não tenha sido baixado. Escreva para contato@easyprospect.com.br. Compras processadas pelo Paddle são reembolsadas por ele, após a nossa autorização." },
```

Os mesmos dois parágrafos, traduzidos, nos outros seis arquivos:

| arquivo | texto |
|---|---|
| `terms.en.ts` | "Purchases in Brazilian reais are processed by Mercado Pago. Purchases in euros or US dollars are processed by Paddle, which acts as Merchant of Record for the transaction and is responsible for collecting applicable taxes, including EU VAT. In those cases the charge appears on your statement under Paddle's name." / "Refunds may be requested within 14 days of purchase, provided the file has not been downloaded. Write to contato@easyprospect.com.br. Purchases processed by Paddle are refunded by Paddle, following our authorisation." |
| `terms.de.ts` | "Käufe in brasilianischen Real werden über Mercado Pago abgewickelt. Käufe in Euro oder US-Dollar werden über Paddle abgewickelt, das als Merchant of Record der Transaktion auftritt und für die Abführung der anfallenden Steuern einschließlich der EU-Mehrwertsteuer verantwortlich ist. In diesen Fällen erscheint die Abbuchung auf Ihrem Kontoauszug unter dem Namen Paddle." / "Rückerstattungen können innerhalb von 14 Tagen nach dem Kauf beantragt werden, sofern die Datei nicht heruntergeladen wurde. Schreiben Sie an contato@easyprospect.com.br. Über Paddle abgewickelte Käufe werden nach unserer Freigabe von Paddle erstattet." |
| `terms.fr.ts` | "Les achats en réals brésiliens sont traités par Mercado Pago. Les achats en euros ou en dollars américains sont traités par Paddle, qui agit en tant que vendeur enregistré (Merchant of Record) de la transaction et est responsable de la collecte des taxes applicables, y compris la TVA dans l'Union européenne. Dans ces cas, le débit apparaît sur votre relevé au nom de Paddle." / "Les remboursements peuvent être demandés dans les 14 jours suivant l'achat, à condition que le fichier n'ait pas été téléchargé. Écrivez à contato@easyprospect.com.br. Les achats traités par Paddle sont remboursés par Paddle, après notre autorisation." |
| `terms.es.ts` | "Las compras en reales brasileños son procesadas por Mercado Pago. Las compras en euros o dólares estadounidenses son procesadas por Paddle, que actúa como vendedor registrado (Merchant of Record) de la transacción y es responsable de recaudar los impuestos aplicables, incluido el IVA en la Unión Europea. En esos casos, el cargo aparece en el extracto a nombre de Paddle." / "Los reembolsos pueden solicitarse dentro de los 14 días posteriores a la compra, siempre que el archivo no haya sido descargado. Escriba a contato@easyprospect.com.br. Las compras procesadas por Paddle son reembolsadas por Paddle, tras nuestra autorización." |
| `terms.it.ts` | "Gli acquisti in real brasiliani sono elaborati da Mercado Pago. Gli acquisti in euro o dollari statunitensi sono elaborati da Paddle, che agisce come venditore registrato (Merchant of Record) della transazione ed è responsabile della riscossione delle imposte applicabili, inclusa l'IVA nell'Unione Europea. In questi casi l'addebito compare sull'estratto conto a nome di Paddle." / "I rimborsi possono essere richiesti entro 14 giorni dall'acquisto, a condizione che il file non sia stato scaricato. Scrivere a contato@easyprospect.com.br. Gli acquisti elaborati da Paddle sono rimborsati da Paddle, previa nostra autorizzazione." |
| `terms.nl.ts` | "Aankopen in Braziliaanse real worden verwerkt door Mercado Pago. Aankopen in euro of Amerikaanse dollar worden verwerkt door Paddle, dat optreedt als Merchant of Record van de transactie en verantwoordelijk is voor het innen van de toepasselijke belastingen, waaronder de btw in de Europese Unie. In die gevallen verschijnt de afschrijving op uw afschrift onder de naam Paddle." / "Terugbetalingen kunnen binnen 14 dagen na aankoop worden aangevraagd, mits het bestand niet is gedownload. Schrijf naar contato@easyprospect.com.br. Aankopen die door Paddle zijn verwerkt, worden door Paddle terugbetaald, na onze goedkeuring." |

- [ ] **Step 3: Substituir a linha de dados de pagamento em `privacy.*`**

Em `content/legal/privacy.pt.ts`, linha 23, trocar o item da lista por:

```ts
                    "Dados de pagamento: identificadores da transação no Mercado Pago ou no Paddle, conforme a moeda da compra. Não recebemos nem armazenamos números de cartão.",
```

Equivalentes:

| arquivo | texto |
|---|---|
| `privacy.en.ts` | "Payment data: transaction identifiers at Mercado Pago or Paddle, depending on the purchase currency. We neither receive nor store card numbers." |
| `privacy.de.ts` | "Zahlungsdaten: Transaktionskennungen bei Mercado Pago oder Paddle, je nach Kaufwährung. Wir erhalten und speichern keine Kartennummern." |
| `privacy.fr.ts` | "Données de paiement : identifiants de transaction chez Mercado Pago ou Paddle, selon la devise de l'achat. Nous ne recevons ni ne stockons de numéros de carte." |
| `privacy.es.ts` | "Datos de pago: identificadores de la transacción en Mercado Pago o Paddle, según la moneda de la compra. No recibimos ni almacenamos números de tarjeta." |
| `privacy.it.ts` | "Dati di pagamento: identificativi della transazione su Mercado Pago o Paddle, a seconda della valuta dell'acquisto. Non riceviamo né conserviamo numeri di carta." |
| `privacy.nl.ts` | "Betaalgegevens: transactie-identificatoren bij Mercado Pago of Paddle, afhankelijk van de valuta van de aankoop. Wij ontvangen noch bewaren kaartnummers." |

- [ ] **Step 4: Substituir a linha da lista de operadores em `privacy.*`**

Em `content/legal/privacy.pt.ts`, linha 62, trocar `"Stripe — processamento de pagamentos."` por **duas** linhas:

```ts
                    "Mercado Pago — processamento de pagamentos em reais.",
                    "Paddle — processamento de pagamentos em euro e dólar, na qualidade de vendedor registrado (Merchant of Record).",
```

Equivalentes:

| arquivo | textos |
|---|---|
| `privacy.en.ts` | "Mercado Pago — payment processing in Brazilian reais." / "Paddle — payment processing in euros and US dollars, acting as Merchant of Record." |
| `privacy.de.ts` | "Mercado Pago — Zahlungsabwicklung in brasilianischen Real." / "Paddle — Zahlungsabwicklung in Euro und US-Dollar, als Merchant of Record." |
| `privacy.fr.ts` | "Mercado Pago — traitement des paiements en réals brésiliens." / "Paddle — traitement des paiements en euros et en dollars américains, en qualité de Merchant of Record." |
| `privacy.es.ts` | "Mercado Pago — procesamiento de pagos en reales brasileños." / "Paddle — procesamiento de pagos en euros y dólares estadounidenses, en calidad de Merchant of Record." |
| `privacy.it.ts` | "Mercado Pago — elaborazione dei pagamenti in real brasiliani." / "Paddle — elaborazione dei pagamenti in euro e dollari statunitensi, in qualità di Merchant of Record." |
| `privacy.nl.ts` | "Mercado Pago — betalingsverwerking in Braziliaanse real." / "Paddle — betalingsverwerking in euro en Amerikaanse dollar, als Merchant of Record." |

- [ ] **Step 5: Atualizar a data de revisão nos 14 arquivos**

Em cada `terms.*.ts` e `privacy.*.ts`, trocar o campo `lastUpdated` para `"2026-08-05"`.

- [ ] **Step 6: Conferir que nenhuma menção sobrou**

Run: `grep -rn -i 'stripe\|paypal' content/legal/`
Expected: nenhuma saída.

- [ ] **Step 7: Verificar tipos e rodar a suíte**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm test`
Expected: PASS — 628 testes. (Há testes que leem os documentos legais; se algum verificar contagem de itens da lista de operadores, ele vai falhar porque uma linha virou duas. Nesse caso, ajustar a expectativa do teste para o número novo — a mudança é intencional.)

- [ ] **Step 8: Commit**

```bash
git add content/legal/terms.pt.ts content/legal/terms.en.ts content/legal/terms.de.ts content/legal/terms.fr.ts content/legal/terms.es.ts content/legal/terms.it.ts content/legal/terms.nl.ts
git add content/legal/privacy.pt.ts content/legal/privacy.en.ts content/legal/privacy.de.ts content/legal/privacy.fr.ts content/legal/privacy.es.ts content/legal/privacy.it.ts content/legal/privacy.nl.ts
git commit -m "docs(legal): Paddle como vendedor registrado e Mercado Pago como processador"
```

---

### Task 2: Cliente do Paddle

Módulo puro e testável: configuração, conversão de valor e verificação de assinatura. Sem dependência nova — `fetch` nativo e `node:crypto`, como em `lib/mercadopago.ts`.

**Files:**
- Create: `lib/paddle.ts`
- Create: `lib/paddle.test.ts`
- Modify: `lib/server-env.ts` (acrescentar getters ao final)
- Modify: `lib/env.ts:7` e final do arquivo (acrescentar as chaves públicas)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `isPaddleConfigured(): boolean`
  - `toPaddleAmount(value: number): string`
  - `fromPaddleAmount(minorUnits: string): string`
  - `verifyPaddleSignature(params: { signatureHeader: string | null; rawBody: string; secret: string }): boolean`
  - `createTransaction(input: CreateTransactionInput): Promise<{ id: string }>`
  - `getTransaction(transactionId: string): Promise<PaddleTransaction>`
  - `class PaddleApiError extends Error { status: number; path: string; body: string }`
  - `type CreateTransactionInput = { items: Array<{ name: string; description: string; quantity: number; unitPrice: number }>; currencyCode: string; purchaseId: string; customerEmail: string }`
  - `type PaddleTransaction = { id: string; status: string; grandTotal: string | null; currencyCode: string | null; purchaseId: string | null; customerEmail: string | null }`
  - `getPaddleServerConfig(): { apiKey: string }`
  - `getPaddleWebhookSecret(): string`
  - `getOptionalPublicPaddleClientToken(): string`
  - `getPublicPaddleEnv(): "sandbox" | "production"`

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/paddle.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest"
import { createHmac } from "node:crypto"
import {
    toPaddleAmount,
    fromPaddleAmount,
    verifyPaddleSignature,
    PaddleApiError,
    getTransaction,
} from "./paddle"

describe("toPaddleAmount", () => {
    it("converte decimal do domínio para unidade mínima em string", () => {
        expect(toPaddleAmount(45)).toBe("4500")
        expect(toPaddleAmount(289.9)).toBe("28990")
    })

    it("elimina ruído de ponto flutuante", () => {
        // 0.1 + 0.2 = 0.30000000000000004 em IEEE-754.
        expect(toPaddleAmount(0.1 + 0.2)).toBe("30")
    })

    it("arredonda para a unidade mínima mais próxima", () => {
        expect(toPaddleAmount(12.345)).toBe("1235")
        expect(toPaddleAmount(12.344)).toBe("1234")
    })
})

describe("fromPaddleAmount", () => {
    it("converte unidade mínima para o formato que amountMatches exige", () => {
        expect(fromPaddleAmount("4500")).toBe("45.00")
        expect(fromPaddleAmount("28990")).toBe("289.90")
    })

    it("zero vira 0.00", () => {
        expect(fromPaddleAmount("0")).toBe("0.00")
    })
})

const SECRET = "segredo-de-teste"

function assinar(rawBody: string, ts: string): string {
    return createHmac("sha256", SECRET).update(`${ts}:${rawBody}`).digest("hex")
}

describe("verifyPaddleSignature", () => {
    const CORPO = '{"event_type":"transaction.completed","data":{"id":"txn_1"}}'

    it("aceita assinatura válida", () => {
        const ts = "1785940000"
        const h1 = assinar(CORPO, ts)

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=${ts};h1=${h1}`,
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("rejeita quando o corpo foi reformatado", () => {
        // A razão de o webhook ler o corpo CRU: reserializar muda o byte a byte
        // e derruba a assinatura, sem mudar o significado do JSON.
        const ts = "1785940000"
        const h1 = assinar(CORPO, ts)
        const reformatado = JSON.stringify(JSON.parse(CORPO), null, 2)

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=${ts};h1=${h1}`,
                rawBody: reformatado,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita quando o ts foi adulterado", () => {
        const h1 = assinar(CORPO, "1785940000")

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=1785949999;h1=${h1}`,
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header ausente", () => {
        expect(
            verifyPaddleSignature({ signatureHeader: null, rawBody: CORPO, secret: SECRET })
        ).toBe(false)
    })

    it("rejeita header sem h1", () => {
        expect(
            verifyPaddleSignature({
                signatureHeader: "ts=1785940000",
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita h1 de tamanho diferente sem estourar", () => {
        // timingSafeEqual lança quando os buffers têm tamanhos diferentes —
        // a função precisa comparar tamanho antes.
        expect(
            verifyPaddleSignature({
                signatureHeader: "ts=1785940000;h1=abc",
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })
})

describe("PaddleApiError", () => {
    it("carrega o status HTTP, para o chamador distinguir permanente de transitório", () => {
        const erro = new PaddleApiError(404, "/transactions/txn_1", '{"error":"not_found"}')

        expect(erro).toBeInstanceOf(Error)
        expect(erro.status).toBe(404)
        expect(erro.message).toContain("404")
        expect(erro.message).toContain("/transactions/txn_1")
    })
})

describe("getTransaction", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    function responderCom(status: number, body: string) {
        vi.stubEnv("PADDLE_API_KEY", "chave-de-teste")
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: status >= 200 && status < 300,
                status,
                text: async () => body,
                json: async () => JSON.parse(body),
            })
        )
    }

    it("lança PaddleApiError com status 404 quando a transação não existe", async () => {
        responderCom(404, '{"error":{"code":"not_found"}}')

        await expect(getTransaction("txn_inexistente")).rejects.toMatchObject({
            name: "PaddleApiError",
            status: 404,
        })
    })

    it("devolve a transação normalizada, com o purchaseId vindo de custom_data", async () => {
        responderCom(
            200,
            JSON.stringify({
                data: {
                    id: "txn_1",
                    status: "completed",
                    currency_code: "EUR",
                    custom_data: { purchaseId: "compra-1" },
                    details: { totals: { grand_total: "4500" } },
                    customer: { email: "comprador@teste.com" },
                },
            })
        )

        await expect(getTransaction("txn_1")).resolves.toEqual({
            id: "txn_1",
            status: "completed",
            grandTotal: "4500",
            currencyCode: "EUR",
            purchaseId: "compra-1",
            customerEmail: "comprador@teste.com",
        })
    })

    it("não estoura quando custom_data e customer vêm ausentes", async () => {
        responderCom(
            200,
            JSON.stringify({
                data: { id: "txn_2", status: "ready", currency_code: "USD", details: { totals: {} } },
            })
        )

        await expect(getTransaction("txn_2")).resolves.toMatchObject({
            purchaseId: null,
            customerEmail: null,
            grandTotal: null,
        })
    })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- lib/paddle.test.ts`
Expected: FAIL — `Failed to resolve import "./paddle"`.

- [ ] **Step 3: Escrever `lib/paddle.ts`**

```ts
// lib/paddle.ts
//
// Cliente do Paddle e conversões de valor.
//
// Cliente fino sobre fetch, não o SDK oficial: são dois endpoints, e a mesma
// razão do Mercado Pago vale aqui — não vale acoplar o caminho do dinheiro a
// uma dependência a mais.
//
// O Paddle trabalha com a MENOR UNIDADE da moeda, como o Stripe, e a expressa
// como STRING (não número). A conversão aqui é de escala, e o resultado é
// string de propósito: é o que a API espera receber e devolve.

import { createHmac, timingSafeEqual } from "node:crypto"
import { getPaddleServerConfig } from "@/lib/server-env"
import { getPublicPaddleEnv } from "@/lib/env"

/** A presença da API key é o que habilita o provedor no servidor. */
export function isPaddleConfigured(): boolean {
    return Boolean(process.env.PADDLE_API_KEY)
}

function apiBase(): string {
    return getPublicPaddleEnv() === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com"
}

/** Decimal do domínio (45) → unidade mínima em string ("4500"). */
export function toPaddleAmount(value: number): string {
    return String(Math.round(value * 100))
}

/** Unidade mínima do Paddle ("4500") → string com 2 casas ("45.00"), formato que `amountMatches` exige. */
export function fromPaddleAmount(minorUnits: string): string {
    return (Number(minorUnits) / 100).toFixed(2)
}

/**
 * Verifica a assinatura do webhook.
 *
 * O header é `Paddle-Signature: ts=<unix>;h1=<hex>` e o manifesto é
 * `ts:corpo_cru`, com HMAC-SHA256.
 *
 * O `rawBody` precisa ser exatamente o que chegou na requisição. Reserializar
 * o JSON — mesmo sem mudar o significado — muda os bytes e derruba a
 * verificação.
 *
 * Pura de propósito: é a peça de segurança do fluxo e precisa ser testável sem
 * rede nem servidor.
 */
export function verifyPaddleSignature(params: {
    signatureHeader: string | null
    rawBody: string
    secret: string
}): boolean {
    const { signatureHeader, rawBody, secret } = params

    if (!signatureHeader) {
        return false
    }

    let ts: string | undefined
    let h1: string | undefined

    for (const part of signatureHeader.split(";")) {
        const separator = part.indexOf("=")
        if (separator === -1) continue

        const key = part.slice(0, separator).trim()
        const value = part.slice(separator + 1).trim()

        if (key === "ts") ts = value
        if (key === "h1") h1 = value
    }

    if (!ts || !h1) {
        return false
    }

    const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex")

    // timingSafeEqual lança quando os tamanhos diferem — comparar antes.
    if (expected.length !== h1.length) {
        return false
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(h1))
}

/**
 * Erro de uma chamada à API do Paddle, com o status HTTP preservado.
 *
 * Mesmo motivo do `MercadoPagoApiError`: o status separa falha permanente de
 * transitória, e é essa distinção que decide se o webhook pede reentrega.
 */
export class PaddleApiError extends Error {
    constructor(
        readonly status: number,
        readonly path: string,
        readonly body: string
    ) {
        super(`Paddle ${status} em ${path}: ${body}`)
        this.name = "PaddleApiError"
    }
}

export type CreateTransactionInput = {
    items: Array<{ name: string; description: string; quantity: number; unitPrice: number }>
    currencyCode: string
    /** Nosso purchase.id — é ele que amarra a transação ao pedido. */
    purchaseId: string
    customerEmail: string
}

export type PaddleTransaction = {
    id: string
    status: string
    grandTotal: string | null
    currencyCode: string | null
    purchaseId: string | null
    customerEmail: string | null
}

async function paddleFetch(path: string, init?: RequestInit): Promise<unknown> {
    const { apiKey } = getPaddleServerConfig()

    const response = await fetch(`${apiBase()}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    })

    if (!response.ok) {
        // O corpo do erro traz a causa (moeda inválida, tax_mode recusado). Sem
        // ele, todo problema de integração vira "500" sem pista.
        const body = await response.text()
        throw new PaddleApiError(response.status, path, body)
    }

    return response.json()
}

/**
 * Cria a transação com preços NÃO-CATÁLOGO.
 *
 * `tax_mode: "internal"` é a linha que faz o fluxo funcionar. Como Merchant of
 * Record o Paddle cobra o IVA; sem imposto por dentro, o `grand_total` volta
 * como preço + IVA e `amountMatches` reprova TODA compra internacional — o
 * sintoma seria compra paga que nunca libera o download.
 *
 * Sem catálogo no Paddle de propósito: o preço sai do nosso banco, fonte de
 * verdade única. Espelhar as listas lá criaria duas, e o dia em que
 * divergissem o comprador pagaria o valor errado.
 */
export async function createTransaction(
    input: CreateTransactionInput
): Promise<{ id: string }> {
    const body = {
        items: input.items.map((item) => ({
            quantity: item.quantity,
            price: {
                name: item.name,
                description: item.description,
                tax_mode: "internal",
                unit_price: {
                    amount: toPaddleAmount(item.unitPrice),
                    currency_code: input.currencyCode,
                },
                product: {
                    name: item.name,
                    tax_category: "standard",
                },
            },
        })),
        currency_code: input.currencyCode,
        collection_mode: "automatic",
        custom_data: { purchaseId: input.purchaseId },
        customer: { email: input.customerEmail },
    }

    const data = (await paddleFetch("/transactions", {
        method: "POST",
        body: JSON.stringify(body),
    })) as { data?: { id?: string } }

    if (!data.data?.id) {
        throw new Error("Paddle devolveu transação sem id")
    }

    return { id: data.data.id }
}

/**
 * Busca uma transação. O webhook já traz o corpo completo, mas a rota de
 * confirmação precisa consultar por conta própria — e conferir o valor contra
 * a fonte, em vez de contra o que o cliente afirmou.
 */
export async function getTransaction(transactionId: string): Promise<PaddleTransaction> {
    const payload = (await paddleFetch(`/transactions/${transactionId}`)) as {
        data?: {
            id?: string
            status?: string
            currency_code?: string
            custom_data?: { purchaseId?: string }
            details?: { totals?: { grand_total?: string } }
            customer?: { email?: string }
        }
    }

    const data = payload.data ?? {}

    return {
        id: data.id ?? transactionId,
        status: data.status ?? "unknown",
        grandTotal: data.details?.totals?.grand_total ?? null,
        currencyCode: data.currency_code ?? null,
        purchaseId: data.custom_data?.purchaseId ?? null,
        customerEmail: data.customer?.email ?? null,
    }
}
```

- [ ] **Step 4: Acrescentar os getters de ambiente**

Ao final de `lib/server-env.ts`:

```ts
export function getPaddleServerConfig() {
    return {
        apiKey: getRequiredServerEnv("PADDLE_API_KEY"),
    }
}

/**
 * Getter próprio, mesmo motivo do Stripe e do Mercado Pago: a rota de criação
 * de transação não pode falhar por causa de uma variável que só o webhook usa.
 */
export function getPaddleWebhookSecret(): string {
    return getRequiredServerEnv("PADDLE_WEBHOOK_SECRET")
}
```

Em `lib/env.ts`, acrescentar ao objeto `publicEnv`, após a linha `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`:

```ts
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV,
```

E ao final do arquivo:

```ts
/** Sinal público de "Paddle habilitado" para a UI, espelhando o padrão dos outros provedores. */
export function getOptionalPublicPaddleClientToken() {
    return publicEnv.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ""
}

/**
 * Ambiente do Paddle. O padrão é `sandbox`: cobrar de verdade tem que ser
 * decisão explícita, nunca o efeito de uma variável esquecida.
 */
export function getPublicPaddleEnv(): "sandbox" | "production" {
    return publicEnv.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox"
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test -- lib/paddle.test.ts`
Expected: PASS — 15 testes.

- [ ] **Step 6: Rodar o lint nos arquivos tocados**

Run: `npx eslint lib/paddle.ts lib/paddle.test.ts lib/server-env.ts lib/env.ts`
Expected: zero problema novo.

- [ ] **Step 7: Commit**

```bash
git add lib/paddle.ts lib/paddle.test.ts lib/server-env.ts lib/env.ts
git commit -m "feat(paddle): cliente, conversao de valor e verificacao de assinatura"
```

---

### Task 3: Provedor no schema e no fulfillment

O enum, a coluna e a entrada no mapa de busca.

**Files:**
- Modify: `prisma/schema.prisma` (enum `PaymentProvider` e model `Purchase`)
- Create: `prisma/migrations/<timestamp>_add_paddle_provider/migration.sql` (gerada pelo Prisma)
- Modify: `lib/checkout/fulfillment.ts:33`, `:81-88`, `:156-170`
- Modify: `lib/checkout/fulfillment.test.ts` (acrescentar casos)

**Interfaces:**
- Consumes: nada da Task 2.
- Produces:
  - `PaymentProviderInput` passa a ser `"paypal" | "stripe" | "mercadopago" | "paddle"`
  - `fulfillPurchase(db, { provider: "paddle", providerOrderId, capturedAmount, payer, providerPaymentId })` onde `providerOrderId` é o **`purchase.id`** e `providerPaymentId` é o `txn_...`
  - Campo Prisma: `Purchase.paddleTransactionId` (`String? @unique`)

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `describe("fulfillPurchase", ...)` em `lib/checkout/fulfillment.test.ts`:

```ts
    it("paddle: localiza a compra pelo próprio purchase.id", async () => {
        // Igual ao Mercado Pago: quem amarra a transação ao pedido é o
        // custom_data, que carrega o nosso id.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({
            ...pendingPurchase,
            provider: "paddle",
            currency: "EUR",
            total: "45.00",
        })
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            payer: { email: "comprador@teste.com" },
            providerPaymentId: "txn_1",
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "purchase-1" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("paddle: grava paddleTransactionId e nenhum campo dos outros provedores", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({
            ...pendingPurchase,
            provider: "paddle",
            currency: "EUR",
            total: "45.00",
        })
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            providerPaymentId: "txn_1",
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.data).toMatchObject({
            status: "paid",
            paddleTransactionId: "txn_1",
        })
        expect(updateArgs.data).not.toHaveProperty("mercadoPagoPaymentId")
        expect(updateArgs.data).not.toHaveProperty("stripePaymentIntentId")
    })

    it("paddle: failed é terminal, ao contrário do Mercado Pago", async () => {
        // No Mercado Pago a mesma preferência sobrevive a uma recusa. No
        // Paddle o comprador retenta dentro do overlay, na MESMA transação,
        // então `failed` só é gravado em evento definitivo.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({
            ...pendingPurchase,
            provider: "paddle",
            status: "failed",
            currency: "EUR",
            total: "45.00",
        })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("paddle: quem perde a corrida não reenvia e-mail", async () => {
        // confirm-transaction e webhook chegam quase juntos. A leitura acima
        // vê `pending` nos dois, e é o updateMany condicional que decide: o
        // segundo encontra count 0.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({
            ...pendingPurchase,
            provider: "paddle",
            currency: "EUR",
            total: "45.00",
        })
        db.purchase.updateMany.mockResolvedValue({ count: 0 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            providerPaymentId: "txn_1",
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
    })

    it("paddle: pagamento não efetiva compra de outro provedor", async () => {
        // A busca do Paddle é por chave primária e acharia compra de qualquer
        // provedor — a guarda de provider é a única linha que impede isso.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({
            ...pendingPurchase,
            provider: "mercadopago",
            currency: "BRL",
            total: "289.00",
        })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
        })

        expect(outcome).toEqual({ status: "not_found" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- lib/checkout/fulfillment.test.ts`
Expected: FAIL nos 5 testes novos — `BUSCA_POR_PROVEDOR["paddle"]` é `undefined`, então `findUnique` é chamado com `where: undefined`.

- [ ] **Step 3: Atualizar o schema Prisma**

Em `prisma/schema.prisma`, no enum:

```prisma
enum PaymentProvider {
  paypal
  stripe
  mercadopago
  paddle
}
```

E no model `Purchase`, junto dos campos dos outros provedores (após `mercadoPagoPaymentId`):

```prisma
  paddleTransactionId     String?         @unique
```

- [ ] **Step 4: Gerar e aplicar a migration**

Run: `npx prisma migrate dev --name add_paddle_provider --create-only`

Conferir o SQL gerado — deve conter `ALTER TYPE "PaymentProvider" ADD VALUE 'paddle'` e uma coluna nova com índice único. Depois:

Run: `npx prisma migrate deploy`
Run: `npx prisma generate`
Expected: migration aplicada, client regenerado com o valor novo do enum.

- [ ] **Step 5: Acrescentar `paddle` ao tipo e ao mapa em `lib/checkout/fulfillment.ts`**

Substituir o tipo (linha 33):

```ts
export type PaymentProviderInput = "paypal" | "stripe" | "mercadopago" | "paddle"
```

No mapa `BUSCA_POR_PROVEDOR`, acrescentar a entrada e ampliar o tipo de retorno:

```ts
const BUSCA_POR_PROVEDOR: Record<
    PaymentProviderInput,
    (providerOrderId: string) => { paypalOrderId: string } | { stripeSessionId: string } | { id: string }
> = {
    paypal: (id) => ({ paypalOrderId: id }),
    stripe: (id) => ({ stripeSessionId: id }),
    mercadopago: (id) => ({ id }),
    // Mesma cláusula do Mercado Pago: o custom_data da transação carrega o
    // nosso purchase.id.
    paddle: (id) => ({ id }),
}
```

E acrescentar o campo do Paddle ao `data` do `updateMany`, junto dos outros três:

```ts
            ...(provider === "paddle" && providerPaymentId
                ? { paddleTransactionId: providerPaymentId }
                : {}),
```

Atualizar também o comentário do JSDoc de `fulfillPurchase` (linha ~58) para citar o Paddle junto do Mercado Pago como provedor que correlaciona pelo próprio `purchase.id`.

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `npm test -- lib/checkout/fulfillment.test.ts`
Expected: PASS — os testes antigos continuam verdes, mais os 5 novos.

- [ ] **Step 7: Rodar a suíte inteira e o lint**

Run: `npm test`
Expected: PASS.

Run: `npx eslint lib/checkout/fulfillment.ts lib/checkout/fulfillment.test.ts`
Expected: zero problema novo.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma lib/checkout/fulfillment.ts lib/checkout/fulfillment.test.ts
git add prisma/migrations/<timestamp>_add_paddle_provider/migration.sql
git commit -m "feat(paddle): provedor no schema e busca por purchase.id no fulfillment"
```

---

### Task 4: Rota de criação de transação

O caminho de ida: criar a `Purchase` e a transação no Paddle.

**Files:**
- Create: `lib/checkout/currency-guard.ts`
- Create: `lib/checkout/currency-guard.test.ts`
- Create: `app/api/checkout/paddle/create-transaction/route.ts`

**Interfaces:**
- Consumes: `createTransaction`, `isPaddleConfigured` (Task 2); `Purchase.paddleTransactionId`, provider `paddle` (Task 3).
- Produces:
  - `providerForCurrency(currency: string): "mercadopago" | "paddle"`
  - `POST /api/checkout/paddle/create-transaction` → `200 { transactionId: string, purchaseId: string }`

- [ ] **Step 1: Escrever o teste da guarda de moeda**

Criar `lib/checkout/currency-guard.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { providerForCurrency } from "./currency-guard"

describe("providerForCurrency", () => {
    it("BRL vai para o Mercado Pago, que é quem tem Pix", () => {
        expect(providerForCurrency("BRL")).toBe("mercadopago")
    })

    it("EUR e USD vão para o Paddle", () => {
        expect(providerForCurrency("EUR")).toBe("paddle")
        expect(providerForCurrency("USD")).toBe("paddle")
    })

    it("moeda desconhecida cai no Paddle, não no Mercado Pago", () => {
        // O Mercado Pago só cobra em BRL; mandar outra moeda para ele cobraria
        // o número em reais sem erro de API. O Paddle recusa moeda que não
        // suporta, com erro. Errar para o lado que reclama é mais seguro.
        expect(providerForCurrency("GBP")).toBe("paddle")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/checkout/currency-guard.test.ts`
Expected: FAIL — `Failed to resolve import "./currency-guard"`.

- [ ] **Step 3: Escrever a guarda**

Criar `lib/checkout/currency-guard.ts`:

```ts
// lib/checkout/currency-guard.ts
//
// Qual provedor atende cada moeda.
//
// Existe como módulo próprio porque a regra vale em três lugares — a tela do
// checkout, a rota do Paddle e a rota do Mercado Pago — e uma cópia divergente
// significaria mandar o comprador para um provedor que não consegue cobrá-lo.

export type ProvedorDeCobranca = "mercadopago" | "paddle"

/**
 * O Mercado Pago é a conta brasileira: cobra em BRL e exige CPF ou CNPJ do
 * pagador, então só serve quem tem documento brasileiro. O Paddle atende o
 * resto.
 *
 * Moeda desconhecida cai no Paddle de propósito: o Mercado Pago não converte e
 * cobraria o número em reais sem erro de API, enquanto o Paddle recusa moeda
 * que não suporta. Errar para o lado que reclama é mais seguro.
 */
export function providerForCurrency(currency: string): ProvedorDeCobranca {
    return currency === "BRL" ? "mercadopago" : "paddle"
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/checkout/currency-guard.test.ts`
Expected: PASS — 3 testes.

- [ ] **Step 5: Criar a rota**

Criar `app/api/checkout/paddle/create-transaction/route.ts`:

```ts
// app/api/checkout/paddle/create-transaction/route.ts
//
// Cria a Purchase pendente e a transação do Paddle.
//
// A ordem segue a do Mercado Pago e pela mesma razão: quem amarra a transação
// ao pedido é o `custom_data`, que carrega o nosso purchase.id. Ele precisa
// existir antes da transação.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { createTransaction, isPaddleConfigured } from "@/lib/paddle"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
import { providerForCurrency } from "@/lib/checkout/currency-guard"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isPaddleConfigured()) {
            return NextResponse.json({ error: "Paddle not configured" }, { status: 503 })
        }

        // Mesmo bucket de rate limit dos outros provedores: o teto é do
        // checkout, não de cada provedor.
        const allowed = await checkPersistentRateLimit(
            "checkout:create",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const PENDING_BACKSTOP_MAX = 15
        const PENDING_BACKSTOP_WINDOW_MS = 60 * 60 * 1000
        const recentPending = await prisma.purchase.count({
            where: {
                userId: user.id,
                status: "pending",
                createdAt: { gt: new Date(Date.now() - PENDING_BACKSTOP_WINDOW_MS) },
            },
        })
        if (recentPending >= PENDING_BACKSTOP_MAX) {
            return NextResponse.json({ error: "Too many pending orders" }, { status: 429 })
        }

        const parsedBody = checkoutRequestSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid checkout items" }, { status: 400 })
        }

        const { items, currency } = parsedBody.data

        // A guarda vale no servidor, não só na tela. Carrinho em BRL aqui
        // significa que alguém chamou a rota direto — e o Paddle não é o
        // caminho de quem paga em reais.
        if (providerForCurrency(currency) !== "paddle") {
            return NextResponse.json(
                { error: "Currency not handled by Paddle" },
                { status: 400 }
            )
        }

        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        const prices = await resolveListPrices(prisma, listIds, currency)

        // Sem queda para EUR quando o carrinho é USD: a queda é comportamento
        // de vitrine, e cobrar numa moeda diferente da resolvida é cobrar
        // diferente do combinado.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== currency)
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in requested currency" },
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

        // A compra nasce ANTES da transação: o custom_data é o id dela.
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                provider: "paddle",
                status: "pending",
                subtotal,
                total: subtotal,
                currency,
                buyerEmail: user.email,
                items: {
                    create: purchaseItems.map((item) => ({
                        listId: item.listId,
                        price: item.price,
                        currency,
                        leadsCount: item.leadsCount,
                    })),
                },
            },
        })

        let transaction: { id: string }
        try {
            transaction = await createTransaction({
                items: purchaseItems.map((item) => ({
                    name: item.name,
                    description: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
                currencyCode: currency,
                purchaseId: purchase.id,
                customerEmail: user.email,
            })
        } catch (error) {
            // Compra criada sem transação é pedido órfão: ela ocuparia o
            // backstop de pendentes do comprador sem nunca poder ser paga.
            console.error("[Paddle] Falha ao criar transação:", error)
            await prisma.purchase.updateMany({
                where: { id: purchase.id, status: "pending" },
                data: { status: "failed" },
            })
            return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
        }

        // Gravação separada e tolerante: a transação já existe e é pagável, e
        // esta coluna serve só para conciliação. Derrubar a compra aqui seria
        // trocar um pedido pagável por um erro.
        try {
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { paddleTransactionId: transaction.id },
            })
        } catch (error) {
            console.error("[Paddle] Falha ao gravar paddleTransactionId:", error)
        }

        return NextResponse.json({
            transactionId: transaction.id,
            purchaseId: purchase.id,
        })
    } catch (error) {
        console.error("Error creating Paddle transaction:", error)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }
}
```

- [ ] **Step 6: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint lib/checkout/currency-guard.ts lib/checkout/currency-guard.test.ts app/api/checkout/paddle/create-transaction/route.ts`
Expected: zero problema novo.

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/checkout/currency-guard.ts lib/checkout/currency-guard.test.ts app/api/checkout/paddle/create-transaction/route.ts
git commit -m "feat(paddle): guarda de moeda e rota de criacao de transacao"
```

---

### Task 5: Webhook e confirmação

O caminho de volta. O webhook é a autoridade; a confirmação é o atalho para quem está olhando a tela.

**Files:**
- Create: `lib/checkout/paddle-status.ts`
- Create: `lib/checkout/paddle-status.test.ts`
- Create: `app/api/checkout/paddle/webhook/route.ts`
- Create: `app/api/checkout/paddle/confirm-transaction/route.ts`

**Interfaces:**
- Consumes: `verifyPaddleSignature`, `getTransaction`, `fromPaddleAmount`, `PaddleApiError` (Task 2); `fulfillPurchase` com `provider: "paddle"` (Task 3).
- Produces: `mapPaddleEvent(eventType: string): "fulfill" | "ignore"`

- [ ] **Step 1: Escrever o teste do mapeamento de evento**

Criar `lib/checkout/paddle-status.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { mapPaddleEvent } from "./paddle-status"

describe("mapPaddleEvent", () => {
    it("transaction.completed efetiva a compra", () => {
        expect(mapPaddleEvent("transaction.completed")).toBe("fulfill")
    })

    it("estados intermediários não fazem nada", () => {
        expect(mapPaddleEvent("transaction.created")).toBe("ignore")
        expect(mapPaddleEvent("transaction.ready")).toBe("ignore")
        expect(mapPaddleEvent("transaction.updated")).toBe("ignore")
    })

    it("tentativa de pagamento recusada não mata o pedido", () => {
        // No overlay o comprador retenta com outro cartão na MESMA transação.
        // Marcar failed aqui recriaria o bug corrigido no Mercado Pago em
        // 64c82d7: recusa encerra a tentativa, não o pedido.
        expect(mapPaddleEvent("transaction.payment_failed")).toBe("ignore")
    })

    it("estorno fica fora deste fluxo", () => {
        expect(mapPaddleEvent("adjustment.created")).toBe("ignore")
    })

    it("evento desconhecido não faz nada", () => {
        expect(mapPaddleEvent("evento.que.o.paddle.inventou")).toBe("ignore")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/checkout/paddle-status.test.ts`
Expected: FAIL — `Failed to resolve import "./paddle-status"`.

- [ ] **Step 3: Escrever o mapeamento**

Criar `lib/checkout/paddle-status.ts`:

```ts
// lib/checkout/paddle-status.ts
//
// Tradução do evento de webhook do Paddle para a ação do nosso domínio.
//
// Deliberadamente mais estreito que o do Mercado Pago: aqui UM evento age, e
// todo o resto é registrado sem alterar a compra.

export type PaddleAction = "fulfill" | "ignore"

const ACOES: Record<string, PaddleAction> = {
    "transaction.completed": "fulfill",
}

/**
 * Evento não mapeado nunca altera a compra.
 *
 * Em particular `transaction.payment_failed`: no overlay o comprador retenta
 * com outro cartão dentro da MESMA transação, então tratar uma tentativa
 * recusada como pedido morto cobraria o dinheiro sem entregar a lista — foi
 * exatamente o bug corrigido no Mercado Pago em 64c82d7.
 */
export function mapPaddleEvent(eventType: string): PaddleAction {
    return ACOES[eventType] ?? "ignore"
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/checkout/paddle-status.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Escrever o webhook**

Criar `app/api/checkout/paddle/webhook/route.ts`:

```ts
// app/api/checkout/paddle/webhook/route.ts
//
// Recebe as notificações do Paddle.
//
// O corpo é lido CRU e só depois interpretado: a assinatura cobre os bytes
// exatos que chegaram, e reserializar o JSON — mesmo sem mudar o significado —
// derruba a verificação. Este é o erro clássico da integração.
//
// A verificação é obrigatória e fail-closed.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { mapPaddleEvent } from "@/lib/checkout/paddle-status"
import { fromPaddleAmount, verifyPaddleSignature } from "@/lib/paddle"
import { getPaddleWebhookSecret } from "@/lib/server-env"

export const dynamic = "force-dynamic"

type WebhookBody = {
    event_type?: string
    data?: {
        id?: string
        currency_code?: string
        custom_data?: { purchaseId?: string }
        details?: { totals?: { grand_total?: string } }
        customer?: { email?: string }
    }
}

export async function POST(request: NextRequest) {
    let secret: string
    try {
        secret = getPaddleWebhookSecret()
    } catch {
        console.warn("[Paddle Webhook] PADDLE_WEBHOOK_SECRET não configurado — evento rejeitado")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 401 })
    }

    // CRU, antes de qualquer parse.
    const rawBody = await request.text()

    const valida = verifyPaddleSignature({
        signatureHeader: request.headers.get("paddle-signature"),
        rawBody,
        secret,
    })

    if (!valida) {
        console.error("[Paddle Webhook] Assinatura inválida")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let body: WebhookBody
    try {
        body = JSON.parse(rawBody) as WebhookBody
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const eventType = body.event_type ?? ""

    if (mapPaddleEvent(eventType) === "ignore") {
        console.log(`[Paddle Webhook] evento=${eventType} — nenhuma ação`)
        return NextResponse.json({ received: true })
    }

    const purchaseId = body.data?.custom_data?.purchaseId

    if (!purchaseId) {
        console.error(`[Paddle Webhook] transação ${body.data?.id} sem purchaseId em custom_data`)
        return NextResponse.json({ received: true })
    }

    try {
        const grandTotal = body.data?.details?.totals?.grand_total
        const currencyCode = body.data?.currency_code

        const capturedAmount: CapturedAmount | null =
            !grandTotal || !currencyCode
                ? null
                : { value: fromPaddleAmount(grandTotal), currency: currencyCode.toUpperCase() }

        const outcome = await fulfillPurchase(prisma, {
            provider: "paddle",
            providerOrderId: purchaseId,
            capturedAmount,
            payer: { email: body.data?.customer?.email ?? null },
            providerPaymentId: body.data?.id ?? null,
        })

        console.log(
            `[Paddle Webhook] transacao=${body.data?.id} compra=${purchaseId} outcome=${outcome.status}`
        )

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[Paddle Webhook] Erro ao processar evento:", error)
        // 500 faz o Paddle reentregar mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }
}
```

- [ ] **Step 6: Escrever a rota de confirmação**

Criar `app/api/checkout/paddle/confirm-transaction/route.ts`:

```ts
// app/api/checkout/paddle/confirm-transaction/route.ts
//
// Caminho rápido, chamado pelo overlay quando ele avisa que concluiu.
//
// Existe por UX: o comprador está olhando a tela, e esperar o webhook seriam
// segundos de nada acontecendo. O webhook continua sendo a autoridade — a
// corrida entre os dois é resolvida pela transição condicional de
// fulfillPurchase, e foi observada em produção no fluxo do Mercado Pago.
//
// O valor NUNCA vem do cliente: só o id da transação chega no corpo, e o
// total é lido da API do Paddle.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { getTransaction, fromPaddleAmount, isPaddleConfigured, PaddleApiError } from "@/lib/paddle"

const bodySchema = z.object({
    transactionId: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isPaddleConfigured()) {
            return NextResponse.json({ error: "Paddle not configured" }, { status: 503 })
        }

        const allowed = await checkPersistentRateLimit(
            "checkout:confirm",
            user.id || getClientIp(request),
            30,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = bodySchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 })
        }

        let transaction
        try {
            transaction = await getTransaction(parsedBody.data.transactionId)
        } catch (error) {
            if (error instanceof PaddleApiError && error.status === 404) {
                return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
            }
            throw error
        }

        if (transaction.status !== "completed") {
            // Ainda não concluída: o webhook resolve quando concluir.
            return NextResponse.json({ status: "pending" })
        }

        if (!transaction.purchaseId) {
            console.error(`[Paddle] Transação ${transaction.id} sem purchaseId em custom_data`)
            return NextResponse.json({ error: "Transaction not linked" }, { status: 400 })
        }

        const capturedAmount: CapturedAmount | null =
            !transaction.grandTotal || !transaction.currencyCode
                ? null
                : {
                      value: fromPaddleAmount(transaction.grandTotal),
                      currency: transaction.currencyCode.toUpperCase(),
                  }

        const outcome = await fulfillPurchase(prisma, {
            provider: "paddle",
            providerOrderId: transaction.purchaseId,
            capturedAmount,
            payer: { email: transaction.customerEmail },
            providerPaymentId: transaction.id,
        })

        return NextResponse.json({ status: outcome.status, purchaseId: transaction.purchaseId })
    } catch (error) {
        console.error("Error confirming Paddle transaction:", error)
        return NextResponse.json({ error: "Failed to confirm" }, { status: 500 })
    }
}
```

- [ ] **Step 7: Verificar tipos, lint e suíte**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint lib/checkout/paddle-status.ts lib/checkout/paddle-status.test.ts app/api/checkout/paddle/webhook/route.ts app/api/checkout/paddle/confirm-transaction/route.ts`
Expected: zero problema novo.

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/checkout/paddle-status.ts lib/checkout/paddle-status.test.ts app/api/checkout/paddle/webhook/route.ts app/api/checkout/paddle/confirm-transaction/route.ts
git commit -m "feat(paddle): webhook assinado e rota de confirmacao do overlay"
```

---

### Task 6: Botão do Paddle, CSP e roteamento na tela

O que o comprador vê. Inclui a liberação do CSP, sem a qual nada disso carrega.

**Files:**
- Modify: `next.config.ts` (CSP)
- Create: `components/checkout/paddle-button.tsx`
- Modify: `app/[locale]/checkout/page.tsx:30-33`, `:98`
- Modify: `messages/{pt,en,de,fr,es,it,nl}.json`

**Interfaces:**
- Consumes: `POST /api/checkout/paddle/create-transaction` (Task 4); `POST /api/checkout/paddle/confirm-transaction` (Task 5); `getOptionalPublicPaddleClientToken`, `getPublicPaddleEnv` (Task 2); `providerForCurrency` (Task 4).
- Produces: componente `<PaddleButton items currency />`.

- [ ] **Step 1: Liberar o CSP para o Paddle**

Em `next.config.ts`, no valor de `Content-Security-Policy`, acrescentar os domínios do Paddle a três diretivas. O valor completo passa a ser:

```ts
                value: `default-src 'self'; script-src ${scriptSrc} https://cdn.paddle.com https://sandbox-cdn.paddle.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.paypal.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.paddle.com; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.paddle.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`,
```

Acrescentar acima do bloco, junto do comentário do `scriptSrc`, a razão:

```ts
        // O Paddle.js carrega de cdn.paddle.com e o overlay abre em iframe.
        // Sem essas três liberações o botão não faz nada, e o único sinal é um
        // erro no console — falha cara de diagnosticar depois.
```

- [ ] **Step 2: Acrescentar as chaves de tradução nos 7 idiomas**

Na seção `checkout` de cada `messages/*.json`:

| arquivo | `payWithPaddle` | `paddleTaxNotice` |
|---|---|---|
| `pt.json` | `"Pagar com cartão"` | `"O preço já inclui os impostos aplicáveis. A cobrança aparece no extrato em nome do Paddle."` |
| `en.json` | `"Pay by card"` | `"Price includes applicable taxes. The charge appears on your statement under Paddle's name."` |
| `de.json` | `"Mit Karte bezahlen"` | `"Der Preis enthält die anfallenden Steuern. Die Abbuchung erscheint auf Ihrem Kontoauszug unter dem Namen Paddle."` |
| `fr.json` | `"Payer par carte"` | `"Le prix inclut les taxes applicables. Le débit apparaît sur votre relevé au nom de Paddle."` |
| `es.json` | `"Pagar con tarjeta"` | `"El precio incluye los impuestos aplicables. El cargo aparece en el extracto a nombre de Paddle."` |
| `it.json` | `"Paga con carta"` | `"Il prezzo include le imposte applicabili. L'addebito compare sull'estratto conto a nome di Paddle."` |
| `nl.json` | `"Betaal met kaart"` | `"De prijs is inclusief toepasselijke belastingen. De afschrijving verschijnt op uw afschrift onder de naam Paddle."` |

- [ ] **Step 3: Criar o componente**

Criar `components/checkout/paddle-button.tsx`:

```tsx
// components/checkout/paddle-button.tsx
"use client"

import { useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getOptionalPublicPaddleClientToken, getPublicPaddleEnv } from "@/lib/env"

interface PaddleButtonProps {
    items: Array<{ listId: string; quantity: number }>
    /** Moeda do carrinho. O Paddle cobra nela — diferente do Mercado Pago. */
    currency: string
}

type CreateTransactionResponse = { transactionId?: string; error?: string }

// O Paddle.js se instala em window.Paddle. Tipagem mínima: só o que usamos.
type PaddleGlobal = {
    Environment: { set: (env: string) => void }
    Initialize: (options: { token: string; eventCallback?: (event: { name: string; data?: { transaction_id?: string } }) => void }) => void
    Checkout: { open: (options: { transactionId: string }) => void }
}

declare global {
    interface Window {
        Paddle?: PaddleGlobal
    }
}

export function PaddleButton({ items, currency }: PaddleButtonProps) {
    const t = useTranslations("checkout")
    const locale = useLocale()
    const plainRouter = usePlainRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [scriptPronto, setScriptPronto] = useState(false)
    const clientToken = getOptionalPublicPaddleClientToken()
    const inicializado = useRef(false)

    useEffect(() => {
        if (!clientToken || inicializado.current) return

        function inicializar() {
            if (!window.Paddle || inicializado.current) return
            inicializado.current = true

            window.Paddle.Environment.set(getPublicPaddleEnv())
            window.Paddle.Initialize({
                token: clientToken,
                eventCallback: (event) => {
                    if (event.name !== "checkout.completed") return

                    const transactionId = event.data?.transaction_id
                    if (!transactionId) return

                    // Caminho rápido. Se falhar, o webhook efetiva de qualquer
                    // forma — por isso o erro não vira toast: assustaria o
                    // comprador por causa de uma compra que vai se resolver.
                    fetch("/api/checkout/paddle/confirm-transaction", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transactionId }),
                    })
                        .catch((error) => console.error("confirm-transaction error:", error))
                        .finally(() => {
                            plainRouter.push(`/${locale}/checkout/success`)
                        })
                },
            })
            setScriptPronto(true)
        }

        if (window.Paddle) {
            inicializar()
            return
        }

        const script = document.createElement("script")
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
        script.async = true
        script.onload = inicializar
        script.onerror = () => console.error("Paddle.js não carregou — conferir o CSP")
        document.body.appendChild(script)
    }, [clientToken, locale, plainRouter])

    if (!clientToken) {
        // Provedor desconfigurado some da tela; o aviso de "nenhum provedor" é
        // responsabilidade da página de checkout.
        return null
    }

    async function handleClick() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout/paddle/create-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as CreateTransactionResponse

            if (!response.ok || !data.transactionId) {
                console.error("create-transaction failed:", response.status, data.error)

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredPay"))
                    plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                } else {
                    toast.error(t("createFailed"))
                }
                setIsLoading(false)
                return
            }

            window.Paddle?.Checkout.open({ transactionId: data.transactionId })
            // O overlay assume a tela; o loading sai para o botão não ficar
            // travado se o comprador fechar o overlay sem pagar.
            setIsLoading(false)
        } catch (error) {
            console.error("create-transaction error:", error)
            toast.error(t("createFailed"))
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                {t("paddleTaxNotice")}
            </div>

            <Button
                type="button"
                className="h-[45px] w-full"
                disabled={isLoading || !scriptPronto}
                onClick={handleClick}
            >
                {isLoading || !scriptPronto ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                )}
                {t("payWithPaddle")}
            </Button>
        </div>
    )
}
```

- [ ] **Step 4: Rotear na página de checkout**

Em `app/[locale]/checkout/page.tsx`, acrescentar os imports:

```tsx
import { PaddleButton } from "@/components/checkout/paddle-button"
import { getOptionalPublicPaddleClientToken } from "@/lib/env"
import { providerForCurrency } from "@/lib/checkout/currency-guard"
```

Substituir o bloco das linhas 30-33 por:

```tsx
    // Stripe e PayPal saíram da tela — a conta do primeiro está com pendências
    // e a do segundo foi cancelada. As rotas dos dois continuam no código.
    //
    // A moeda decide o provedor: o Mercado Pago exige CPF ou CNPJ do pagador,
    // então só atende quem tem documento brasileiro; o Paddle atende o resto.
    const provedor = providerForCurrency(currency)
    const hasAnyPaymentProvider =
        provedor === "mercadopago"
            ? Boolean(getOptionalPublicMercadoPagoPublicKey())
            : Boolean(getOptionalPublicPaddleClientToken())
```

E substituir a linha 98 (o `<MercadoPagoButton .../>`) por:

```tsx
                                {provedor === "mercadopago" ? (
                                    <MercadoPagoButton items={checkoutItems} currency={currency} />
                                ) : (
                                    <PaddleButton items={checkoutItems} currency={currency} />
                                )}
```

- [ ] **Step 5: Verificar tipos, lint e suíte**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npx eslint components/checkout/paddle-button.tsx "app/[locale]/checkout/page.tsx" next.config.ts`
Expected: zero problema novo.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Conferir no preview**

Subir o dev server pelo preview (`.claude/launch.json`, porta 3001) — **nunca pelo Bash**.

Com o carrinho em EUR, abrir `/pt/checkout` e confirmar:
1. O botão do Paddle aparece, e o do Mercado Pago não.
2. O console **não** mostra erro de CSP — se mostrar `Refused to load the script 'https://cdn.paddle.com/...'`, o Step 1 não foi aplicado corretamente.
3. Trocar o carrinho para BRL e confirmar que a tela volta a mostrar o Mercado Pago.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts components/checkout/paddle-button.tsx "app/[locale]/checkout/page.tsx"
git add messages/pt.json messages/en.json messages/de.json messages/fr.json messages/es.json messages/it.json messages/nl.json
git commit -m "feat(checkout): botao do Paddle por moeda, com CSP liberado para o overlay"
```

---

### Task 7: Documentar as variáveis de ambiente

Fecha a dívida do `.env.example`, que ainda documenta Stripe e PayPal e ignora os dois provedores vivos.

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Consumes: nomes das variáveis definidos na Task 2.
- Produces: nada consumido por código.

- [ ] **Step 1: Substituir o bloco de pagamento**

Em `.env.example`, trocar as linhas de `PAYPAL_*` e `STRIPE_*` por:

```bash
# --- Pagamento ---
# Mercado Pago — cobra em BRL, atende quem tem CPF ou CNPJ.
# Credenciais em: painel do MP > Suas integrações > sua aplicação > Credenciais.
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

# Paddle — cobra em EUR e USD, atende o comprador internacional.
# Merchant of Record: ele recolhe o IVA e aparece na fatura do comprador.
# NEXT_PUBLIC_PADDLE_ENV aceita "sandbox" (padrão) ou "production".
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENV=sandbox

# Stripe e PayPal continuam no código mas estão DESLIGADOS: a conta do
# primeiro tem pendências e a do segundo foi cancelada. Religar qualquer um é
# questão de preencher as variáveis correspondentes.
```

- [ ] **Step 2: Conferir que nada mais cita os provedores mortos como ativos**

Run: `grep -n -i 'stripe\|paypal' .env.example`
Expected: apenas o comentário explicativo do bloco acima.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs(env): documenta Mercado Pago e Paddle; marca Stripe e PayPal como desligados"
```

---

## Verificação final

Depois da Task 7, antes de considerar o trabalho pronto:

- [ ] Run: `npm test` → PASS, com pelo menos 656 testes (628 da linha de base + 28 novos).
- [ ] Run: `npx tsc --noEmit` → sem erros.
- [ ] Com as quatro variáveis do Paddle preenchidas em **sandbox**, fazer uma compra completa com o carrinho em EUR: overlay abre, pagamento de teste passa, download libera.
- [ ] Fechar a aba **antes** da confirmação e verificar que o webhook efetiva a compra sozinho.
- [ ] Conferir nos logs que o valor cobrado bate com o anunciado — nenhum `amount_mismatch` por causa de imposto. **Este é o critério que valida a decisão de `tax_mode: "internal"`.**
