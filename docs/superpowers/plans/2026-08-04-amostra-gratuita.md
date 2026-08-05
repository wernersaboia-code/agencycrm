# Amostra gratuita na home — plano de implementação

> **ESTE PLANO É O ARTEFATO PRÉ-EXECUÇÃO. O CÓDIGO DIVERGIU DELE — e para melhor.**
>
> A execução (branch `feat/amostra-gratuita`) achou defeitos no próprio plano.
> Quem reexecutar este documento ao pé da letra REINTRODUZ os problemas abaixo.
> A fonte da verdade é o código; este arquivo fica pelo registro do raciocínio.
>
> Divergências que importam:
>
> 1. **Task 5** — o bloco de código abaixo consulta o banco (`freeSample.findFirst`)
>    ANTES do rate limit. Está errado: toda requisição válida consultava o banco sem
>    throttle. A ordem correta, no código, é schema → honeypot → IP → limiter → banco.
> 2. **Task 7** — `prisma.freeSample.findFirst` sem tratamento de erro DERRUBA A HOME
>    enquanto a migração não foi aplicada, que é exatamente a janela do deploy. O código
>    tolera `P2021` (tabela ausente) e relança o resto.
> 3. **Task 8** — `revalidateTag(tag, "max")` NÃO invalida na hora (é
>    stale-while-revalidate). O código usa `updateTag(tag)` em Server Action e
>    `revalidateTag(tag, { expire: 0 })` em Route Handler.
> 4. **Task 8** — `updateMany` + `update` no interruptor precisam de `prisma.$transaction`,
>    senão dois cliques simultâneos deixam duas amostras ativas.
> 5. **`proxy.ts`** — o plano nunca mencionou. Sem `/free-sample` nas duas listas
>    (`marketplaceRoutes` e `nonLocaleSegmentPrefixes`), a rota do link do e-mail é
>    inalcançável: visitante anônimo é mandado ao login. Nenhuma task tocava esse arquivo,
>    então nenhuma revisão por task podia ver — só a revisão final da branch pegou.

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Deixar o visitante baixar um PDF de amostra na home em troca do e-mail, com a seção só existindo quando houver arquivo ativo no super-admin.

**Arquitetura:** Dois modelos novos (`FreeSample` para o arquivo, `FreeSampleDownload` para quem baixou). A captura é uma server action que espelha `lib/faq/submit-question.ts`: valida, limita por IP em duas camadas, grava, devolve URL assinada de 120 s para o download imediato e dispara o e-mail sem bloquear. O e-mail leva um link com token de 7 dias, porque a URL assinada morreria antes de ele abrir a caixa. A seção da home consulta o `FreeSample` ativo através de cache com tag e retorna `null` quando não há nenhum.

**Stack:** Next.js 16 (App Router, server actions), Prisma, Supabase Storage (bucket privado), zod, next-intl, vitest.

## Restrições globais

- **Idiomas do funil público: 7** — `pt, en, es, fr, de, it, nl`. Toda chave nova em `messages/` entra nos sete, senão `lib/i18n/messages-integridade.test.ts` reprova.
- **Idiomas do painel admin: 3** — `pt, en, de`. Os outros quatro não têm bloco `admin` e isso é intencional; não criar.
- **`vitest.config.ts` só coleta `**/*.test.ts`** — não `.tsx`. Não planejar teste de componente.
- **Nunca `git add -A`** neste repo: trabalho paralelo convive na árvore. Sempre listar os caminhos.
- **IA nunca como argumento de venda** em texto voltado ao cliente.
- **Sem número sem base:** não afirmar quantidade de contatos da amostra em texto nenhum.
- Comentários e mensagens de commit **em português**, seguindo o repo: explicam o *porquê*, não o *o quê*.

### Fatos do ambiente (medidos em execuções anteriores — não reinvestigar)

- Node v24.18.0. Antes de qualquer `npm`/`npx`: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Linha de base da suíte: 64 arquivos, 591 testes passando** (medido em 744465f).
- **`npm run lint` com exit 0 é INATINGÍVEL**: 2378 erros e 112.585 avisos pré-existentes,
  quase todos de builds antigos em `.claude/worktrees`. Critério: `npx eslint <arquivos tocados>`.
- Vitest: `include` é `**/*.test.ts` (não `.tsx`), ambiente node, **não carrega `.env`** e
  **nenhum teste toca o banco**. Não existe teste de componente React neste repositório.
- Dev server **só pelo preview** (`.claude/launch.json`, porta 3001), nunca por Bash.
  `npm run build` exige o dev server PARADO (EPERM no query engine do Prisma).
- **Nunca `git add <diretório>`** — já arrastou arquivo não rastreado do Werner para um commit.
  Sempre listar caminhos de arquivo.

### Regra de processo (decidida pelo Werner)

**Comando bloqueado é PARADA e escalação, nunca tentativa por outro caminho.** Trocar de
shell (Bash → PowerShell) para driblar uma negativa anula o mecanismo que existe para
consultar o Werner. Comando bloqueado: reportar BLOCKED e parar.

---

### Task 1: Modelos e migração

**Arquivos:**
- Modificar: `prisma/schema.prisma` (ao lado de `FaqSubmission`, ~linha 801)
- Criar: `prisma/migrations/20260805100000_amostra_gratuita/migration.sql`

**Interfaces:**
- Consome: nada.
- Produz: `prisma.freeSample` e `prisma.freeSampleDownload`. Campos de `FreeSample`: `id, filePath, fileName, isActive, createdAt, updatedAt`. Campos de `FreeSampleDownload`: `id, email, consent, locale, token, tokenExpiresAt, ip, userAgent, createdAt`.

- [ ] **Passo 1: Acrescentar os modelos ao schema**

Colar em `prisma/schema.prisma`, logo depois do bloco `model FaqSubmission { ... }`:

```prisma
// ==================== AMOSTRA GRATUITA ====================

/**
 * O PDF de amostra oferecido na home. Uma linha ativa por vez.
 *
 * Sem linha ativa a seção da home não renderiza — é o interruptor da feature,
 * no lugar de uma variável de ambiente, para ligar e desligar sem deploy.
 *
 * Os textos da seção NÃO moram aqui: ficam em `messages/<locale>.json` sob
 * `landing.freeSample.*`, como o resto do site.
 */
model FreeSample {
  id        String   @id @default(cuid())
  filePath  String
  fileName  String
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("free_samples")
}

/**
 * Quem pediu a amostra. Mesma forma do FaqSubmission, inclusive o índice
 * [ip, createdAt] de que o backstop de rate limit depende.
 *
 * `consent` é a finalidade única (receber o arquivo). Não é aceite de
 * marketing: nada é disparado automaticamente para esta tabela.
 */
model FreeSampleDownload {
  id             String   @id @default(cuid())
  email          String
  consent        Boolean
  locale         String
  token          String   @unique
  tokenExpiresAt DateTime
  ip             String?
  userAgent      String?
  createdAt      DateTime @default(now())

  @@index([email])
  @@index([ip, createdAt])
  @@index([token])
  @@map("free_sample_downloads")
}
```

- [ ] **Passo 2: Escrever a migração**

Criar `prisma/migrations/20260805100000_amostra_gratuita/migration.sql`:

```sql
-- Amostra gratuita na home: o arquivo e quem o baixou.

CREATE TABLE "free_samples" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "free_samples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "free_sample_downloads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "locale" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "free_sample_downloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "free_sample_downloads_token_key" ON "free_sample_downloads"("token");
CREATE INDEX "free_sample_downloads_email_idx" ON "free_sample_downloads"("email");
CREATE INDEX "free_sample_downloads_ip_createdAt_idx" ON "free_sample_downloads"("ip", "createdAt");
CREATE INDEX "free_sample_downloads_token_idx" ON "free_sample_downloads"("token");

-- RLS ligado sem policy, como nas outras 26 tabelas: a chave anônima do
-- Supabase vai no bundle do navegador, e todo acesso da aplicação passa pelo
-- Prisma como `postgres`, que ignora RLS.
ALTER TABLE "free_samples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "free_sample_downloads" ENABLE ROW LEVEL SECURITY;
```

- [ ] **Passo 3: Gerar o client e conferir que compila**

```bash
npx prisma generate && npx tsc --noEmit
```

Esperado: sem saída de erro. Se `tsc` reclamar de `prisma.freeSample` inexistente, o `generate` não pegou o schema — reconferir o Passo 1.

- [ ] **Passo 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260805100000_amostra_gratuita/migration.sql
git commit -m "feat(amostra): modelos FreeSample e FreeSampleDownload"
```

> **Não aplicar a migração ainda.** Ela vai junto com o deploy, no fim do plano (Task 9).

---

### Task 2: Validação do formulário

**Arquivos:**
- Criar: `lib/validations/free-sample.ts`
- Criar (teste): `lib/validations/free-sample.test.ts`

**Interfaces:**
- Consome: nada.
- Produz: `freeSampleRequestSchema` (zod) e `type FreeSampleRequestValues = { email: string; consent: true; locale: "pt"|"en"|"es"|"fr"|"de"|"it"|"nl"; website?: string }`.

- [ ] **Passo 1: Escrever o teste que falha**

Criar `lib/validations/free-sample.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { freeSampleRequestSchema } from "./free-sample"

const valido = { email: "werner@example.com", consent: true as const, locale: "pt" as const }

describe("freeSampleRequestSchema", () => {
    it("aceita e-mail com consentimento", () => {
        expect(freeSampleRequestSchema.parse(valido).email).toBe("werner@example.com")
    })

    it("recusa e-mail inválido", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, email: "nao-e-email" })).toThrow()
    })

    // Sem consentimento não há finalidade para guardar o endereço.
    it("recusa consentimento ausente ou falso", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, consent: false })).toThrow()
        expect(() => freeSampleRequestSchema.parse({ email: valido.email, locale: "pt" })).toThrow()
    })

    it("aceita os sete idiomas publicados", () => {
        for (const locale of ["pt", "en", "es", "fr", "de", "it", "nl"] as const) {
            expect(freeSampleRequestSchema.parse({ ...valido, locale }).locale).toBe(locale)
        }
    })

    // O árabe é roteável mas não tem tradução da landing, então o formulário
    // nunca envia esse valor.
    it("recusa locale sem tradução", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, locale: "ar" })).toThrow()
    })

    it("cai no pt quando o locale não vem", () => {
        expect(freeSampleRequestSchema.parse({ email: valido.email, consent: true }).locale).toBe("pt")
    })

    // Mesmo desenho do honeypot do FAQ: o schema ACEITA conteúdo aqui, e quem
    // descarta é a action. Com `.max(0)` o bot receberia erro de validação, o
    // que lhe diz que o campo é armadilha.
    it("aceita o honeypot preenchido, para a action poder fingir sucesso", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, website: "http://spam.example" })).not.toThrow()
    })
})
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run lib/validations/free-sample.test.ts
```

Esperado: FAIL — `Failed to load ./free-sample` (o módulo ainda não existe).

- [ ] **Passo 3: Escrever o schema**

Criar `lib/validations/free-sample.ts`:

```ts
// lib/validations/free-sample.ts

import { z } from "zod"

/**
 * Pedido da amostra gratuita. Só e-mail e consentimento: nome e empresa são
 * atrito num formulário cuja única função é provar o produto, e o endereço já
 * basta para começar a conversa.
 */
export const freeSampleRequestSchema = z.object({
    email: z.string().email().max(320),
    // `literal(true)` e não `boolean()`: caixa desmarcada precisa reprovar,
    // não gravar `consent: false`. Sem consentimento não há finalidade para
    // guardar o endereço.
    consent: z.literal(true),
    // Honeypot: campo invisível para humanos. Aceita conteúdo de propósito —
    // quem descarta é a action, respondendo sucesso sem gravar. Rejeitar aqui
    // devolveria erro de validação ao bot, avisando que o campo é armadilha.
    website: z.string().max(200).optional(),
    // Mantido à mão em sincronia com LandingLocale (components/landing/types.ts):
    // importar aquele tipo puxaria código de componente para validação server-side.
    locale: z.enum(["pt", "de", "en", "es", "fr", "it", "nl"]).default("pt"),
})

export type FreeSampleRequestValues = z.infer<typeof freeSampleRequestSchema>
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run lib/validations/free-sample.test.ts
```

Esperado: PASS, 7 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/validations/free-sample.ts lib/validations/free-sample.test.ts
git commit -m "feat(amostra): validação do pedido, com honeypot que não se anuncia"
```

---

### Task 3: Token de download

**Arquivos:**
- Criar: `lib/free-sample/token.ts`
- Criar (teste): `lib/free-sample/token.test.ts`

**Interfaces:**
- Consome: nada.
- Produz: `gerarToken(): string`, `calcularExpiracao(agora: Date): Date`, `tokenValido(expiresAt: Date, agora: Date): boolean`, e a constante `VALIDADE_TOKEN_MS`.

- [ ] **Passo 1: Escrever o teste que falha**

Criar `lib/free-sample/token.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { gerarToken, calcularExpiracao, tokenValido, VALIDADE_TOKEN_MS } from "./token"

describe("gerarToken", () => {
    it("gera token longo o bastante para não ser adivinhado", () => {
        expect(gerarToken().length).toBeGreaterThanOrEqual(32)
    })

    it("não repete", () => {
        const tokens = new Set(Array.from({ length: 500 }, () => gerarToken()))
        expect(tokens.size).toBe(500)
    })

    // Vai numa URL de e-mail: caractere que precise de escape quebra o link em
    // clientes que reescrevem endereços.
    it("usa só caracteres seguros para URL", () => {
        for (let i = 0; i < 50; i++) {
            expect(gerarToken()).toMatch(/^[A-Za-z0-9_-]+$/)
        }
    })
})

describe("calcularExpiracao", () => {
    it("soma a validade à data dada", () => {
        const agora = new Date("2026-08-05T12:00:00.000Z")
        expect(calcularExpiracao(agora).getTime()).toBe(agora.getTime() + VALIDADE_TOKEN_MS)
    })

    it("vale sete dias", () => {
        expect(VALIDADE_TOKEN_MS).toBe(7 * 24 * 60 * 60 * 1000)
    })
})

describe("tokenValido", () => {
    const agora = new Date("2026-08-05T12:00:00.000Z")

    it("é válido antes de expirar", () => {
        expect(tokenValido(new Date(agora.getTime() + 1000), agora)).toBe(true)
    })

    it("é inválido depois de expirar", () => {
        expect(tokenValido(new Date(agora.getTime() - 1000), agora)).toBe(false)
    })

    // Limite exato: expirar "agora" já não vale. O contrário deixaria uma
    // janela de um milissegundo que ninguém consegue testar em produção.
    it("é inválido no instante exato da expiração", () => {
        expect(tokenValido(agora, agora)).toBe(false)
    })
})
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run lib/free-sample/token.test.ts
```

Esperado: FAIL — módulo `./token` não encontrado.

- [ ] **Passo 3: Escrever o módulo**

Criar `lib/free-sample/token.ts`:

```ts
// lib/free-sample/token.ts

import { randomBytes } from "node:crypto"

/**
 * Sete dias. O link vai por e-mail e precisa sobreviver a quem só abre a caixa
 * na segunda-feira — a URL assinada do bucket, que dura 120 s, morreria antes.
 */
export const VALIDADE_TOKEN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * `base64url` e não `hex`: mesma entropia em menos caracteres, e sem `+`, `/`
 * nem `=`, que alguns clientes de e-mail escapam ao reescrever o link.
 */
export function gerarToken(): string {
    return randomBytes(32).toString("base64url")
}

export function calcularExpiracao(agora: Date): Date {
    return new Date(agora.getTime() + VALIDADE_TOKEN_MS)
}

export function tokenValido(expiresAt: Date, agora: Date): boolean {
    return expiresAt.getTime() > agora.getTime()
}
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run lib/free-sample/token.test.ts
```

Esperado: PASS, 8 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/free-sample/token.ts lib/free-sample/token.test.ts
git commit -m "feat(amostra): token de download com validade de sete dias"
```

---

### Task 4: Storage do PDF

**Arquivos:**
- Criar: `lib/supabase/free-sample.ts`

**Interfaces:**
- Consome: `createAdminClient` de `@/lib/supabase/admin`. **NÃO consome `validatePdfFile`** —
  a validação de tipo e tamanho é do CHAMADOR (a rota de upload da Task 8), não desta camada.
  Este módulo sobe o que lhe derem.
- Produz: `FREE_SAMPLE_BUCKET = "free-sample"`, `uploadFreeSample(file: File): Promise<{ path: string }>`, `removeFreeSample(path: string): Promise<void>`, `createFreeSampleSignedUrl(path: string, expiresInSeconds?: number): Promise<string>`.

Este módulo é I/O puro contra o Supabase; não leva teste unitário, pelo mesmo motivo que `lib/supabase/list-studies.ts` não tem.

- [ ] **Passo 1: Conferir o bucket (JÁ CRIADO)**

O bucket `free-sample` já foi criado como **privado**, antes da execução começar.
Nada a fazer — apenas não presumir que ele é público: todo acesso é por URL assinada.

- [ ] **Passo 2: Escrever o módulo**

Criar `lib/supabase/free-sample.ts`:

```ts
// lib/supabase/free-sample.ts
import { createAdminClient } from "@/lib/supabase/admin"

export const FREE_SAMPLE_BUCKET = "free-sample"

/** Extrai o caminho relativo ao bucket a partir de uma URL de storage ou de um caminho. */
export function extractFreeSamplePath(publicOrPath: string): string {
    const marker = `/${FREE_SAMPLE_BUCKET}/`
    const idx = publicOrPath.indexOf(marker)
    if (idx === -1) return publicOrPath
    return publicOrPath.slice(idx + marker.length).split("?")[0]
}

/**
 * Sobe o PDF da amostra. O nome carrega timestamp para não colidir com o
 * arquivo anterior enquanto ele ainda está sendo servido.
 */
export async function uploadFreeSample(file: File): Promise<{ path: string }> {
    const supabase = createAdminClient()
    const path = `sample-${Date.now()}.pdf`

    const { error } = await supabase.storage
        .from(FREE_SAMPLE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" })

    if (error) throw new Error(`Falha no upload da amostra: ${error.message}`)

    return { path }
}

export async function removeFreeSample(path: string): Promise<void> {
    const supabase = createAdminClient()
    await supabase.storage.from(FREE_SAMPLE_BUCKET).remove([extractFreeSamplePath(path)])
}

/**
 * URL assinada para o download imediato, logo após o envio do formulário.
 *
 * 120 s serve para o navegador começar a baixar e não serve para o e-mail —
 * é por isso que a cópia por e-mail leva `/free-sample/<token>`, que gera uma
 * URL nova na hora em que o link é aberto.
 */
export async function createFreeSampleSignedUrl(
    path: string,
    expiresInSeconds = 120
): Promise<string> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
        .from(FREE_SAMPLE_BUCKET)
        .createSignedUrl(extractFreeSamplePath(path), expiresInSeconds)

    if (error || !data) throw new Error(`Falha ao gerar link da amostra: ${error?.message}`)
    return data.signedUrl
}
```

- [ ] **Passo 3: Conferir que compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Passo 4: Commit**

```bash
git add lib/supabase/free-sample.ts
git commit -m "feat(amostra): bucket privado do PDF, com URL assinada curta"
```

---

### Task 5: Server action da captura

**Arquivos:**
- Criar: `lib/http/client-ip.ts`
- Criar (teste): `lib/http/client-ip.test.ts`
- Modificar: `lib/faq/submit-question.ts` (apagar a função local, importar do módulo novo)
- Criar: `lib/free-sample/request-download.ts`
- Criar (teste): `lib/free-sample/request-download.test.ts`

**Interfaces:**
- Consome: `freeSampleRequestSchema` (Task 2); `gerarToken`, `calcularExpiracao` (Task 3); `createFreeSampleSignedUrl` (Task 4); `sendEmail` de `@/lib/email`; `getSystemSmtpConfig` de `@/lib/email/system-smtp`; `rateLimit` de `@/lib/rate-limit`.
- Produz também: `getClientIpFromHeaders(h: Headers): string` em `@/lib/http/client-ip`, agora compartilhado com `lib/faq/submit-question.ts`.
- Produz: `requestFreeSample(input: unknown): Promise<RequestFreeSampleResult>` onde `RequestFreeSampleResult = { success: true; downloadUrl?: string } | { success: false; error: "invalid" | "rate_limited" | "unavailable" | "unknown" }`.

- [ ] **Passo 1: Extrair o leitor de IP para módulo compartilhado**

`getClientIpFromHeaders` hoje é uma função privada dentro de
`lib/faq/submit-question.ts`. Esta task seria o segundo consumidor, e copiá-la
faria com que uma futura mudança no jeito de ler o IP (proxy novo, header novo)
precisasse ser feita em dois lugares — e um deles seria esquecido.

Criar `lib/http/client-ip.ts`:

```ts
// lib/http/client-ip.ts

/**
 * IP do cliente a partir dos headers da requisição.
 *
 * `x-forwarded-for` pode trazer uma cadeia de proxies (`cliente, proxy1,
 * proxy2`); o primeiro item é o cliente original. Usado como identificador de
 * rate limit, então o fallback "anonymous" agrupa todo mundo sem IP no mesmo
 * balde — deliberado: quem esconde o IP não ganha um balde exclusivo.
 */
export function getClientIpFromHeaders(h: Headers): string {
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    return h.get("x-real-ip") || "anonymous"
}
```

Criar `lib/http/client-ip.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { getClientIpFromHeaders } from "./client-ip"

describe("getClientIpFromHeaders", () => {
    it("lê x-forwarded-for", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.1" })))
            .toBe("203.0.113.1")
    })

    // A cadeia de proxies vem em ordem: o cliente original é o primeiro.
    // Pegar o último devolveria o IP do nosso próprio proxy, e o rate limit
    // passaria a contar o mundo inteiro num balde só.
    it("pega o primeiro da cadeia de proxies", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178" })))
            .toBe("203.0.113.1")
    })

    it("apara espaço em volta", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "  203.0.113.1  , 70.41.3.18" })))
            .toBe("203.0.113.1")
    })

    it("cai para x-real-ip", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.7" })))
            .toBe("198.51.100.7")
    })

    it("prefere x-forwarded-for quando os dois vêm", () => {
        expect(getClientIpFromHeaders(new Headers({
            "x-forwarded-for": "203.0.113.1",
            "x-real-ip": "198.51.100.7",
        }))).toBe("203.0.113.1")
    })

    it("devolve anonymous sem header nenhum", () => {
        expect(getClientIpFromHeaders(new Headers())).toBe("anonymous")
    })
})
```

Em `lib/faq/submit-question.ts`: **apagar** a função local `getClientIpFromHeaders`
(as 7 linhas, logo depois do bloco de constantes de rate limit) e acrescentar o import:

```ts
import { getClientIpFromHeaders } from "@/lib/http/client-ip"
```

- [ ] **Passo 2: Provar que a extração não mudou o comportamento do FAQ**

```bash
npx vitest run lib/http/client-ip.test.ts lib/faq/submit-question.test.ts
```

Esperado: PASS nos dois arquivos. Os testes do FAQ são pré-existentes e **não podem ser
alterados** — é isso que prova que a extração preservou o comportamento.

- [ ] **Passo 3: Commit da extração**

```bash
git add lib/http/client-ip.ts lib/http/client-ip.test.ts lib/faq/submit-question.ts
git commit -m "refactor(http): extrai o leitor de IP do cliente para módulo próprio"
```

- [ ] **Passo 4: Escrever o teste que falha**

Criar `lib/free-sample/request-download.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Banco, storage e e-mail são I/O e ficam fora do teste unitário. O que
// interessa aqui é a DECISÃO tomada antes deles.
const prismaMock = vi.hoisted(() => ({
    freeSample: { findFirst: vi.fn() },
    freeSampleDownload: { count: vi.fn(), create: vi.fn() },
}))

const sendEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }))
const signedUrlMock = vi.hoisted(() => vi.fn().mockResolvedValue("https://storage/assinada"))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }))
vi.mock("@/lib/email/system-smtp", () => ({ getSystemSmtpConfig: vi.fn().mockReturnValue({}) }))
vi.mock("@/lib/supabase/free-sample", () => ({ createFreeSampleSignedUrl: signedUrlMock }))
vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.1" })),
}))

import { requestFreeSample } from "./request-download"

const valido = { email: "werner@example.com", consent: true as const, locale: "pt" as const }
const amostraAtiva = { id: "s1", filePath: "sample-1.pdf", fileName: "amostra.pdf" }

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.freeSample.findFirst.mockResolvedValue(amostraAtiva)
    prismaMock.freeSampleDownload.count.mockResolvedValue(0)
    prismaMock.freeSampleDownload.create.mockResolvedValue({})
    signedUrlMock.mockResolvedValue("https://storage/assinada")
    sendEmailMock.mockResolvedValue({ success: true })
})

describe("requestFreeSample", () => {
    it("grava o pedido e devolve a URL de download", async () => {
        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: true, downloadUrl: "https://storage/assinada" })
        expect(prismaMock.freeSampleDownload.create).toHaveBeenCalledOnce()
    })

    it("recusa e-mail inválido sem tocar no banco", async () => {
        const r = await requestFreeSample({ ...valido, email: "xx" })

        expect(r).toEqual({ success: false, error: "invalid" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // Honeypot: responder sucesso sem efeito algum, para não dar sinal ao bot.
    it("finge sucesso e não grava quando o honeypot vem preenchido", async () => {
        const r = await requestFreeSample({ ...valido, website: "http://spam.example" })

        expect(r).toEqual({ success: true })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // Sem arquivo ativo a seção nem deveria estar na tela; se chegou aqui é
    // formulário de página aberta antes de o admin desligar.
    it("responde unavailable quando não há amostra ativa", async () => {
        prismaMock.freeSample.findFirst.mockResolvedValue(null)

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: false, error: "unavailable" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    it("bloqueia quando o mesmo IP passou do limite persistido", async () => {
        prismaMock.freeSampleDownload.count.mockResolvedValue(5)

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: false, error: "rate_limited" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // ESTE É O PONTO DA FEATURE: o envio de e-mail é frágil (o .env autentica
    // no Gmail enquanto o contato@ é Zoho). Se o download dependesse dele, a
    // falha seria silenciosa — o visitante deixaria o contato e não receberia
    // nada.
    it("entrega o download mesmo quando o e-mail falha", async () => {
        sendEmailMock.mockResolvedValue({ success: false, error: "SMTP recusou" })

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: true, downloadUrl: "https://storage/assinada" })
        expect(prismaMock.freeSampleDownload.create).toHaveBeenCalledOnce()
    })

    it("grava o consentimento e o idioma junto do e-mail", async () => {
        await requestFreeSample({ ...valido, locale: "de" })

        const gravado = prismaMock.freeSampleDownload.create.mock.calls[0][0].data
        expect(gravado.email).toBe("werner@example.com")
        expect(gravado.consent).toBe(true)
        expect(gravado.locale).toBe("de")
        expect(gravado.token).toEqual(expect.any(String))
        expect(gravado.tokenExpiresAt).toBeInstanceOf(Date)
    })
})
```

- [ ] **Passo 5: Rodar e ver falhar**

```bash
npx vitest run lib/free-sample/request-download.test.ts
```

Esperado: FAIL — módulo `./request-download` não encontrado.

- [ ] **Passo 6: Escrever a action**

Criar `lib/free-sample/request-download.ts`:

```ts
// lib/free-sample/request-download.ts
"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { getSystemSmtpConfig } from "@/lib/email/system-smtp"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIpFromHeaders } from "@/lib/http/client-ip"
import { freeSampleRequestSchema } from "@/lib/validations/free-sample"
import { gerarToken, calcularExpiracao } from "./token"

export type RequestFreeSampleResult =
    | { success: true; downloadUrl?: string }
    | { success: false; error: "invalid" | "rate_limited" | "unavailable" | "unknown" }

// Janela em memória (por instância): 3 pedidos a cada 10 minutos por IP.
const limiter = rateLimit(500)
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
// Backstop persistido (cobre múltiplas instâncias serverless): 5 por hora por IP.
const DB_BACKSTOP_MAX = 5
const DB_BACKSTOP_WINDOW_MS = 60 * 60 * 1000

export async function requestFreeSample(input: unknown): Promise<RequestFreeSampleResult> {
    const parsed = freeSampleRequestSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid" }
    }
    const data = parsed.data

    // Honeypot preenchido: sucesso sem efeito algum, para não dar sinal ao bot.
    if (data.website) {
        return { success: true }
    }

    const amostra = await prisma.freeSample.findFirst({ where: { isActive: true } })
    if (!amostra) {
        // A seção só renderiza com amostra ativa, então chegar aqui significa
        // formulário de página aberta antes de o admin desligar.
        return { success: false, error: "unavailable" }
    }

    const requestHeaders = await headers()
    const ip = getClientIpFromHeaders(requestHeaders)
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null

    try {
        await limiter.check(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    } catch {
        return { success: false, error: "rate_limited" }
    }

    const token = gerarToken()

    try {
        const recentes = await prisma.freeSampleDownload.count({
            where: { ip, createdAt: { gt: new Date(Date.now() - DB_BACKSTOP_WINDOW_MS) } },
        })
        if (recentes >= DB_BACKSTOP_MAX) {
            return { success: false, error: "rate_limited" }
        }

        await prisma.freeSampleDownload.create({
            data: {
                email: data.email,
                consent: data.consent,
                locale: data.locale,
                token,
                tokenExpiresAt: calcularExpiracao(new Date()),
                ip,
                userAgent,
            },
        })
    } catch (error) {
        console.error("Erro ao registrar pedido da amostra:", error)
        return { success: false, error: "unknown" }
    }

    // O download é o que a pessoa pediu, e ele NÃO depende do e-mail sair.
    // O envio do sistema é frágil (o .env pode estar autenticando num provedor
    // diferente do domínio do remetente); se dependesse dele, a falha seria
    // silenciosa — contato capturado e visitante de mãos vazias.
    let downloadUrl: string | undefined
    try {
        downloadUrl = await createFreeSampleSignedUrl(amostra.filePath)
    } catch (error) {
        console.error("Erro ao gerar URL assinada da amostra:", error)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const linkPorEmail = `${baseUrl}/free-sample/${token}`
    const resultadoEmail = await sendEmail(
        {
            to: data.email,
            subject: "Sua amostra do Easy Prospect",
            html: `
                <p>Obrigado pelo interesse.</p>
                <p><a href="${linkPorEmail}">Baixe a amostra aqui</a>.</p>
                <p>O link vale por sete dias.</p>
            `,
        },
        getSystemSmtpConfig()
    )
    if (!resultadoEmail.success) {
        // Vai para o Sentry pelo console.error, em vez de morrer calada.
        console.error("Falha ao enviar a cópia da amostra por e-mail:", resultadoEmail.error)
    }

    return { success: true, downloadUrl }
}
```

- [ ] **Passo 7: Rodar e ver passar**

```bash
npx vitest run lib/free-sample/request-download.test.ts
```

Esperado: PASS, 7 testes.

- [ ] **Passo 8: Commit**

```bash
git add lib/free-sample/request-download.ts lib/free-sample/request-download.test.ts
git commit -m "feat(amostra): captura do e-mail, com download que não depende do envio"
```

---

### Task 6: Rota do link do e-mail

**Arquivos:**
- Criar: `app/free-sample/[token]/route.ts`

**Interfaces:**
- Consome: `tokenValido` (Task 3); `createFreeSampleSignedUrl` (Task 4).
- Produz: `GET /free-sample/<token>` → 302 para a URL assinada, ou 404.

- [ ] **Passo 1: Escrever a rota**

Criar `app/free-sample/[token]/route.ts`:

```ts
// app/free-sample/[token]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { tokenValido } from "@/lib/free-sample/token"

/**
 * Link que vai no e-mail. Existe porque a URL assinada do bucket dura 120 s e
 * chegaria morta a quem abre a caixa no dia seguinte: aqui o token é validado
 * e uma URL nova é gerada na hora.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const pedido = await prisma.freeSampleDownload.findUnique({ where: { token } })
        // Token inexistente e token vencido devolvem a MESMA resposta: distinguir
        // os dois diria a quem varre tokens quais deles já existiram.
        if (!pedido || !tokenValido(pedido.tokenExpiresAt, new Date())) {
            return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 })
        }

        const amostra = await prisma.freeSample.findFirst({ where: { isActive: true } })
        if (!amostra) {
            return NextResponse.json({ error: "Amostra indisponível" }, { status: 404 })
        }

        return NextResponse.redirect(await createFreeSampleSignedUrl(amostra.filePath))
    } catch (error) {
        console.error("Erro ao servir a amostra por token:", error)
        return NextResponse.json({ error: "Falha no download" }, { status: 500 })
    }
}
```

- [ ] **Passo 2: Conferir que compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Passo 3: Commit**

```bash
git add "app/free-sample/[token]/route.ts"
git commit -m "feat(amostra): rota do link enviado por e-mail, com token de sete dias"
```

---

### Task 7: Seção da home

**Arquivos:**
- Criar: `lib/free-sample/amostra-ativa.ts`
- Criar: `components/landing/free-sample-section.tsx`
- Criar: `components/landing/free-sample-form.tsx`
- Modificar: `app/[locale]/page.tsx` (importar e inserir entre `DeliverablesSection` e `DataQualitySection`, ~linha 80)
- Modificar: `messages/pt.json`, `en`, `es`, `fr`, `de`, `it`, `nl`

**Interfaces:**
- Consome: `requestFreeSample` (Task 5).
- Produz: `getAmostraAtiva(): Promise<{ id: string; fileName: string } | null>`, `TAG_AMOSTRA = "free-sample"`, e `<FreeSampleSection locale={locale} />`.

- [ ] **Passo 1: Escrever a consulta em cache**

Criar `lib/free-sample/amostra-ativa.ts`:

```ts
// lib/free-sample/amostra-ativa.ts
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/** Tag revalidada quando o admin liga, desliga ou troca o arquivo. */
export const TAG_AMOSTRA = "free-sample"

/**
 * A amostra ativa, ou `null` quando não há nenhuma.
 *
 * Em cache com tag porque isso entra na HOME, que é a página mais visitada e
 * já teve problema de renderização dinâmica: sem cache, cada visita pagaria
 * uma ida ao banco para descobrir algo que muda uma vez por mês.
 */
export const getAmostraAtiva = unstable_cache(
    async () => {
        return prisma.freeSample.findFirst({
            where: { isActive: true },
            select: { id: true },
        })
    },
    ["free-sample-ativa"],
    { tags: [TAG_AMOSTRA] }
)
```

- [ ] **Passo 2: Escrever o formulário (client)**

Criar `components/landing/free-sample-form.tsx`:

```tsx
// components/landing/free-sample-form.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "@/lib/i18n/navigation"
import { requestFreeSample } from "@/lib/free-sample/request-download"
import type { LandingLocale } from "./types"

type Estado = "idle" | "enviando" | "ok" | "erro"

export function FreeSampleForm({ locale }: { locale: LandingLocale }) {
    const t = useTranslations("landing.freeSample")
    const [email, setEmail] = useState("")
    const [consent, setConsent] = useState(false)
    const [website, setWebsite] = useState("") // honeypot
    const [estado, setEstado] = useState<Estado>("idle")
    const [mensagemErro, setMensagemErro] = useState("")

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault()
        setEstado("enviando")

        const r = await requestFreeSample({ email, consent, locale, website })

        if (!r.success) {
            setEstado("erro")
            setMensagemErro(r.error === "rate_limited" ? t("errorRateLimited") : t("errorGeneric"))
            return
        }

        setEstado("ok")
        // O download começa aqui, e não depende de o e-mail sair.
        if (r.downloadUrl) {
            window.location.href = r.downloadUrl
        }
    }

    if (estado === "ok") {
        return (
            <div role="status" className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-5">
                <p className="font-medium text-foreground">{t("successTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("successBody")}</p>
            </div>
        )
    }

    return (
        <form onSubmit={enviar} className="space-y-4">
            {/* Honeypot: invisível para humanos, atraente para bot. `tabIndex={-1}`
                e `autoComplete="off"` para o teclado e o gerenciador de senhas
                nunca chegarem nele. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="free-sample-website">Website</label>
                <input
                    id="free-sample-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    type="email"
                    required
                    aria-label={t("emailLabel")}
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="lg" disabled={estado === "enviando" || !consent}>
                    {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("cta")}
                </Button>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                />
                <span>
                    {t("consent")}{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                        {t("consentLink")}
                    </Link>
                </span>
            </label>

            {estado === "erro" && (
                <p role="alert" className="text-sm text-destructive">{mensagemErro}</p>
            )}
        </form>
    )
}
```

- [ ] **Passo 3: Escrever a seção (server)**

Criar `components/landing/free-sample-section.tsx`:

```tsx
// components/landing/free-sample-section.tsx
import { getTranslations } from "next-intl/server"
import { FileDown } from "lucide-react"
import { Section, SectionHeading } from "./section"
import { FreeSampleForm } from "./free-sample-form"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import type { LandingLocale } from "./types"

/**
 * Só existe quando há amostra ativa no super-admin.
 *
 * Mesma regra do `visibleFacets` do catálogo: seção sem arquivo por trás é
 * promessa que a página não cumpre. Sem `FreeSample` ativo isto devolve `null`
 * e a home fica idêntica ao que era antes da feature — é assim que ela pode
 * ficar publicada e invisível até o arquivo existir.
 */
export async function FreeSampleSection({ locale }: { locale: LandingLocale }) {
    const amostra = await getAmostraAtiva()
    if (!amostra) return null

    const t = await getTranslations({ locale, namespace: "landing.freeSample" })

    return (
        <Section tone="default" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-6">
                <p className="mb-4 flex items-center gap-2.5 text-sm font-medium text-foreground">
                    <FileDown className="h-5 w-5 text-brand-accent-strong" />
                    {t("fileNote")}
                </p>
                <FreeSampleForm locale={locale} />
            </div>
        </Section>
    )
}
```

- [ ] **Passo 4: Inserir na home**

Em `app/[locale]/page.tsx`, acrescentar o import junto aos outros de landing:

```tsx
import { FreeSampleSection } from "@/components/landing/free-sample-section"
```

E inserir o bloco entre `DeliverablesSection` e `DataQualitySection`:

```tsx
            <Suspense fallback={<SectionFallback className="h-64" />}>
                <FreeSampleSection locale={locale} />
            </Suspense>
```

- [ ] **Passo 5: Acrescentar os textos nos sete idiomas**

Em cada `messages/<locale>.json`, dentro do objeto `landing`, acrescentar a chave `freeSample`:

```json
"freeSample": {
    "eyebrow": "Amostra gratuita",
    "title": "Veja um estudo antes de comprar",
    "intro": "Baixe um trecho real de um dos nossos estudos de entrada em mercado e confira o formato, a profundidade e o tipo de informação que você recebe.",
    "fileNote": "Amostra em PDF, download imediato.",
    "emailLabel": "Seu e-mail",
    "emailPlaceholder": "seu@email.com",
    "cta": "Baixar amostra",
    "consent": "Concordo em receber a amostra por e-mail. Não enviamos newsletter.",
    "consentLink": "Política de Privacidade",
    "successTitle": "Pronto — o download começou.",
    "successBody": "Mandamos uma cópia do link para o seu e-mail também.",
    "errorRateLimited": "Muitos pedidos deste endereço. Tente novamente daqui a pouco.",
    "errorGeneric": "Não foi possível concluir agora. Tente novamente em instantes."
}
```

Traduções (mesmas chaves, texto no idioma):

| chave | en | de |
|---|---|---|
| eyebrow | Free sample | Kostenlose Leseprobe |
| title | See a study before you buy | Sehen Sie eine Studie vor dem Kauf |
| intro | Download a real excerpt from one of our market entry studies and check the format, the depth and the kind of information you get. | Laden Sie einen echten Auszug aus einer unserer Markteintrittsstudien herunter und prüfen Sie Format, Tiefe und Art der Informationen. |
| fileNote | PDF sample, immediate download. | PDF-Leseprobe, sofortiger Download. |
| emailLabel | Your email | Ihre E-Mail |
| emailPlaceholder | you@email.com | ihre@email.de |
| cta | Download sample | Leseprobe herunterladen |
| consent | I agree to receive the sample by email. We do not send a newsletter. | Ich stimme zu, die Leseprobe per E-Mail zu erhalten. Wir versenden keinen Newsletter. |
| consentLink | Privacy Policy | Datenschutzerklärung |
| successTitle | Done — your download has started. | Fertig — der Download läuft. |
| successBody | We also sent a copy of the link to your email. | Eine Kopie des Links haben wir Ihnen zusätzlich per E-Mail geschickt. |
| errorRateLimited | Too many requests from this address. Please try again shortly. | Zu viele Anfragen von dieser Adresse. Bitte versuchen Sie es später erneut. |
| errorGeneric | We could not finish right now. Please try again in a moment. | Es hat gerade nicht geklappt. Bitte versuchen Sie es gleich erneut. |

| chave | es | fr | it | nl |
|---|---|---|---|---|
| eyebrow | Muestra gratuita | Échantillon gratuit | Campione gratuito | Gratis voorbeeld |
| title | Vea un estudio antes de comprar | Consultez une étude avant d'acheter | Guarda uno studio prima di acquistare | Bekijk een studie voordat u koopt |
| intro | Descargue un extracto real de uno de nuestros estudios de entrada en el mercado y compruebe el formato, la profundidad y el tipo de información que recibe. | Téléchargez un extrait réel de l'une de nos études d'entrée sur le marché et vérifiez le format, la profondeur et le type d'informations fournies. | Scarica un estratto reale di uno dei nostri studi di ingresso nel mercato e verifica formato, profondità e tipo di informazioni. | Download een echt fragment uit een van onze marktentreestudies en bekijk het formaat, de diepgang en het soort informatie dat u krijgt. |
| fileNote | Muestra en PDF, descarga inmediata. | Échantillon en PDF, téléchargement immédiat. | Campione in PDF, download immediato. | Voorbeeld in pdf, direct downloaden. |
| emailLabel | Su correo | Votre e-mail | La tua email | Uw e-mail |
| emailPlaceholder | su@email.com | vous@email.com | tua@email.com | uw@email.com |
| cta | Descargar muestra | Télécharger l'échantillon | Scarica il campione | Voorbeeld downloaden |
| consent | Acepto recibir la muestra por correo. No enviamos boletines. | J'accepte de recevoir l'échantillon par e-mail. Nous n'envoyons pas de newsletter. | Accetto di ricevere il campione via email. Non inviamo newsletter. | Ik ga ermee akkoord het voorbeeld per e-mail te ontvangen. We sturen geen nieuwsbrief. |
| consentLink | Política de Privacidad | Politique de confidentialité | Informativa sulla privacy | Privacybeleid |
| successTitle | Listo: la descarga ha comenzado. | C'est fait — le téléchargement a démarré. | Fatto: il download è iniziato. | Klaar — de download is gestart. |
| successBody | También enviamos una copia del enlace a su correo. | Nous avons aussi envoyé une copie du lien à votre e-mail. | Abbiamo inviato una copia del link anche alla tua email. | We hebben ook een kopie van de link naar uw e-mail gestuurd. |
| errorRateLimited | Demasiadas solicitudes desde esta dirección. Inténtelo de nuevo en unos minutos. | Trop de demandes depuis cette adresse. Réessayez dans quelques instants. | Troppe richieste da questo indirizzo. Riprova tra poco. | Te veel aanvragen van dit adres. Probeer het straks opnieuw. |
| errorGeneric | No se pudo completar ahora. Inténtelo de nuevo en un momento. | Impossible de terminer pour l'instant. Réessayez dans un instant. | Non è stato possibile completare ora. Riprova tra un momento. | Het is nu niet gelukt. Probeer het zo opnieuw. |

- [ ] **Passo 6: Rodar a suíte inteira**

```bash
npx tsc --noEmit && npx vitest run
```

Esperado: `tsc` sem saída; todos os testes passando, incluindo `lib/i18n/messages-integridade.test.ts` — é ele que reprova se algum dos sete idiomas ficou sem uma das chaves novas.

- [ ] **Passo 7: Conferir que a home NÃO mudou**

Subir o dev server **pelo preview** (`.claude/launch.json`, configuração `dev`, porta 3001) —
nunca por `npx next dev` no Bash, que deixa o processo órfão e faz `npm run build` falhar
depois com EPERM no query engine do Prisma.

Abrir `http://localhost:3001/pt` e confirmar que **nenhuma seção nova aparece** — não há `FreeSample` ativo no banco, então `getAmostraAtiva()` devolve `null`. Esta é a garantia de que a feature pode ser publicada antes de o arquivo existir.

- [ ] **Passo 8: Commit**

```bash
git add lib/free-sample/amostra-ativa.ts components/landing/free-sample-section.tsx components/landing/free-sample-form.tsx "app/[locale]/page.tsx" messages/pt.json messages/en.json messages/es.json messages/fr.json messages/de.json messages/it.json messages/nl.json
git commit -m "feat(amostra): seção da home, invisível até haver arquivo ativo"
```

---

### Task 8: Painel do super-admin

**Arquivos:**
- Criar: `actions/admin/free-sample.ts`
- Criar: `app/(app)/super-admin/marketplace/free-sample/page.tsx`
- Criar: `components/admin/free-sample-manager.tsx`
- Criar: `app/api/admin/free-sample/pdf/route.ts`
- Modificar: `components/admin/admin-sidebar.tsx` (junto do item `analytics`, ~linha 77)
- Modificar: `messages/pt.json`, `en.json`, `de.json` (só estes três — ver Restrições globais)

**Interfaces:**
- Consome: `uploadFreeSample`, `removeFreeSample` (Task 4); `TAG_AMOSTRA` (Task 7).
- Produz: `toggleFreeSample(id: string, isActive: boolean)`, `deleteFreeSample(id: string)`, `deleteFreeSampleDownload(id: string)`, `exportFreeSampleDownloadsCSV(): Promise<string>`.

- [ ] **Passo 1: Escrever o teste do interruptor**

Esta é a única regra de verdade do painel: a home procura a PRIMEIRA amostra
ativa, então duas ativas ao mesmo tempo tornariam imprevisível qual arquivo o
visitante baixa. O teste tranca isso.

Criar `actions/admin/free-sample.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    freeSample: {
        updateMany: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
    },
    freeSampleDownload: { delete: vi.fn() },
}))
const revalidateTagMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }))
vi.mock("@/lib/supabase/free-sample", () => ({ removeFreeSample: vi.fn() }))

import { toggleFreeSample } from "./free-sample"

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.freeSample.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.freeSample.update.mockResolvedValue({})
})

describe("toggleFreeSample", () => {
    // O bug que este teste evita: ativar a segunda amostra sem desativar a
    // primeira. A home usa findFirst({ where: { isActive: true } }), que não
    // garante ordem — o visitante baixaria ora um arquivo, ora outro.
    it("desativa as outras ao ativar uma", async () => {
        await toggleFreeSample("s2", true)

        expect(prismaMock.freeSample.updateMany).toHaveBeenCalledWith({
            where: { isActive: true },
            data: { isActive: false },
        })
        expect(prismaMock.freeSample.update).toHaveBeenCalledWith({
            where: { id: "s2" },
            data: { isActive: true },
        })
    })

    it("não mexe nas outras ao apenas desativar", async () => {
        await toggleFreeSample("s2", false)

        expect(prismaMock.freeSample.updateMany).not.toHaveBeenCalled()
        expect(prismaMock.freeSample.update).toHaveBeenCalledWith({
            where: { id: "s2" },
            data: { isActive: false },
        })
    })

    // Sem revalidar a tag, a home continua servindo o estado antigo do cache e
    // o interruptor parece não funcionar.
    it("revalida o cache da home nos dois sentidos", async () => {
        await toggleFreeSample("s2", true)
        expect(revalidateTagMock).toHaveBeenCalledWith("free-sample")

        revalidateTagMock.mockClear()
        await toggleFreeSample("s2", false)
        expect(revalidateTagMock).toHaveBeenCalledWith("free-sample")
    })
})
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run actions/admin/free-sample.test.ts
```

Esperado: FAIL — módulo `./free-sample` não encontrado.

- [ ] **Passo 3: Escrever as actions**

Criar `actions/admin/free-sample.ts`:

```ts
// actions/admin/free-sample.ts
"use server"

import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { removeFreeSample } from "@/lib/supabase/free-sample"
import { TAG_AMOSTRA } from "@/lib/free-sample/amostra-ativa"

/**
 * Liga ou desliga a amostra. Ligar uma desliga as outras: a home procura a
 * primeira ativa, e duas ativas tornariam imprevisível qual arquivo é servido.
 */
export async function toggleFreeSample(id: string, isActive: boolean) {
    const admin = await requireAdmin()

    if (isActive) {
        await prisma.freeSample.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }
    await prisma.freeSample.update({ where: { id }, data: { isActive } })

    // Sem isto a home continuaria servindo o estado antigo do cache até a tag
    // vencer — o interruptor pareceria não funcionar.
    revalidateTag(TAG_AMOSTRA)

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: isActive ? "freeSample.activated" : "freeSample.deactivated",
        targetType: "freeSample",
        targetId: id,
    })
}

export async function deleteFreeSample(id: string) {
    const admin = await requireAdmin()

    const amostra = await prisma.freeSample.findUnique({ where: { id } })
    if (!amostra) return

    await prisma.freeSample.delete({ where: { id } })
    await removeFreeSample(amostra.filePath)
    revalidateTag(TAG_AMOSTRA)

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "freeSample.deleted",
        targetType: "freeSample",
        targetId: id,
        metadata: { fileName: amostra.fileName },
    })
}

/**
 * Apaga um pedido. A spec promete que dá para apagar, e sem isto a promessa de
 * privacidade fica sem botão: quem pedir a remoção do próprio endereço teria de
 * ser atendido por SQL na mão.
 */
export async function deleteFreeSampleDownload(id: string) {
    const admin = await requireAdmin()

    await prisma.freeSampleDownload.delete({ where: { id } })

    // Sem metadata: registrar o e-mail apagado no log de auditoria desfaria o
    // apagamento que o registro diz ter acontecido.
    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "freeSampleDownload.deleted",
        targetType: "freeSampleDownload",
        targetId: id,
    })
}

/**
 * CSV de quem pediu a amostra. Aspas duplicadas e campo entre aspas porque
 * e-mail e user-agent podem conter vírgula.
 */
export async function exportFreeSampleDownloadsCSV(): Promise<string> {
    await requireAdmin()

    const linhas = await prisma.freeSampleDownload.findMany({
        orderBy: { createdAt: "desc" },
        select: { email: true, locale: true, consent: true, createdAt: true },
    })

    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const cabecalho = ["email", "idioma", "consentimento", "data"].join(",")
    const corpo = linhas.map((l) =>
        [
            escapar(l.email),
            escapar(l.locale),
            l.consent ? "sim" : "nao",
            escapar(l.createdAt.toISOString()),
        ].join(",")
    )

    return [cabecalho, ...corpo].join("\n")
}
```

- [ ] **Passo 4: Escrever a rota de upload**

Criar `app/api/admin/free-sample/pdf/route.ts`, espelhando `app/api/admin/lists/[id]/pdf/route.ts`:

```ts
// app/api/admin/free-sample/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { uploadFreeSample } from "@/lib/supabase/free-sample"
import { validatePdfFile } from "@/lib/supabase/list-studies"
import { TAG_AMOSTRA } from "@/lib/free-sample/amostra-ativa"

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const form = await request.formData()
        const file = form.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
        }

        // Mesma validação do PDF do estudo: tipo e teto de 50 MB.
        const check = validatePdfFile({ type: file.type, size: file.size })
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        const { path } = await uploadFreeSample(file)
        // Nasce DESLIGADA: subir o arquivo não é a mesma decisão que mostrá-lo
        // na home, e publicar sem querer é pior do que um clique a mais.
        const amostra = await prisma.freeSample.create({
            data: { filePath: path, fileName: file.name, isActive: false },
        })

        revalidateTag(TAG_AMOSTRA)
        return NextResponse.json({ id: amostra.id })
    } catch (error) {
        console.error("Erro ao subir a amostra:", error)
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
    }
}
```

- [ ] **Passo 5: Escrever a página**

Criar `app/(app)/super-admin/marketplace/free-sample/page.tsx`:

```tsx
// app/(app)/super-admin/marketplace/free-sample/page.tsx
import Link from "next/link"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { FreeSampleManager } from "@/components/admin/free-sample-manager"

export default async function FreeSamplePage() {
    const t = await getAdminTranslations("admin.freeSample")
    const tc = await getAdminTranslations("admin.common")

    // `take: 200` porque a tabela é para olhar, não para paginar: quem precisa
    // da lista inteira usa o CSV.
    const [amostras, downloads] = await Promise.all([
        prisma.freeSample.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.freeSampleDownload.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, email: true, locale: true, createdAt: true },
        }),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/super-admin">
                        <ArrowLeft className="h-4 w-4" />
                        {tc("backToDashboard")}
                    </Link>
                </Button>
            </div>

            <FreeSampleManager
                amostras={amostras.map((a) => ({
                    id: a.id,
                    fileName: a.fileName,
                    isActive: a.isActive,
                    createdAt: a.createdAt.toISOString(),
                }))}
                downloads={downloads.map((d) => ({
                    id: d.id,
                    email: d.email,
                    locale: d.locale,
                    createdAt: d.createdAt.toISOString(),
                }))}
            />
        </div>
    )
}
```

- [ ] **Passo 6: Escrever o gerenciador**

Criar `components/admin/free-sample-manager.tsx`:

```tsx
// components/admin/free-sample-manager.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    toggleFreeSample,
    deleteFreeSample,
    deleteFreeSampleDownload,
    exportFreeSampleDownloadsCSV,
} from "@/actions/admin/free-sample"

interface Amostra { id: string; fileName: string; isActive: boolean; createdAt: string }
interface Download { id: string; email: string; locale: string; createdAt: string }

export function FreeSampleManager({
    amostras,
    downloads,
}: {
    amostras: Amostra[]
    downloads: Download[]
}) {
    const t = useTranslations("admin.freeSample")
    const router = useRouter()
    const [enviando, setEnviando] = useState(false)

    const enviarPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setEnviando(true)
        try {
            const body = new FormData()
            body.append("file", file)
            const res = await fetch("/api/admin/free-sample/pdf", { method: "POST", body })
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({ error: null }))
                toast.error(error ?? t("uploadFailed"))
                return
            }
            toast.success(t("uploadOk"))
            router.refresh()
        } finally {
            setEnviando(false)
            // Sem isto, escolher o MESMO arquivo de novo não dispara `change`.
            e.target.value = ""
        }
    }

    const alternar = async (id: string, isActive: boolean) => {
        await toggleFreeSample(id, isActive)
        router.refresh()
    }

    const apagarAmostra = async (id: string) => {
        await deleteFreeSample(id)
        router.refresh()
    }

    const apagarDownload = async (id: string) => {
        await deleteFreeSampleDownload(id)
        router.refresh()
    }

    const exportar = async () => {
        const csv = await exportFreeSampleDownloadsCSV()
        // BOM para o Excel abrir acentuação em UTF-8 sem perguntar.
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `amostra-downloads-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {t("uploadLabel")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input type="file" accept="application/pdf" onChange={enviarPdf} disabled={enviando} />
                    {enviando && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("uploading")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
                </CardContent>
            </Card>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("colFile")}</TableHead>
                            <TableHead>{t("colUploaded")}</TableHead>
                            <TableHead className="text-center">{t("colActive")}</TableHead>
                            <TableHead className="text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {amostras.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                    {t("empty")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            amostras.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.fileName}</TableCell>
                                    <TableCell>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={a.isActive}
                                            onCheckedChange={(v) => alternar(a.id, v)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => apagarAmostra(a.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("downloadsTitle")}</CardTitle>
                    {downloads.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportar}>
                            {t("exportCsv")}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("colEmail")}</TableHead>
                                <TableHead>{t("colLocale")}</TableHead>
                                <TableHead>{t("colDate")}</TableHead>
                                <TableHead className="text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {downloads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                        {t("downloadsEmpty")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                downloads.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell>{d.email}</TableCell>
                                        <TableCell>{d.locale}</TableCell>
                                        <TableCell>{new Date(d.createdAt).toLocaleString("pt-BR")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => apagarDownload(d.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
```

- [ ] **Passo 7: Item no menu lateral**

Em `components/admin/admin-sidebar.tsx`, junto dos outros itens de marketplace:

```ts
{ titleKey: "freeSample", href: "/super-admin/marketplace/free-sample", icon: FileDown },
```

Importar `FileDown` de `lucide-react`.

- [ ] **Passo 8: Textos do painel (só pt, en, de)**

Acrescentar `admin.freeSample` em `messages/pt.json`, `en.json` e `de.json`:

```json
"freeSample": {
    "title": "Amostra gratuita",
    "subtitle": "O PDF oferecido na home. Sem amostra ativa, a seção não aparece no site.",
    "uploadLabel": "Enviar PDF",
    "uploading": "Enviando…",
    "uploadOk": "Amostra enviada. Ative-a quando quiser publicá-la.",
    "uploadFailed": "Falha no envio do PDF.",
    "uploadHint": "A amostra nova entra desligada. Ative-a quando quiser publicá-la.",
    "colFile": "Arquivo",
    "colUploaded": "Enviado em",
    "colActive": "Ativa",
    "empty": "Nenhuma amostra enviada ainda.",
    "downloadsTitle": "Quem baixou",
    "downloadsEmpty": "Ninguém baixou ainda.",
    "colEmail": "E-mail",
    "colLocale": "Idioma",
    "colDate": "Data",
    "exportCsv": "Exportar CSV"
}
```

(en: "Free sample" / "The PDF offered on the home page. With no active sample, the section does not appear on the site." / "Upload PDF" / "Uploading…" / "Sample uploaded. Activate it when you want it published." / "PDF upload failed." / "A new sample starts disabled. Activate it when you want it published." / "File" / "Uploaded" / "Active" / "No sample uploaded yet." / "Who downloaded" / "Nobody has downloaded yet." / "Email" / "Language" / "Date" / "Export CSV")

(de: "Kostenlose Leseprobe" / "Das auf der Startseite angebotene PDF. Ohne aktive Leseprobe erscheint der Abschnitt nicht auf der Website." / "PDF hochladen" / "Wird hochgeladen…" / "Leseprobe hochgeladen. Aktivieren Sie sie zum Veröffentlichen." / "PDF-Upload fehlgeschlagen." / "Eine neue Leseprobe startet deaktiviert. Aktivieren Sie sie, wenn sie veröffentlicht werden soll." / "Datei" / "Hochgeladen" / "Aktiv" / "Noch keine Leseprobe hochgeladen." / "Wer heruntergeladen hat" / "Noch niemand hat heruntergeladen." / "E-Mail" / "Sprache" / "Datum" / "CSV exportieren")

- [ ] **Passo 9: Rodar tudo**

```bash
npx tsc --noEmit && npx vitest run && npx eslint actions/admin/free-sample.ts components/admin/free-sample-manager.tsx "app/(app)/super-admin/marketplace/free-sample/page.tsx" app/api/admin/free-sample/pdf/route.ts
```

Esperado: `tsc` sem saída; testes verdes; `eslint` sem nenhum apontamento.

> **`npm run lint` com exit 0 é inatingível neste repositório** — foram medidos 2378 erros
> e 112.585 avisos pré-existentes, quase todos de builds antigos em `.claude/worktrees`.
> O critério é `npx eslint` nos arquivos tocados, e não a suíte inteira.

- [ ] **Passo 10: Commit**

```bash
git add actions/admin/free-sample.ts actions/admin/free-sample.test.ts "app/(app)/super-admin/marketplace/free-sample/page.tsx" app/api/admin/free-sample/pdf/route.ts components/admin/free-sample-manager.tsx components/admin/admin-sidebar.tsx messages/pt.json messages/en.json messages/de.json
git commit -m "feat(amostra): painel do super-admin com upload, interruptor e exportação"
```

---

### Task 9: Publicação

- [ ] **Passo 1: Conferir que a home segue intacta**

Com o banco ainda sem `FreeSample`, abrir `/pt`, `/de` e `/en` e confirmar que nenhuma seção nova aparece.

- [ ] **Passo 2: Publicar o código**

```bash
git push origin main
```

A Vercel publica sozinha. Como a seção depende de dado que ainda não existe, o site não muda.

- [ ] **Passo 3: Aplicar a migração**

Só **depois** de o deploy terminar, aplicar `prisma/migrations/20260805100000_amostra_gratuita/migration.sql` — as duas tabelas são novas, então nada quebra se a ordem se inverter, mas manter o hábito.

- [ ] **Passo 4: Conferir no ar**

Confirmar que a home em produção continua sem a seção, e que `/super-admin/marketplace/free-sample` abre com a tabela vazia.

A partir daqui é operação: subir o PDF e ligar o interruptor quando a amostra estiver pronta.

---

## Verificação da entrega

Antes de dizer que acabou:

- [ ] `npx tsc --noEmit` sem saída
- [ ] `npx vitest run` todo verde, incluindo `messages-integridade`
- [ ] `npx eslint <arquivos tocados>` sem apontamento (NÃO `npm run lint`, que tem 2378 erros pré-existentes)
- [ ] Home sem a seção enquanto não houver amostra ativa — **este é o requisito que o Werner pediu explicitamente**
- [ ] Com amostra ativa: formulário aparece, download começa ao enviar, linha gravada em `free_sample_downloads`
- [ ] Com o SMTP quebrado de propósito (`SMTP_HOST` inválido): o download **ainda** funciona e o erro aparece no log

## O que ficou de fora

- Recorte de lista real gerado do banco (adiado na spec)
- Escolha de país/setor pelo visitante
- Qualquer envio de marketing para quem baixou
- Amostra em CSV. **Vale reabrir depois do lançamento:** um PDF mostra a análise, mas não os contatos — e é o contato que o comprador duvida.
