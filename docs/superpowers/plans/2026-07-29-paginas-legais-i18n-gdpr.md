# Páginas legais: i18n, GDPR e conteúdo honesto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servir `/terms` e `/privacy` nos sete idiomas, com a estrutura que o GDPR exige, data de atualização real, e sem publicar nenhum compromisso jurídico que não se sustente.

**Architecture:** O texto sai dos componentes e vai para `content/legal/`, um módulo por documento por idioma, com as seções como dados estruturados. As páginas viram renderizadores genéricos e migram de `app/(app)/` para `app/[locale]/`, o que traduz as rotas sem mudar nenhuma URL existente. Seção cuja redação depende de advogado simplesmente não entra no documento, e fica registrada numa lista de pendências verificada por teste.

**Tech Stack:** Next.js 16 (App Router), next-intl, Vitest, Tailwind v4.

## Global Constraints

- **Sete idiomas publicados**, nesta ordem: `pt` (padrão), `de`, `en`, `es`, `fr`, `it`, `nl` — valor de `PUBLISHED_LOCALES` em `lib/i18n/locales.ts`.
- **Nenhuma URL existente pode mudar.** `/terms` e `/privacy` continuam sendo o português, sem prefixo (`localePrefix: "as-needed"`).
- **Nenhuma data gerada em tempo de execução.** `new Date()` num documento legal é o defeito que esta fase conserta.
- **Nada de placeholder no ar.** Seção pendente não é renderizada. Nenhum documento pode conter `TODO`, `PENDENTE`, `XXX`, `«` ou `»`.
- **Não afirmar base legal do tratamento das listas.** Descrever a prática é honesto; afirmar o fundamento jurídico dela é decisão de advogado e está registrada como pendência. Não "completar" essa lacuna por conta própria.
- Responsável, confirmado em 2026-07-29: **Werner Wild Saboia Carvalho Marinho**, contato **contato@easyprospect.com.br**.
- Comentários e mensagens de commit em português. Comentário explica **por quê**, não o quê.
- **Nunca usar `git add <diretório>`** neste repositório — sempre listar arquivos.
- Este repositório **não tem infraestrutura de teste de componente** (zero `*.test.tsx`, sem `@testing-library/*`, sem `jsdom`). Mudança de apresentação é verificada no navegador.

**Spec:** `docs/superpowers/specs/2026-07-29-paginas-legais-i18n-gdpr-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `content/legal/types.ts` | `LegalDocument`, `LegalSection`, `LegalBlock` | 1 |
| `content/legal/pendencias.ts` | Lacunas aceitas e rastreadas | 1 |
| `content/legal/index.ts` | `getLegalDocument(kind, locale)` com fallback para pt | 1 |
| `content/legal/legal.test.ts` | Paridade, ausência de placeholder, data literal, mojibake | 1 |
| `content/legal/privacy.pt.ts` | Fonte de verdade da política | 2 |
| `content/legal/terms.pt.ts` | Fonte de verdade dos termos | 3 |
| `components/legal/legal-document.tsx` | Renderizador genérico | 4 |
| `app/[locale]/privacy/page.tsx` | Rota da política | 4 |
| `app/[locale]/terms/page.tsx` | Rota dos termos | 4 |
| `app/sitemap.ts` | Acrescenta as duas rotas | 4 |
| `content/legal/privacy.{de,en,es,fr,it,nl}.ts` | Traduções da política | 5 |
| `content/legal/terms.{de,en,es,fr,it,nl}.ts` | Traduções dos termos | 6 |

---

### Task 1: Núcleo de conteúdo legal

Tipos, resolução por idioma, registro de pendências e a rede de testes. Nada de conteúdo ainda — as tasks seguintes preenchem.

**Files:**
- Create: `content/legal/types.ts`, `content/legal/pendencias.ts`, `content/legal/index.ts`, `content/legal/legal.test.ts`

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE`, `PUBLISHED_LOCALES` de `@/lib/i18n/locales`
- Produces: `LegalKind`, `LegalBlock`, `LegalSection`, `LegalDocument`, `PENDENCIAS_ACEITAS`, `getLegalDocument(kind: LegalKind, locale: Locale): LegalDocument`

- [ ] **Step 1: Criar os tipos**

`content/legal/types.ts`:

```ts
export type LegalKind = "privacy" | "terms"

export type LegalBlock =
    | { kind: "paragrafo"; texto: string }
    | { kind: "lista"; itens: string[] }

export type LegalSection = {
    /** Estável entre idiomas: é a chave que o teste de paridade compara. */
    id: string
    heading: string
    blocks: LegalBlock[]
}

export type LegalDocument = {
    title: string
    /**
     * Data literal em ISO, editada à mão quando o texto muda.
     *
     * Antes disto a página renderizava `new Date()`, ou seja, afirmava ter sido
     * atualizada hoje — todo dia. Numa política de privacidade isso impede
     * saber qual versão o usuário viu.
     */
    lastUpdated: string
    sections: LegalSection[]
}
```

- [ ] **Step 2: Registrar as pendências**

`content/legal/pendencias.ts`:

```ts
/**
 * Lacunas que dependem do responsável ou de advogado.
 *
 * Seção pendente NÃO entra no documento — a página nunca mostra texto
 * inventado nem marcador esquecido. Esta lista existe para a lacuna ficar
 * rastreada em vez de virar esquecimento, no mesmo espírito do
 * LACUNAS_CONHECIDAS de lib/i18n/messages-integridade.test.ts.
 *
 * Tirar da lista somente quando o item for de fato resolvido e a seção
 * correspondente entrar nos sete idiomas.
 */
export const PENDENCIAS_ACEITAS = [
    "privacy.responsavel.enderecoPostal",
    "privacy.representanteUE",
    "privacy.baseLegal.listas",
    "terms.foroLei",
] as const

/** Ids de seção que, por estarem pendentes, não podem existir em documento. */
export const SECOES_PENDENTES: Record<string, readonly string[]> = {
    privacy: ["representanteUE"],
    terms: ["foroLei"],
}
```

- [ ] **Step 3: Escrever o teste, que deve falhar**

`content/legal/legal.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { PUBLISHED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales"
import { getLegalDocument } from "./index"
import { SECOES_PENDENTES } from "./pendencias"

const KINDS = ["privacy", "terms"] as const
const DIR = __dirname

describe("documentos legais", () => {
    for (const kind of KINDS) {
        const base = getLegalDocument(kind, DEFAULT_LOCALE)

        it(`${kind}: pt declara pelo menos uma seção`, () => {
            expect(base.sections.length).toBeGreaterThan(0)
        })

        it(`${kind}: lastUpdated é data ISO literal`, () => {
            expect(base.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })

        it(`${kind}: nenhuma seção pendente foi publicada`, () => {
            const publicadas = base.sections.map((s) => s.id)
            const vazadas = (SECOES_PENDENTES[kind] ?? []).filter((id) =>
                publicadas.includes(id)
            )
            expect(vazadas).toEqual([])
        })

        for (const locale of PUBLISHED_LOCALES) {
            const doc = getLegalDocument(kind, locale)

            it(`${kind}/${locale}: mesmas seções que pt, na mesma ordem`, () => {
                expect(doc.sections.map((s) => s.id)).toEqual(
                    base.sections.map((s) => s.id)
                )
            })

            it(`${kind}/${locale}: sem marcador de pendência no texto`, () => {
                const texto = JSON.stringify(doc)
                expect(texto).not.toMatch(/TODO|PENDENTE|XXX|«|»/)
            })

            it(`${kind}/${locale}: sem texto duplamente codificado`, () => {
                const texto = JSON.stringify(doc)
                expect(texto).not.toMatch(/Ã.|â€|Â[\s·©]/)
            })
        }
    }

    it("nenhum documento gera data em tempo de execução", () => {
        const arquivos = readdirSync(DIR).filter(
            (f) => /^(privacy|terms)\./.test(f) && f.endsWith(".ts")
        )
        expect(arquivos.length).toBeGreaterThan(0)

        const infratores = arquivos.filter((f) =>
            readFileSync(join(DIR, f), "utf8").includes("new Date")
        )
        expect(infratores).toEqual([])
    })
})
```

- [ ] **Step 4: Rodar para confirmar que falha**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run content/legal/legal.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 5: Implementar a resolução por idioma**

`content/legal/index.ts`. Os imports são estáticos de propósito: import dinâmico tornaria `getLegalDocument` assíncrono e obrigaria as páginas a esperar por conteúdo que é constante de build.

```ts
import type { Locale } from "@/lib/i18n/locales"
import { DEFAULT_LOCALE } from "@/lib/i18n/locales"
import type { LegalDocument, LegalKind } from "./types"

import privacyPt from "./privacy.pt"
import privacyDe from "./privacy.de"
import privacyEn from "./privacy.en"
import privacyEs from "./privacy.es"
import privacyFr from "./privacy.fr"
import privacyIt from "./privacy.it"
import privacyNl from "./privacy.nl"

import termsPt from "./terms.pt"
import termsDe from "./terms.de"
import termsEn from "./terms.en"
import termsEs from "./terms.es"
import termsFr from "./terms.fr"
import termsIt from "./terms.it"
import termsNl from "./terms.nl"

const DOCUMENTOS: Record<LegalKind, Partial<Record<Locale, LegalDocument>>> = {
    privacy: {
        pt: privacyPt, de: privacyDe, en: privacyEn, es: privacyEs,
        fr: privacyFr, it: privacyIt, nl: privacyNl,
    },
    terms: {
        pt: termsPt, de: termsDe, en: termsEn, es: termsEs,
        fr: termsFr, it: termsIt, nl: termsNl,
    },
}

/**
 * Idioma sem arquivo cai no português, mesmo princípio do loadMessages: é
 * melhor entregar a política em outro idioma do que não entregar política.
 */
export function getLegalDocument(kind: LegalKind, locale: Locale): LegalDocument {
    return DOCUMENTOS[kind][locale] ?? DOCUMENTOS[kind][DEFAULT_LOCALE]!
}

export type { LegalDocument, LegalKind, LegalSection, LegalBlock } from "./types"
```

- [ ] **Step 6: Rodar de novo**

Run: `npx vitest run content/legal/legal.test.ts`
Expected: FAIL — os módulos de conteúdo ainda não existem. Este é o estado esperado ao fim da Task 1; as Tasks 2, 3, 5 e 6 os criam.

- [ ] **Step 7: Commit**

```bash
git add content/legal/types.ts content/legal/pendencias.ts content/legal/index.ts content/legal/legal.test.ts
git commit -m "feat(legal): nucleo de conteudo legal com registro de pendencias"
```

---

### Task 2: Política de privacidade em português

A fonte de verdade. As traduções da Task 5 saem daqui, não do texto antigo.

**Files:**
- Create: `content/legal/privacy.pt.ts`

**Interfaces:**
- Consumes: `LegalDocument` de `./types`
- Produces: `default` export de `LegalDocument` com 11 seções publicadas

- [ ] **Step 1: Escrever o documento**

`content/legal/privacy.pt.ts`:

```ts
import type { LegalDocument } from "./types"

const privacyPt: LegalDocument = {
    title: "Política de Privacidade",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Quem é o responsável",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect é operado por Werner Wild Saboia Carvalho Marinho, pessoa física, responsável pelas decisões sobre o tratamento dos dados descritos nesta política." },
                { kind: "paragrafo", texto: "Para qualquer assunto relativo a dados pessoais, incluindo o exercício dos direitos descritos abaixo, escreva para contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Dados que tratamos",
            blocks: [
                { kind: "paragrafo", texto: "Tratamos as informações necessárias para operar o serviço:" },
                { kind: "lista", itens: [
                    "Dados de conta: nome, e-mail e avatar, fornecidos por você no cadastro e gerenciados pelo Supabase Auth.",
                    "Dados de compra: itens adquiridos, valor, moeda e histórico de download.",
                    "Dados de pagamento: identificadores da transação no Stripe. Não recebemos nem armazenamos números de cartão.",
                    "Dados de uso do site: páginas acessadas e eventos de navegação, apenas quando você aceita os cookies de medição.",
                    "Dados inseridos por você no CRM: contatos, empresas e registros de atividade que você importa ou cadastra.",
                    "Dados de contato profissional de terceiros: as empresas e pessoas de contato que compõem as listas do catálogo. Ver a seção específica abaixo.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Base legal de cada tratamento",
            blocks: [
                { kind: "lista", itens: [
                    "Criar e manter a sua conta, processar a compra e entregar o estudo adquirido: execução do contrato entre nós.",
                    "Enviar mensagens sobre a sua compra, como confirmação e liberação do download: execução do contrato.",
                    "Guardar registros de venda pelos prazos exigidos: cumprimento de obrigação legal.",
                    "Medir o uso do site: consentimento, que você pode recusar ou retirar a qualquer momento pelo banner de cookies.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Como usamos os dados",
            blocks: [
                { kind: "lista", itens: [
                    "Operar o catálogo, o checkout e a entrega dos estudos adquiridos.",
                    "Dar acesso permanente às suas compras na área Minhas compras.",
                    "Enviar notificações transacionais relacionadas à sua conta e às suas compras.",
                    "Operar o CRM para os dados que você mesmo cadastra ou importa.",
                ] },
                { kind: "paragrafo", texto: "Não vendemos dados pessoais de usuários e não usamos os seus dados de conta para treinar modelos." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Com quem compartilhamos",
            blocks: [
                { kind: "paragrafo", texto: "Utilizamos prestadores de serviço para operações específicas, cada um com acesso apenas ao necessário:" },
                { kind: "lista", itens: [
                    "Supabase — banco de dados, autenticação e armazenamento de arquivos.",
                    "Stripe — processamento de pagamentos.",
                    "Resend — envio de e-mails transacionais e de campanha.",
                    "Vercel — hospedagem da aplicação e medição de desempenho.",
                    "Zoho — caixa do endereço de contato.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Transferências internacionais",
            blocks: [
                { kind: "paragrafo", texto: "O banco de dados está hospedado no Brasil. Os demais prestadores listados acima operam infraestrutura em vários países, incluindo Estados Unidos e União Europeia." },
                { kind: "paragrafo", texto: "Se você está na União Europeia, isso significa que seus dados podem ser tratados fora do Espaço Econômico Europeu. O Brasil não possui, nesta data, decisão de adequação da Comissão Europeia." },
            ],
        },
        {
            id: "listas",
            heading: "7. Dados de contato nas listas do catálogo",
            blocks: [
                { kind: "paragrafo", texto: "As listas vendidas no catálogo reúnem dados de contato profissional de empresas: nome da empresa, país, setor, site, e-mails e telefones institucionais. Em algumas listas consta também o nome e o cargo de uma pessoa de contato." },
                { kind: "paragrafo", texto: "Esses dados são obtidos de fontes públicas — sites institucionais, registros empresariais e outras informações de acesso público — e não são coletados junto à própria pessoa." },
                { kind: "paragrafo", texto: "Se você identificou dados seus em uma de nossas listas e quer acessá-los, corrigi-los, se opor ao tratamento ou solicitar a remoção, escreva para contato@easyprospect.com.br. Solicitações desse tipo são atendidas." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Seus direitos",
            blocks: [
                { kind: "paragrafo", texto: "Você pode solicitar, a qualquer momento:" },
                { kind: "lista", itens: [
                    "Acesso aos dados que tratamos sobre você.",
                    "Correção de dados incompletos ou desatualizados.",
                    "Exclusão dos seus dados, ressalvadas as obrigações legais de guarda.",
                    "Portabilidade dos dados que você nos forneceu.",
                    "Oposição a um tratamento e retirada do consentimento, quando for essa a base.",
                ] },
                { kind: "paragrafo", texto: "Basta escrever para contato@easyprospect.com.br. Você também tem o direito de apresentar reclamação a uma autoridade de proteção de dados — a ANPD, no Brasil, ou a autoridade de controle do seu país, na União Europeia." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies e medição",
            blocks: [
                { kind: "paragrafo", texto: "Usamos cookies essenciais para autenticação e para lembrar suas preferências, como idioma. Eles são necessários para o site funcionar e não dependem de consentimento." },
                { kind: "paragrafo", texto: "Cookies de medição de uso só são carregados depois que você aceita, no banner exibido na primeira visita. Recusar não limita nenhuma funcionalidade." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Por quanto tempo guardamos",
            blocks: [
                { kind: "paragrafo", texto: "Mantemos seus dados de conta enquanto ela existir. Após a exclusão da conta, os dados pessoais são removidos ou anonimizados em até 90 dias." },
                { kind: "paragrafo", texto: "Registros de compra são mantidos pelos prazos exigidos pela legislação fiscal, mesmo após a exclusão da conta." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Alterações e contato",
            blocks: [
                { kind: "paragrafo", texto: "Esta política pode ser atualizada. A data no topo indica a última revisão, e alterações relevantes são anunciadas no site." },
                { kind: "paragrafo", texto: "Dúvidas sobre esta política: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyPt
```

- [ ] **Step 2: Conferir que nenhuma seção pendente entrou**

Run: `grep -n "representanteUE\|enderecoPostal\|interesse legítimo\|PENDENTE" content/legal/privacy.pt.ts`
Expected: nenhuma saída.

A ausência de "interesse legítimo" é intencional. A seção 3 lista as bases legais que decorrem diretamente da operação (contrato, obrigação legal, consentimento) e **não** afirma fundamento para o tratamento das listas — isso é decisão de advogado, registrada em `PENDENCIAS_ACEITAS` como `privacy.baseLegal.listas`. A seção 7 descreve a prática factualmente, sem qualificá-la juridicamente.

- [ ] **Step 3: Commit**

```bash
git add content/legal/privacy.pt.ts
git commit -m "feat(legal): politica de privacidade em portugues com estrutura de GDPR"
```

---

### Task 3: Termos de uso em português

Parte das 9 seções atuais, ajusta o que mudou e mantém `foroLei` fora, por ser pendência.

**Files:**
- Create: `content/legal/terms.pt.ts`

**Interfaces:**
- Consumes: `LegalDocument` de `./types`
- Produces: `default` export de `LegalDocument` com 9 seções publicadas

- [ ] **Step 1: Escrever o documento**

`content/legal/terms.pt.ts`:

```ts
import type { LegalDocument } from "./types"

const termsPt: LegalDocument = {
    title: "Termos de Uso",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aceitação dos termos",
            blocks: [
                { kind: "paragrafo", texto: "O Easy Prospect é operado por Werner Wild Saboia Carvalho Marinho, pessoa física. Ao acessar ou usar o serviço, você concorda com estes termos. Se não concordar, não utilize o serviço." },
            ],
        },
        {
            id: "conta",
            heading: "2. Cadastro e conta",
            blocks: [
                { kind: "paragrafo", texto: "Você é responsável por manter a confidencialidade das suas credenciais. Avise imediatamente se identificar uso não autorizado da sua conta." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Uso aceitável",
            blocks: [
                { kind: "paragrafo", texto: "Você concorda em não utilizar o serviço para:" },
                { kind: "lista", itens: [
                    "Enviar spam, phishing ou conteúdo malicioso.",
                    "Tratar dados de contatos sem base legal adequada.",
                    "Tentar acessar dados de outros usuários ou áreas de trabalho.",
                    "Realizar engenharia reversa ou explorar vulnerabilidades.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Propriedade intelectual",
            blocks: [
                { kind: "paragrafo", texto: "Os estudos e listas adquiridos destinam-se ao uso da sua empresa. Não é permitido revendê-los, redistribuí-los ou publicá-los." },
                { kind: "paragrafo", texto: "Os dados que você importa ou cadastra no CRM permanecem sob sua responsabilidade. Não reivindicamos propriedade sobre eles, exceto no necessário para operar o serviço." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Pagamentos e reembolsos",
            blocks: [
                { kind: "paragrafo", texto: "Compras no catálogo são processadas via Stripe. Reembolsos são avaliados caso a caso e podem ser solicitados em até 7 dias após a compra, desde que o arquivo não tenha sido baixado." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitação de responsabilidade",
            blocks: [
                { kind: "paragrafo", texto: "O serviço é fornecido no estado em que se encontra. Não garantimos disponibilidade ininterrupta nem resultado comercial específico: o retorno de um projeto de exportação depende de fatores fora do nosso controle." },
                { kind: "paragrafo", texto: "Nossa responsabilidade limita-se ao valor que você pagou pelo serviço nos últimos 12 meses." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Rescisão",
            blocks: [
                { kind: "paragrafo", texto: "Podemos suspender ou encerrar contas que violem estes termos. Você pode encerrar a sua a qualquer momento pelas configurações da conta; o acesso às compras já realizadas é mantido enquanto a conta existir." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Alterações",
            blocks: [
                { kind: "paragrafo", texto: "Estes termos podem ser atualizados. A data no topo indica a última revisão, e alterações relevantes são anunciadas com antecedência. O uso continuado após a alteração constitui aceitação." },
            ],
        },
        {
            id: "idade",
            heading: "9. Idade mínima",
            blocks: [
                { kind: "paragrafo", texto: "O serviço destina-se a maiores de 18 anos e a uso profissional." },
            ],
        },
    ],
}

export default termsPt
```

- [ ] **Step 2: Conferir que a pendência não entrou**

Run: `grep -n "foroLei\|foro\|lei aplicável" content/legal/terms.pt.ts`
Expected: nenhuma saída. Lei aplicável e foro dependem de advogado e estão em `PENDENCIAS_ACEITAS` como `terms.foroLei`.

- [ ] **Step 3: Commit**

```bash
git add content/legal/terms.pt.ts
git commit -m "feat(legal): termos de uso em portugues"
```

---

### Task 4: Renderizador e migração das rotas

Move as páginas para o segmento de idioma sem mudar URL, tira o `noindex`, emite hreflang e entra no sitemap.

**Files:**
- Create: `components/legal/legal-document.tsx`, `app/[locale]/privacy/page.tsx`, `app/[locale]/terms/page.tsx`
- Delete: `app/(app)/privacy/page.tsx`, `app/(app)/terms/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `messages/*.json` (dois títulos de metadata por documento)

**Interfaces:**
- Consumes: `getLegalDocument` (Task 1), `privacyPt` (Task 2), `termsPt` (Task 3), `alternatesFor` de `@/lib/i18n/alternates`
- Produces: rotas `/{locale}/privacy` e `/{locale}/terms`

- [ ] **Step 1: Criar o renderizador**

`components/legal/legal-document.tsx`. Componente de servidor, sem estado — recebe o documento pronto.

```tsx
import type { LegalDocument } from "@/content/legal"

export function LegalDocumentView({
    document,
    lastUpdatedLabel,
}: {
    document: LegalDocument
    lastUpdatedLabel: string
}) {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{document.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{lastUpdatedLabel}</p>

            <div className="mt-8 space-y-8 text-sm leading-7 text-muted-foreground">
                {document.sections.map((section) => (
                    <section key={section.id}>
                        <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                        {section.blocks.map((block, index) =>
                            block.kind === "paragrafo" ? (
                                <p key={index} className="mt-2">{block.texto}</p>
                            ) : (
                                <ul key={index} className="mt-2 list-disc space-y-1 pl-5">
                                    {block.itens.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )
                        )}
                    </section>
                ))}
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Criar a rota da política**

`app/[locale]/privacy/page.tsx`:

```tsx
import type { Metadata } from "next"
import { getFormatter } from "next-intl/server"
import { getLegalDocument } from "@/content/legal"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { LegalDocumentView } from "@/components/legal/legal-document"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const doc = getLegalDocument("privacy", locale as Locale)

    // Sai o robots: { index: false } que existia antes. Politica de privacidade
    // com noindex enfraquece justamente a pagina que deveria gerar confianca.
    return {
        title: doc.title,
        alternates: alternatesFor("/privacy", locale as Locale),
    }
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const doc = getLegalDocument("privacy", locale as Locale)
    const format = await getFormatter()

    const data = format.dateTime(new Date(`${doc.lastUpdated}T00:00:00Z`), {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    })

    return <LegalDocumentView document={doc} lastUpdatedLabel={`Última atualização: ${data}`} />
}
```

O `new Date` aqui é formatação de uma data **literal vinda do documento**, não geração da data atual — por isso o teste do Step 3 da Task 1 varre só os arquivos `privacy.*.ts` e `terms.*.ts`, não as rotas.

- [ ] **Step 3: Criar a rota dos termos**

`app/[locale]/terms/page.tsx`, idêntica trocando `"privacy"` por `"terms"` e `"/privacy"` por `"/terms"`:

```tsx
import type { Metadata } from "next"
import { getFormatter } from "next-intl/server"
import { getLegalDocument } from "@/content/legal"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { LegalDocumentView } from "@/components/legal/legal-document"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const doc = getLegalDocument("terms", locale as Locale)

    return {
        title: doc.title,
        alternates: alternatesFor("/terms", locale as Locale),
    }
}

export default async function TermsPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const doc = getLegalDocument("terms", locale as Locale)
    const format = await getFormatter()

    const data = format.dateTime(new Date(`${doc.lastUpdated}T00:00:00Z`), {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    })

    return <LegalDocumentView document={doc} lastUpdatedLabel={`Última atualização: ${data}`} />
}
```

- [ ] **Step 4: Remover as páginas antigas**

```bash
git rm "app/(app)/privacy/page.tsx" "app/(app)/terms/page.tsx"
```

- [ ] **Step 5: Acrescentar as rotas ao sitemap**

Em `app/sitemap.ts`, acrescentar ao array `ROUTES`:

```ts
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
```

Se o tipo de `changeFrequency` do array não aceitar `"yearly"`, ampliar a união do tipo local para incluí-lo.

- [ ] **Step 6: Build, para achar import quebrado**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm run build`
Expected: exit 0 nos dois. Erro de rota duplicada significa que sobrou arquivo em `app/(app)/`.

- [ ] **Step 7: Verificar as rotas no navegador**

```bash
npm run dev
```

Conferir, na porta 3001:

| URL | Esperado |
|---|---|
| `/privacy` | 200, em português, com data fixa "29 de julho de 2026" |
| `/terms` | 200, em português |
| `/de/privacy` | 200 — página existe (o conteúdo alemão chega na Task 5; até lá cai no português pelo fallback) |
| `/privacy` no HTML | **sem** `<meta name="robots" content="noindex">` |

Conferir também que o rodapé, o banner de cookies e o link do formulário do FAQ continuam levando às páginas.

- [ ] **Step 8: Commit**

```bash
git add components/legal/legal-document.tsx "app/[locale]/privacy/page.tsx" "app/[locale]/terms/page.tsx" app/sitemap.ts
git commit -m "feat(legal): paginas legais no segmento de idioma, indexaveis e no sitemap"
```

---

### Task 5: Política de privacidade nos outros seis idiomas

Traduz a partir de `content/legal/privacy.pt.ts`, o texto aprovado — **não** do conteúdo antigo de `app/(app)/privacy/page.tsx`, que ficou defasado.

**Files:**
- Create: `content/legal/privacy.de.ts`, `privacy.en.ts`, `privacy.es.ts`, `privacy.fr.ts`, `privacy.it.ts`, `privacy.nl.ts`

**Interfaces:**
- Consumes: `LegalDocument` de `./types`; o documento português da Task 2
- Produces: `default` export de `LegalDocument` em cada arquivo

- [ ] **Step 1: Traduzir**

Cada arquivo espelha `privacy.pt.ts`: mesmo `lastUpdated` (`"2026-07-29"`), **mesmos `id` de seção, na mesma ordem**, mesma quantidade e ordem de blocos. Só `title`, `heading` e os textos mudam.

Regras que valem para os seis:

- **Não acrescentar nem remover seção.** O teste de paridade da Task 1 reprova.
- **Não afirmar base legal para as listas.** A seção 7 descreve a prática; qualificá-la juridicamente é pendência. Se a língua empurrar para uma formulação que soe a fundamento ("com base no interesse legítimo"), reformule.
- **Nomes próprios não se traduzem:** Werner Wild Saboia Carvalho Marinho, Easy Prospect, Supabase, Stripe, Resend, Vercel, Zoho, ANPD.
- **Registro por idioma, seguindo o que cada `messages/<locale>.json` já usa:** `de` formal (`Sie`), `nl` formal (`uw`), `fr` formal (`votre`), `es` formal (`su`), `it` informal (`tuo`), `en` neutro.
- **Termos consagrados:** "autoridade de controle" → `Aufsichtsbehörde` (de), `supervisory authority` (en), `autoridad de control` (es), `autorité de contrôle` (fr), `autorità di controllo` (it), `toezichthoudende autoriteit` (nl).
- **A menção à ANPD e à autoridade do país do usuário permanece nos seis** — o leitor pode estar em qualquer um dos dois regimes.
- Arquivos em **UTF-8 sem BOM**.

- [ ] **Step 2: Rodar os testes**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run content/legal/legal.test.ts`
Expected: as asserções de `privacy` passam nos sete idiomas. As de `terms` ainda falham nos seis — a Task 6 as resolve.

Falha em "mesmas seções que pt" quase sempre é `id` divergente ou ordem trocada.

- [ ] **Step 3: Verificar no navegador**

```bash
npm run dev
```

Expected: `/de/privacy` e `/en/privacy` mostram o texto traduzido, com as 11 seções, sem acento quebrado.

- [ ] **Step 4: Commit**

```bash
git add content/legal/privacy.de.ts content/legal/privacy.en.ts content/legal/privacy.es.ts content/legal/privacy.fr.ts content/legal/privacy.it.ts content/legal/privacy.nl.ts
git commit -m "feat(legal): politica de privacidade nos seis idiomas restantes"
```

---

### Task 6: Termos de uso nos outros seis idiomas

Traduz a partir de `content/legal/terms.pt.ts`.

**Files:**
- Create: `content/legal/terms.de.ts`, `terms.en.ts`, `terms.es.ts`, `terms.fr.ts`, `terms.it.ts`, `terms.nl.ts`

**Interfaces:**
- Consumes: `LegalDocument` de `./types`; o documento português da Task 3
- Produces: `default` export de `LegalDocument` em cada arquivo

- [ ] **Step 1: Traduzir**

Mesmas regras da Task 5: mesmos `id`, mesma ordem, mesmo `lastUpdated`, nomes próprios preservados, registro por idioma, UTF-8 sem BOM.

Específico deste documento:

- **Não acrescentar seção de lei aplicável ou foro.** É pendência (`terms.foroLei`) e o teste reprova se o `id` aparecer.
- "no estado em que se encontra" é a cláusula *as is*: `wie besehen` (de), `as is` (en), `tal cual` (es), `en l'état` (fr), `così com'è` (it), `zoals het is` (nl).
- A limitação de responsabilidade e o prazo de reembolso de 7 dias são compromissos: traduzir literalmente, sem arredondar prazo nem suavizar limite.

- [ ] **Step 2: Rodar a suíte inteira**

Run: `npx vitest run content/legal/legal.test.ts`
Expected: PASS em tudo — os dois documentos, nos sete idiomas.

- [ ] **Step 3: Verificação final**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: exit 0 nos quatro.

- [ ] **Step 4: Commit**

```bash
git add content/legal/terms.de.ts content/legal/terms.en.ts content/legal/terms.es.ts content/legal/terms.fr.ts content/legal/terms.it.ts content/legal/terms.nl.ts
git commit -m "feat(legal): termos de uso nos seis idiomas restantes"
```

---

## Verificação de aceite da fase

Com `npm run dev` na porta 3001:

- [ ] `/terms` e `/privacy` respondem 200 em português, e a URL não mudou
- [ ] `/de/privacy`, `/en/terms` e os demais respondem 200 traduzidos
- [ ] Nenhuma das páginas emite `noindex`
- [ ] `curl -s localhost:3001/sitemap.xml | grep -c "privacy"` retorna 7
- [ ] "Última atualização" mostra 29 de julho de 2026, formatada no idioma da página, e não muda ao recarregar
- [ ] `grep -rn "new Date" content/legal/` não retorna nada
- [ ] Nenhuma seção `representanteUE` ou `foroLei` aparece em qualquer idioma
- [ ] O rodapé, o banner de cookies e o link do formulário do FAQ levam à página no idioma corrente
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` — exit 0
