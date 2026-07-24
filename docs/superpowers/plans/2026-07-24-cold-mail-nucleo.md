# Cold Mail Núcleo (CM-1..CM-4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o motor de cold mail existente pronto para produção: envios só dentro de uma janela de horário/dias configurável com jitter, lista de supressão alimentada por hard bounce e unsubscribe, detecção automática de resposta via IMAP e header `List-Unsubscribe` one-click.

**Architecture:** Evoluir o motor atual (`app/api/cron/process-sequences/route.ts`), não reescrever. Toda a lógica de decisão (cálculo de janela, classificação de bounce, parsing de headers) vira função **pura** em `lib/campaigns/*`, testada com Vitest sem banco; o cron e os services viram cascas finas que chamam essas funções. O acesso a banco fica em helpers que recebem `PrismaClient` por parâmetro (padrão já usado em `lib/services/*.service.ts`), para poderem ser testados com mock.

**Tech Stack:** Next.js 16 (App Router, rotas de cron em `app/api/cron/*`), Prisma 6 + PostgreSQL (Supabase), Vitest (`environment: node`, testes co-localizados `*.test.ts`), Nodemailer (SMTP por workspace) + Resend (fallback), `imapflow` (nova dependência, IMAP), `Intl.DateTimeFormat` para timezone (sem lib de data nova).

## Global Constraints

- **Migrações Prisma NÃO usam `prisma migrate dev`** (shadow DB falha no pooler do Supabase). Fluxo obrigatório: `prisma migrate diff` → salvar SQL em `prisma/migrations/<timestamp>_<nome>/migration.sql` → `prisma db execute` → `prisma migrate resolve --applied`.
- **Node não está no PATH por padrão.** Em cada shell bash, rodar antes: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Existe drift pré-existente** entre `schema.prisma` e o banco (índices de `calls`/`leads`/`email_sends`/`purchases` estão no schema e não no banco). O SQL gerado pelo `migrate diff` vai incluir esses `CREATE INDEX` extras — **remover manualmente do arquivo de migração** tudo que não pertence à mudança em questão, antes de executar.
- **Testes:** `npm test` roda `vitest run`. Testes ficam ao lado do arquivo (`lib/campaigns/send-window.ts` → `lib/campaigns/send-window.test.ts`).
- **Idioma do código:** comentários e strings de UI em português (padrão do projeto). Nomes de símbolos em inglês.
- **Indentação:** 4 espaços, sem ponto e vírgula no fim das linhas (padrão dos arquivos existentes).
- **Nada de PII nova em log.** `console.log` de e-mail completo já existe em `lib/email.ts`; não ampliar.
- **Frequência de cron (limitação conhecida, não resolver neste plano):** `vercel.json` hoje declara `process-sequences` em `"0 9 * * *"` (diário). A lógica de janela é escrita para funcionar em qualquer frequência — ela **adia** o que está fora da janela para o próximo horário válido. Com cron diário o jitter tem efeito limitado; se/quando o cron subir para horário, o mesmo código passa a distribuir de verdade. Não alterar a frequência aqui.

---

## Estrutura de arquivos

**Criar:**
- `lib/campaigns/send-window.ts` — tipos e cálculo puro de janela/jitter/próximo envio (CM-1).
- `lib/campaigns/send-window.test.ts`
- `lib/campaigns/bounce-classifier.ts` — classificação hard/soft de bounce (CM-2, puro).
- `lib/campaigns/bounce-classifier.test.ts`
- `lib/campaigns/suppression.ts` — helpers de supressão sobre `PrismaClient` injetado (CM-2).
- `lib/campaigns/suppression.test.ts`
- `lib/email/list-unsubscribe.ts` — construção da URL e dos headers RFC 8058 (CM-4, puro).
- `lib/email/list-unsubscribe.test.ts`
- `lib/campaigns/reply-detection.ts` — normalização de Message-ID e parsing de bloco de headers (CM-3, puro).
- `lib/campaigns/reply-detection.test.ts`
- `lib/imap.ts` — casca fina de I/O sobre `imapflow`.
- `app/api/cron/detect-replies/route.ts` — cron de detecção de resposta.
- `app/(crm)/settings/components/send-window-settings.tsx` — UI da janela de envio + IMAP.
- `app/(crm)/settings/components/suppression-list.tsx` — UI de supressões.

**Modificar:**
- `prisma/schema.prisma` — campos de janela em `Workspace`/`Campaign`; model `Suppression`; enums `SuppressionReason`/`BounceType`; `EmailSend.bounceType`/`messageId`; campos IMAP no `Workspace`.
- `app/api/cron/process-sequences/route.ts` — respeitar janela, supressão, lead `REPLIED`, gravar `messageId`/`bounceType`.
- `lib/email.ts` — retornar `messageId`, injetar headers `List-Unsubscribe`, reusar `buildUnsubscribeUrl`.
- `lib/constants/smtp.constants.ts` — hosts/portas IMAP por provedor.
- `lib/services/campaigns.service.ts` — checar supressão antes de enviar.
- `app/api/unsubscribe/route.ts` — aceitar POST one-click (sid/sig na query) e gravar supressão.
- `actions/workspace-settings.ts` — actions de janela de envio, IMAP e supressões.
- `app/(crm)/settings/settings-client.tsx` — renderizar os dois componentes novos na aba `email`.
- `components/campaigns/campaign-wizard.tsx` — override de janela por campanha.
- `vercel.json` — entrada de cron para `detect-replies`.
- `package.json` — dependência `imapflow`.

---

## Task 1: Cálculo puro de janela de envio (CM-1)

**Files:**
- Create: `lib/campaigns/send-window.ts`
- Test: `lib/campaigns/send-window.test.ts`

**Interfaces:**
- Consumes: nada (primeira tarefa).
- Produces:
  - `interface SendWindow { enabled: boolean; timezone: string; days: number[]; startHour: number; endHour: number; jitterMinutes: number }`
  - `interface SendWindowDefaults { sendWindowEnabled: boolean; sendTimezone: string; sendDays: number[]; sendStartHour: number; sendEndHour: number; sendJitterMinutes: number }`
  - `interface SendWindowOverride { sendWindowEnabled: boolean | null; sendTimezone: string | null; sendDays: number[]; sendStartHour: number | null; sendEndHour: number | null; sendJitterMinutes: number | null }`
  - `resolveSendWindow(defaults: SendWindowDefaults, override?: SendWindowOverride | null): SendWindow`
  - `getZonedParts(date: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; isoWeekday: number }`
  - `isWithinSendWindow(date: Date, window: SendWindow): boolean`
  - `nextWindowStart(date: Date, window: SendWindow): Date`
  - `applyJitter(date: Date, window: SendWindow, random?: () => number): Date`
  - `calculateNextSendAt(from: Date, step: { delayDays: number | null; delayHours: number | null }, window: SendWindow, random?: () => number): Date`
  - `DEFAULT_SEND_DAYS: number[]` (`[1, 2, 3, 4, 5]`, ISO: 1=segunda … 7=domingo)

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/campaigns/send-window.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
    DEFAULT_SEND_DAYS,
    resolveSendWindow,
    getZonedParts,
    isWithinSendWindow,
    nextWindowStart,
    applyJitter,
    calculateNextSendAt,
    type SendWindow,
} from "./send-window"

const defaults = {
    sendWindowEnabled: true,
    sendTimezone: "Europe/Berlin",
    sendDays: DEFAULT_SEND_DAYS,
    sendStartHour: 9,
    sendEndHour: 17,
    sendJitterMinutes: 20,
}

const emptyOverride = {
    sendWindowEnabled: null,
    sendTimezone: null,
    sendDays: [],
    sendStartHour: null,
    sendEndHour: null,
    sendJitterMinutes: null,
}

const berlinWindow: SendWindow = {
    enabled: true,
    timezone: "Europe/Berlin",
    days: DEFAULT_SEND_DAYS,
    startHour: 9,
    endHour: 17,
    jitterMinutes: 0,
}

describe("resolveSendWindow", () => {
    it("usa os defaults do workspace quando não há override", () => {
        expect(resolveSendWindow(defaults, null)).toEqual({
            enabled: true,
            timezone: "Europe/Berlin",
            days: [1, 2, 3, 4, 5],
            startHour: 9,
            endHour: 17,
            jitterMinutes: 20,
        })
    })

    it("campos nulos e array vazio no override herdam do workspace", () => {
        expect(resolveSendWindow(defaults, emptyOverride)).toEqual(
            resolveSendWindow(defaults, null)
        )
    })

    it("override preenchido vence o default", () => {
        const resolved = resolveSendWindow(defaults, {
            ...emptyOverride,
            sendTimezone: "America/Sao_Paulo",
            sendDays: [6, 7],
            sendStartHour: 10,
            sendEndHour: 12,
        })
        expect(resolved.timezone).toBe("America/Sao_Paulo")
        expect(resolved.days).toEqual([6, 7])
        expect(resolved.startHour).toBe(10)
        expect(resolved.endHour).toBe(12)
        expect(resolved.jitterMinutes).toBe(20)
    })

    it("desliga a janela quando o override desliga", () => {
        const resolved = resolveSendWindow(defaults, {
            ...emptyOverride,
            sendWindowEnabled: false,
        })
        expect(resolved.enabled).toBe(false)
    })

    it("desliga a janela se a configuração for impossível (nenhum dia ou horas invertidas)", () => {
        expect(
            resolveSendWindow({ ...defaults, sendDays: [] }, null).enabled
        ).toBe(false)
        expect(
            resolveSendWindow({ ...defaults, sendStartHour: 18, sendEndHour: 9 }, null)
                .enabled
        ).toBe(false)
    })
})

describe("getZonedParts", () => {
    it("converte um instante UTC para a hora local do fuso", () => {
        // 2026-07-24T08:30:00Z = 10:30 em Berlim (CEST, UTC+2), sexta-feira
        const parts = getZonedParts(new Date("2026-07-24T08:30:00Z"), "Europe/Berlin")
        expect(parts).toEqual({
            year: 2026,
            month: 7,
            day: 24,
            hour: 10,
            minute: 30,
            isoWeekday: 5,
        })
    })

    it("usa h23 — meia-noite é hora 0, não 24", () => {
        const parts = getZonedParts(new Date("2026-07-24T22:00:00Z"), "Europe/Berlin")
        expect(parts.hour).toBe(0)
        expect(parts.day).toBe(25)
    })

    it("domingo é o dia ISO 7", () => {
        // 2026-07-26 é domingo
        const parts = getZonedParts(new Date("2026-07-26T12:00:00Z"), "Europe/Berlin")
        expect(parts.isoWeekday).toBe(7)
    })
})

describe("isWithinSendWindow", () => {
    it("aceita um instante dentro do horário em dia útil", () => {
        // sexta 10:30 em Berlim
        expect(
            isWithinSendWindow(new Date("2026-07-24T08:30:00Z"), berlinWindow)
        ).toBe(true)
    })

    it("recusa antes do início da janela", () => {
        // sexta 08:00 em Berlim
        expect(
            isWithinSendWindow(new Date("2026-07-24T06:00:00Z"), berlinWindow)
        ).toBe(false)
    })

    it("recusa a partir da hora final (fim exclusivo)", () => {
        // sexta 17:00 em Berlim
        expect(
            isWithinSendWindow(new Date("2026-07-24T15:00:00Z"), berlinWindow)
        ).toBe(false)
    })

    it("recusa fim de semana", () => {
        // sábado 10:00 em Berlim
        expect(
            isWithinSendWindow(new Date("2026-07-25T08:00:00Z"), berlinWindow)
        ).toBe(false)
    })

    it("aceita qualquer instante quando a janela está desligada", () => {
        expect(
            isWithinSendWindow(new Date("2026-07-25T02:00:00Z"), {
                ...berlinWindow,
                enabled: false,
            })
        ).toBe(true)
    })
})

describe("nextWindowStart", () => {
    it("devolve o próprio instante quando já está dentro da janela", () => {
        const date = new Date("2026-07-24T08:30:00Z")
        expect(nextWindowStart(date, berlinWindow).toISOString()).toBe(
            date.toISOString()
        )
    })

    it("adia madrugada para as 9h locais do mesmo dia", () => {
        // sexta 03:00 em Berlim -> sexta 09:00 em Berlim = 07:00Z
        expect(
            nextWindowStart(new Date("2026-07-24T01:00:00Z"), berlinWindow).toISOString()
        ).toBe("2026-07-24T07:00:00.000Z")
    })

    it("adia sexta à noite para segunda de manhã", () => {
        // sexta 20:00 em Berlim -> segunda 09:00 em Berlim = 2026-07-27T07:00Z
        expect(
            nextWindowStart(new Date("2026-07-24T18:00:00Z"), berlinWindow).toISOString()
        ).toBe("2026-07-27T07:00:00.000Z")
    })

    it("não adia quando a janela está desligada", () => {
        const date = new Date("2026-07-25T02:00:00Z")
        expect(
            nextWindowStart(date, { ...berlinWindow, enabled: false }).toISOString()
        ).toBe(date.toISOString())
    })
})

describe("applyJitter", () => {
    it("soma minutos determinísticos a partir do gerador injetado", () => {
        const date = new Date("2026-07-24T08:00:00Z")
        const jittered = applyJitter(
            date,
            { ...berlinWindow, jitterMinutes: 30 },
            () => 0.5
        )
        expect(jittered.toISOString()).toBe("2026-07-24T08:15:00.000Z")
    })

    it("não altera o horário quando jitterMinutes é 0", () => {
        const date = new Date("2026-07-24T08:00:00Z")
        expect(applyJitter(date, berlinWindow, () => 0.99).toISOString()).toBe(
            date.toISOString()
        )
    })

    it("reagenda para a próxima janela se o jitter estourar o fim do dia", () => {
        // sexta 16:50 em Berlim (14:50Z) + 30min de jitter passa das 17h
        const jittered = applyJitter(
            new Date("2026-07-24T14:50:00Z"),
            { ...berlinWindow, jitterMinutes: 30 },
            () => 0.9
        )
        expect(jittered.toISOString()).toBe("2026-07-27T07:00:00.000Z")
    })
})

describe("calculateNextSendAt", () => {
    it("soma o delay do step e cai dentro da janela", () => {
        // quinta 10:00 Berlim + 1 dia = sexta 10:00 Berlim, dentro da janela
        const next = calculateNextSendAt(
            new Date("2026-07-23T08:00:00Z"),
            { delayDays: 1, delayHours: 0 },
            berlinWindow
        )
        expect(next.toISOString()).toBe("2026-07-24T08:00:00.000Z")
    })

    it("empurra para a próxima janela quando o delay cai fora do horário", () => {
        // sexta 10:00 Berlim + 12h = sexta 22:00 Berlim -> segunda 09:00 Berlim
        const next = calculateNextSendAt(
            new Date("2026-07-24T08:00:00Z"),
            { delayDays: 0, delayHours: 12 },
            berlinWindow
        )
        expect(next.toISOString()).toBe("2026-07-27T07:00:00.000Z")
    })

    it("trata delays nulos como zero", () => {
        const from = new Date("2026-07-24T08:00:00Z")
        const next = calculateNextSendAt(
            from,
            { delayDays: null, delayHours: null },
            berlinWindow
        )
        expect(next.toISOString()).toBe(from.toISOString())
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/send-window.test.ts
```

Esperado: FAIL com `Failed to resolve import "./send-window"`.

- [ ] **Step 3: Implementar `lib/campaigns/send-window.ts`**

```ts
// lib/campaigns/send-window.ts

/**
 * Cálculo de janela de envio para cold mail. Puro: sem banco, sem I/O, sem
 * dependência de data externa — usa apenas Intl.DateTimeFormat para converter
 * entre UTC e a hora de parede do fuso configurado.
 *
 * Dias da semana seguem a numeração ISO: 1 = segunda ... 7 = domingo.
 * `startHour` é inclusivo e `endHour` exclusivo (9..17 = das 9h às 16h59).
 */

export const DEFAULT_SEND_DAYS = [1, 2, 3, 4, 5]

export interface SendWindow {
    enabled: boolean
    timezone: string
    days: number[]
    startHour: number
    endHour: number
    jitterMinutes: number
}

/** Valores do workspace (sempre preenchidos). */
export interface SendWindowDefaults {
    sendWindowEnabled: boolean
    sendTimezone: string
    sendDays: number[]
    sendStartHour: number
    sendEndHour: number
    sendJitterMinutes: number
}

/** Override da campanha: null/array vazio significa "herda do workspace". */
export interface SendWindowOverride {
    sendWindowEnabled: boolean | null
    sendTimezone: string | null
    sendDays: number[]
    sendStartHour: number | null
    sendEndHour: number | null
    sendJitterMinutes: number | null
}

export function resolveSendWindow(
    defaults: SendWindowDefaults,
    override?: SendWindowOverride | null
): SendWindow {
    const days =
        override && override.sendDays.length > 0
            ? override.sendDays
            : defaults.sendDays
    const startHour = override?.sendStartHour ?? defaults.sendStartHour
    const endHour = override?.sendEndHour ?? defaults.sendEndHour

    const enabled =
        (override?.sendWindowEnabled ?? defaults.sendWindowEnabled) &&
        days.length > 0 &&
        endHour > startHour

    return {
        enabled,
        timezone: override?.sendTimezone ?? defaults.sendTimezone,
        days,
        startHour,
        endHour,
        jitterMinutes: override?.sendJitterMinutes ?? defaults.sendJitterMinutes,
    }
}

export function getZonedParts(
    date: Date,
    timeZone: string
): {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    isoWeekday: number
} {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })

    const values: Record<string, number> = {}
    for (const part of formatter.formatToParts(date)) {
        if (part.type !== "literal") {
            values[part.type] = Number(part.value)
        }
    }

    // getUTCDay: 0 = domingo ... 6 = sábado. ISO: 1 = segunda ... 7 = domingo.
    const utcDay = new Date(
        Date.UTC(values.year, values.month - 1, values.day)
    ).getUTCDay()

    return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        isoWeekday: ((utcDay + 6) % 7) + 1,
    }
}

/** Offset do fuso, em ms, para um dado instante (positivo a leste de Greenwich). */
function timezoneOffsetMs(date: Date, timeZone: string): number {
    const parts = getZonedParts(date, timeZone)
    const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    )
    return asUtc - date.getTime()
}

/**
 * Converte uma hora de parede do fuso para o instante UTC correspondente.
 * Faz duas passadas porque o offset depende do próprio instante (horário de verão).
 */
function zonedWallTimeToUtc(
    wall: { year: number; month: number; day: number; hour: number; minute: number },
    timeZone: string
): Date {
    const guess = new Date(
        Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute)
    )
    const firstPass = new Date(guess.getTime() - timezoneOffsetMs(guess, timeZone))
    return new Date(guess.getTime() - timezoneOffsetMs(firstPass, timeZone))
}

export function isWithinSendWindow(date: Date, window: SendWindow): boolean {
    if (!window.enabled) {
        return true
    }

    const parts = getZonedParts(date, window.timezone)

    if (!window.days.includes(parts.isoWeekday)) {
        return false
    }

    return parts.hour >= window.startHour && parts.hour < window.endHour
}

export function nextWindowStart(date: Date, window: SendWindow): Date {
    if (!window.enabled || isWithinSendWindow(date, window)) {
        return date
    }

    // 14 dias cobrem qualquer configuração de dias da semana com folga.
    for (let offset = 0; offset <= 14; offset++) {
        const probe = new Date(date.getTime() + offset * 24 * 60 * 60 * 1000)
        const parts = getZonedParts(probe, window.timezone)

        if (!window.days.includes(parts.isoWeekday)) {
            continue
        }

        const candidate = zonedWallTimeToUtc(
            {
                year: parts.year,
                month: parts.month,
                day: parts.day,
                hour: window.startHour,
                minute: 0,
            },
            window.timezone
        )

        if (candidate.getTime() >= date.getTime()) {
            return candidate
        }
    }

    return date
}

export function applyJitter(
    date: Date,
    window: SendWindow,
    random: () => number = Math.random
): Date {
    if (window.jitterMinutes <= 0) {
        return date
    }

    const minutes = Math.floor(random() * (window.jitterMinutes + 1))
    const jittered = new Date(date.getTime() + minutes * 60 * 1000)

    // O jitter pode empurrar para fora da janela — nesse caso vale a próxima.
    return nextWindowStart(jittered, window)
}

export function calculateNextSendAt(
    from: Date,
    step: { delayDays: number | null; delayHours: number | null },
    window: SendWindow,
    random: () => number = Math.random
): Date {
    const delayMs =
        (step.delayDays || 0) * 24 * 60 * 60 * 1000 +
        (step.delayHours || 0) * 60 * 60 * 1000

    const base = new Date(from.getTime() + delayMs)

    return applyJitter(nextWindowStart(base, window), window, random)
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/send-window.test.ts
```

Esperado: PASS, 20 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/campaigns/send-window.ts lib/campaigns/send-window.test.ts
git commit -m "feat(cold-mail): calculo puro de janela de envio com timezone e jitter"
```

---

## Task 2: Migração — campos de janela em Workspace e Campaign (CM-1)

**Files:**
- Modify: `prisma/schema.prisma` (model `Workspace` ~linha 161, model `Campaign` ~linha 326)
- Create: `prisma/migrations/20260724120000_add_send_window/migration.sql`

**Interfaces:**
- Consumes: os nomes de campo definidos em `SendWindowDefaults`/`SendWindowOverride` (Task 1).
- Produces: campos `sendWindowEnabled`, `sendTimezone`, `sendDays`, `sendStartHour`, `sendEndHour`, `sendJitterMinutes` em `Workspace` (não-nulos, com default) e em `Campaign` (nuláveis, `sendDays` como array vazio = herda).

- [ ] **Step 1: Adicionar os campos ao `Workspace`**

Em `prisma/schema.prisma`, dentro de `model Workspace`, logo abaixo do bloco `// 🆕 Limites`:

```prisma
  // 🆕 Janela de envio de cold mail (defaults do workspace)
  // sendDays usa numeração ISO: 1 = segunda ... 7 = domingo.
  // sendStartHour é inclusivo, sendEndHour exclusivo.
  sendWindowEnabled Boolean @default(true)
  sendTimezone      String  @default("UTC")
  sendDays          Int[]   @default([1, 2, 3, 4, 5])
  sendStartHour     Int     @default(9)
  sendEndHour       Int     @default(17)
  sendJitterMinutes Int     @default(20)
```

- [ ] **Step 2: Adicionar o override ao `Campaign`**

Em `model Campaign`, logo abaixo do bloco `// Datas` (depois de `sentAt`):

```prisma
  // 🆕 Override da janela de envio. null (ou array vazio) = herda do workspace.
  sendWindowEnabled Boolean?
  sendTimezone      String?
  sendDays          Int[]    @default([])
  sendStartHour     Int?
  sendEndHour       Int?
  sendJitterMinutes Int?
```

- [ ] **Step 3: Gerar o SQL da migração**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && mkdir -p prisma/migrations/20260724120000_add_send_window && npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260724120000_add_send_window/migration.sql
```

- [ ] **Step 4: Limpar o SQL gerado**

Abrir `prisma/migrations/20260724120000_add_send_window/migration.sql` e **apagar toda linha que não seja** um dos 12 `ALTER TABLE ... ADD COLUMN` de `workspaces` e `campaigns` acima. Por causa do drift pré-existente, o diff traz `CREATE INDEX` de `calls`/`leads`/`email_sends`/`purchases` que não pertencem a esta migração.

O arquivo final deve ficar assim (confira nome e tipo de cada coluna):

```sql
-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "sendWindowEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sendTimezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "sendDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "sendStartHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "sendEndHour" INTEGER NOT NULL DEFAULT 17,
ADD COLUMN     "sendJitterMinutes" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "sendWindowEnabled" BOOLEAN,
ADD COLUMN     "sendTimezone" TEXT,
ADD COLUMN     "sendDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "sendStartHour" INTEGER,
ADD COLUMN     "sendEndHour" INTEGER,
ADD COLUMN     "sendJitterMinutes" INTEGER;
```

- [ ] **Step 5: Aplicar e registrar a migração**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx prisma db execute --file prisma/migrations/20260724120000_add_send_window/migration.sql --schema prisma/schema.prisma && npx prisma migrate resolve --applied 20260724120000_add_send_window && npx prisma generate
```

Esperado: `Script executed successfully.`, `Migration ... marked as applied`, `Generated Prisma Client`.

- [ ] **Step 6: Confirmar que a suíte continua verde**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test
```

Esperado: PASS em todos os arquivos.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260724120000_add_send_window
git commit -m "feat(cold-mail): campos de janela de envio em workspace e campaign"
```

---

## Task 3: Motor de sequências respeita a janela (CM-1)

**Files:**
- Modify: `app/api/cron/process-sequences/route.ts`

**Interfaces:**
- Consumes: `resolveSendWindow`, `isWithinSendWindow`, `nextWindowStart`, `calculateNextSendAt` de `@/lib/campaigns/send-window` (Task 1); campos do schema (Task 2).
- Produces, acrescentados a `lib/campaigns/send-window.ts` e consumidos pela validação da Task 4:
  - `CRON_SEND_HOUR_UTC: number`
  - `windowCoversCronRun(window: SendWindow, cronHourUtc?: number): boolean`
  - `describeCronHourIn(timezone: string, cronHourUtc?: number): string`

### Contexto obrigatório: por que a Task 3 ganhou um guard

O cron `process-sequences` roda **uma vez por dia, às 09:00 UTC** (`vercel.json`), e o dono do produto decidiu manter essa frequência. Isso cria uma armadilha: o motor adia para a próxima janela tudo que estiver fora dela, mas o cron só volta 24h depois, **no mesmo horário**. Se a janela do workspace não contiver as 09:00 UTC, o enrollment é adiado, redescoberto e adiado de novo — **para sempre, sem nunca enviar e sem erro visível**.

Não é hipótese: janela das 9h às 17h no fuso `America/Sao_Paulo` equivale a 12:00–20:00 UTC, e a execução das 09:00 UTC cai fora. É a configuração mais natural que existe e ela travaria tudo.

A decisão tomada: **validar na escrita** (Task 4 recusa salvar janela inalcançável) e **logar alto no motor** (esta task), como rede de segurança.

- [ ] **Step 1: Acrescentar o guard puro a `lib/campaigns/send-window.ts`**

Primeiro o teste. Em `lib/campaigns/send-window.test.ts`, acrescentar ao import a nova função e a constante, e adicionar este bloco:

```ts
describe("windowCoversCronRun", () => {
    it("aceita janela em UTC que contém o horário do cron", () => {
        expect(windowCoversCronRun({ ...berlinWindow, timezone: "UTC" })).toBe(true)
    })

    it("aceita Berlim 9h-17h — 09:00 UTC vira 10h no inverno e 11h no verão", () => {
        expect(windowCoversCronRun(berlinWindow)).toBe(true)
    })

    it("recusa Brasília 9h-17h — 09:00 UTC é 06:00 lá, sempre fora", () => {
        expect(
            windowCoversCronRun({ ...berlinWindow, timezone: "America/Sao_Paulo" })
        ).toBe(false)
    })

    it("recusa janela que só vale em parte do ano por causa do horário de verão", () => {
        // Berlim 10h-11h: no inverno 09:00 UTC = 10h (dentro), no verão = 11h (fora).
        // Valer só metade do ano é armadilha — tem que ser recusada.
        expect(
            windowCoversCronRun({ ...berlinWindow, startHour: 10, endHour: 11 })
        ).toBe(false)
    })

    it("não restringe nada quando a janela está desligada", () => {
        expect(
            windowCoversCronRun({
                ...berlinWindow,
                enabled: false,
                timezone: "America/Sao_Paulo",
            })
        ).toBe(true)
    })

    it("aceita um horário de cron diferente do padrão", () => {
        // 12:00 UTC = 09:00 em Brasília, dentro da janela 9h-17h.
        expect(
            windowCoversCronRun({ ...berlinWindow, timezone: "America/Sao_Paulo" }, 12)
        ).toBe(true)
    })
})

describe("describeCronHourIn", () => {
    it("descreve uma hora só quando o fuso não tem horário de verão", () => {
        expect(describeCronHourIn("America/Sao_Paulo")).toBe("6h")
    })

    it("descreve as duas horas quando o fuso tem horário de verão", () => {
        expect(describeCronHourIn("Europe/Berlin")).toBe("10h no inverno e 11h no verão")
    })

    it("aceita um horário de cron diferente do padrão", () => {
        expect(describeCronHourIn("UTC", 15)).toBe("15h")
    })
})
```

Rodar e confirmar que falha:

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/send-window.test.ts
```

Esperado: FAIL — `windowCoversCronRun is not a function` (ou erro de import).

Depois implementar, no fim de `lib/campaigns/send-window.ts`:

```ts
/**
 * Hora UTC em que o cron de envio roda (ver `crons` em vercel.json). Uma
 * execução por dia — mudar aqui e no vercel.json juntos.
 */
export const CRON_SEND_HOUR_UTC = 9

/**
 * Responde se uma janela é alcançável pelo cron diário.
 *
 * Com uma única execução por dia, sempre no mesmo horário UTC, uma janela que
 * não contenha esse instante nunca envia nada: o motor adia, o cron volta no
 * mesmo horário, adia de novo, indefinidamente.
 *
 * Testa dois instantes — um no inverno e um no verão do hemisfério norte —
 * porque o horário local do cron muda com o horário de verão do fuso escolhido.
 * Exigimos que os DOIS estejam dentro da janela: valer só metade do ano é a
 * mesma armadilha, com um atraso de seis meses.
 */
export function windowCoversCronRun(
    window: SendWindow,
    cronHourUtc: number = CRON_SEND_HOUR_UTC
): boolean {
    if (!window.enabled) {
        return true
    }

    const probes = [
        new Date(Date.UTC(2026, 0, 15, cronHourUtc, 0)),
        new Date(Date.UTC(2026, 6, 15, cronHourUtc, 0)),
    ]

    return probes.every((probe) => {
        const { hour } = getZonedParts(probe, window.timezone)
        return hour >= window.startHour && hour < window.endHour
    })
}

/**
 * Texto curto dizendo que horas é a execução do cron no fuso informado, para a
 * mensagem de erro da validação. Fusos com horário de verão têm duas respostas.
 */
export function describeCronHourIn(
    timezone: string,
    cronHourUtc: number = CRON_SEND_HOUR_UTC
): string {
    const winter = getZonedParts(
        new Date(Date.UTC(2026, 0, 15, cronHourUtc, 0)),
        timezone
    ).hour
    const summer = getZonedParts(
        new Date(Date.UTC(2026, 6, 15, cronHourUtc, 0)),
        timezone
    ).hour

    if (winter === summer) {
        return `${winter}h`
    }

    return `${winter}h no inverno e ${summer}h no verão`
}
```

Note que `windowCoversCronRun` olha só a **hora**: o cron roda todo dia, então os dias da semana permitidos não afetam se a janela é alcançável — apenas em quais dias ela dispara.

Rodar de novo e confirmar PASS (34 testes no arquivo).

- [ ] **Step 2: Trocar o import e remover a função local `calculateNextSendAt`**

No topo de `app/api/cron/process-sequences/route.ts`, adicionar após o import de `decryptSecret`:

```ts
import {
    resolveSendWindow,
    isWithinSendWindow,
    nextWindowStart,
    calculateNextSendAt,
    windowCoversCronRun,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"
```

E **apagar** a função `calculateNextSendAt` local no fim do arquivo (linhas 419-427), junto com o import agora não usado de `CampaignStep`:

```ts
// antes
import type { CampaignEnrollment, CampaignStep, StepCondition } from "@prisma/client"
// depois
import type { CampaignEnrollment, StepCondition } from "@prisma/client"
```

- [ ] **Step 3: Resolver a janela e adiar o que está fora dela**

São dois pontos diferentes no loop, e a distância entre eles é intencional.

**3a.** Dentro do `for (const enrollment of pendingEnrollments)`, **logo depois** de `const { campaign, lead } = enrollment` (linha 88), apenas resolver a janela:

```ts
                const sendWindow = resolveSendWindow(campaign.workspace, campaign)
```

Ela precisa estar em escopo desde cedo porque o branch de "condição do step não atendida" chama `calculateNextSendAt` antes de qualquer envio.

**3b.** O **teste** da janela vai bem mais abaixo: imediatamente **antes** do bloco que respeita o limite diário do workspace (`const maxEmailsPerDay = campaign.workspace.maxEmailsPerDay`, linha ~176), ou seja, depois de todos os branches que encerram ou avançam o enrollment sem enviar e-mail.

Essa ordem é obrigatória. Os branches anteriores — lead `CONVERTED`, lead `UNSUBSCRIBED`, sequência sem próximo step, condição do step não atendida — **encerram ou avançam o enrollment sem mandar e-mail nenhum**. Se o teste da janela viesse antes deles, um lead que converteu ou se descadastrou seria adiado em vez de parado, ficaria `active` para sempre e ocuparia uma vaga do lote de 100 em toda execução. A janela restringe **envio**, não faxina de estado.

```ts
                // Fora da janela: não envia e não avança o step — apenas reagenda
                // para o próximo horário válido. O enrollment segue ativo.
                if (!isWithinSendWindow(now, sendWindow)) {
                    const deferredTo = nextWindowStart(now, sendWindow)
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: { nextSendAt: deferredTo },
                    })
                    deferred++

                    // Este cron roda uma vez por dia, sempre no mesmo horário.
                    // Se a janela não cobre esse instante, o adiamento acima vai
                    // se repetir todo dia e o enrollment NUNCA envia. A UI
                    // valida isso na hora de salvar (Task 4); aqui é a rede de
                    // segurança para configuração que escapou por outro caminho.
                    // Um alerta por workspace por execução: a causa é uma
                    // configuração só, não um problema de cada enrollment.
                    if (
                        !windowCoversCronRun(sendWindow) &&
                        !unreachableWindowWarned.has(campaign.workspaceId)
                    ) {
                        unreachableWindowWarned.add(campaign.workspaceId)
                        console.error(
                            `[Cron] JANELA INALCANÇÁVEL: o workspace ${campaign.workspaceId} tem janela ` +
                            `${sendWindow.startHour}h-${sendWindow.endHour}h em ${sendWindow.timezone}, que nunca ` +
                            `contém a execução diária das ${CRON_SEND_HOUR_UTC}h UTC. O enrollment ${enrollment.id} ` +
                            `não será enviado enquanto a janela não for corrigida.`
                        )
                    } else {
                        console.log(
                            `[Cron] Fora da janela de envio - enrollment ${enrollment.id} adiado para ${deferredTo.toISOString()}`
                        )
                    }
                    continue
                }
```

- [ ] **Step 4: Declarar o contador `deferred` e incluí-lo no resumo**

Junto dos outros contadores (linha ~79):

```ts
        let processed = 0
        let sent = 0
        let skipped = 0
        let throttled = 0
        let deferred = 0
        let errors = 0

        // Workspaces já alertados sobre janela inalcançável nesta execução.
        const unreachableWindowWarned = new Set<string>()
```

E no objeto `summary` (linha ~349):

```ts
        const summary = {
            timestamp: now.toISOString(),
            processed,
            sent,
            skipped,
            throttled,
            deferred,
            errors,
        }
```

- [ ] **Step 5: Passar a janela para as duas chamadas de `calculateNextSendAt`**

Há duas ocorrências (condição de step não atendida, linha ~151; e após envio bem-sucedido, linha ~288). Em ambas, trocar:

```ts
                        const nextSendAt = calculateNextSendAt(now, nextStep)
```

por:

```ts
                        const nextSendAt = calculateNextSendAt(now, nextStep, sendWindow)
```

- [ ] **Step 6: Verificar tipos e rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: `tsc` sem erros; testes PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/cron/process-sequences/route.ts
git commit -m "feat(cold-mail): motor de sequencias respeita janela de envio e jitter"
```

---

## Task 4: UI e action da janela de envio no workspace (CM-1)

**Files:**
- Modify: `actions/workspace-settings.ts`
- Create: `app/(crm)/settings/components/send-window-settings.tsx`
- Modify: `app/(crm)/settings/settings-client.tsx`
- Modify: `app/(crm)/settings/page.tsx`

**Interfaces:**
- Consumes: campos do `Workspace` (Task 2); de `@/lib/campaigns/send-window`: `DEFAULT_SEND_DAYS`, `resolveSendWindow`, `windowCoversCronRun`, `describeCronHourIn`, `CRON_SEND_HOUR_UTC` (as três últimas criadas na Task 3). Acrescentar ao topo de `actions/workspace-settings.ts`:

```ts
import {
    resolveSendWindow,
    windowCoversCronRun,
    describeCronHourIn,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"
```
- Produces:
  - `getSendWindowSettings(workspaceId: string): Promise<ActionResult<SendWindowSettingsData>>`
  - `updateSendWindowSettings(workspaceId: string, data: SendWindowSettingsData): Promise<ActionResult>`
  - `export type SendWindowSettingsData = { sendWindowEnabled: boolean; sendTimezone: string; sendDays: number[]; sendStartHour: number; sendEndHour: number; sendJitterMinutes: number }`

- [ ] **Step 1: Adicionar schema e actions em `actions/workspace-settings.ts`**

Depois de `smtpSettingsSchema` (linha 41), acrescentar:

Atenção: este projeto usa **zod 4.4.3**, cuja API difere da 3.x em dois pontos que aparecem aqui. Primeiro, `.refine()` não aceita função como segundo argumento inteiro — só o campo `error` pode ser função, e ela recebe o *issue* (com `issue.input` cru). Segundo, toda restrição numérica precisa de mensagem própria em português: sem ela o zod emite o texto padrão em inglês, e como a action devolve `issues[0].message`, esse inglês vaza direto para a tela.

```ts
const sendWindowSchema = z
    .object({
        sendWindowEnabled: z.boolean(),
        sendTimezone: z.string().min(1, "Selecione um fuso horário"),
        sendDays: z
            .array(z.number().int().min(1).max(7))
            .min(1, "Selecione ao menos um dia"),
        sendStartHour: z
            .number()
            .int()
            .min(0, "A hora inicial deve estar entre 0 e 23")
            .max(23, "A hora inicial deve estar entre 0 e 23"),
        sendEndHour: z
            .number()
            .int()
            .min(1, "A hora final deve estar entre 1 e 24")
            .max(24, "A hora final deve estar entre 1 e 24"),
        sendJitterMinutes: z
            .number()
            .int()
            .min(0, "A variação deve estar entre 0 e 120 minutos")
            .max(120, "A variação deve estar entre 0 e 120 minutos"),
    })
    .refine((data) => data.sendEndHour > data.sendStartHour, {
        message: "O fim da janela precisa ser depois do início",
        path: ["sendEndHour"],
    })
    // Guard crítico: o cron de envio roda uma vez por dia, sempre no mesmo
    // horário UTC. Janela que não contenha esse instante nunca envia nada — o
    // motor adia, o cron volta no mesmo horário e adia de novo, para sempre.
    // Recusar na escrita é a única forma de o usuário descobrir isso na hora
    // de salvar, e não semanas depois com a campanha parada em silêncio.
    .refine((data) => windowCoversCronRun(resolveSendWindow(data, null)), {
        path: ["sendStartHour"],
        // zod v4 não aceita mais uma função para o params inteiro do refine —
        // só `error` pode ser função, recebendo o issue (com `.input` cru).
        error: (issue) => {
            const data = issue.input as { sendTimezone: string }
            return `Os envios saem uma vez por dia, às ${CRON_SEND_HOUR_UTC}h UTC (${describeCronHourIn(
                data.sendTimezone
            )} no fuso escolhido). A janela precisa incluir esse horário, senão nenhum e-mail é enviado.`
        },
    })

export type SendWindowSettingsData = z.infer<typeof sendWindowSchema>
```

E, no fim do arquivo, as duas actions:

```ts
/**
 * Busca a janela de envio de cold mail do workspace.
 */
export async function getSendWindowSettings(
    workspaceId: string
): Promise<ActionResult<SendWindowSettingsData>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                sendWindowEnabled: true,
                sendTimezone: true,
                sendDays: true,
                sendStartHour: true,
                sendEndHour: true,
                sendJitterMinutes: true,
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        return { success: true, data: workspace }
    } catch (error) {
        console.error("Erro ao buscar janela de envio:", error)
        return { success: false, error: "Erro ao buscar janela de envio" }
    }
}

/**
 * Atualiza a janela de envio de cold mail do workspace.
 */
export async function updateSendWindowSettings(
    workspaceId: string,
    data: SendWindowSettingsData
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = sendWindowSchema.safeParse(data)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || "Dados inválidos",
            }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                sendWindowEnabled: parsed.data.sendWindowEnabled,
                sendTimezone: parsed.data.sendTimezone,
                sendDays: parsed.data.sendDays,
                sendStartHour: parsed.data.sendStartHour,
                sendEndHour: parsed.data.sendEndHour,
                sendJitterMinutes: parsed.data.sendJitterMinutes,
            },
        })

        revalidatePath("/settings")

        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar janela de envio:", error)
        return { success: false, error: "Erro ao atualizar janela de envio." }
    }
}
```

- [ ] **Step 2: Criar `app/(crm)/settings/components/send-window-settings.tsx`**

```tsx
// app/(crm)/settings/components/send-window-settings.tsx
"use client"

import { useState, useTransition } from "react"
import { Clock } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    updateSendWindowSettings,
    type SendWindowSettingsData,
} from "@/actions/workspace-settings"
import {
    CRON_SEND_HOUR_UTC,
    describeCronHourIn,
} from "@/lib/campaigns/send-window"

// Fusos oferecidos na UI. Lista curta e explícita — cobre operação BR e público
// europeu, que é o caso real do produto.
const TIMEZONES = [
    { value: "UTC", label: "UTC" },
    { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
    { value: "Europe/Lisbon", label: "Lisboa (Europe/Lisbon)" },
    { value: "Europe/Berlin", label: "Berlim (Europe/Berlin)" },
    { value: "Europe/Madrid", label: "Madri (Europe/Madrid)" },
    { value: "Europe/London", label: "Londres (Europe/London)" },
    { value: "America/New_York", label: "Nova York (America/New_York)" },
]

const WEEKDAYS = [
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
    { value: 7, label: "Dom" },
]

interface SendWindowSettingsProps {
    workspaceId: string
    initial: SendWindowSettingsData
}

export function SendWindowSettings({ workspaceId, initial }: SendWindowSettingsProps) {
    const [form, setForm] = useState<SendWindowSettingsData>(initial)
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
        null
    )
    const [isPending, startTransition] = useTransition()

    function toggleDay(day: number) {
        setForm((current) => ({
            ...current,
            sendDays: current.sendDays.includes(day)
                ? current.sendDays.filter((value) => value !== day)
                : [...current.sendDays, day].sort((a, b) => a - b),
        }))
    }

    function handleSave() {
        setMessage(null)
        startTransition(async () => {
            const result = await updateSendWindowSettings(workspaceId, form)
            setMessage(
                result.success
                    ? { type: "ok", text: "Janela de envio salva." }
                    : { type: "error", text: result.error || "Erro ao salvar." }
            )
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Janela de envio
                </CardTitle>
                <CardDescription>
                    Define quando as campanhas de e-mail podem sair. Envios fora da
                    janela são adiados para o próximo horário válido.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    Os envios são processados <strong>uma vez por dia</strong>, às{" "}
                    {CRON_SEND_HOUR_UTC}h UTC ({describeCronHourIn(form.sendTimezone)} no
                    fuso selecionado). A janela precisa incluir esse horário — se não
                    incluir, nenhum e-mail é enviado.
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="sendWindowEnabled">Respeitar a janela</Label>
                        <p className="text-sm text-muted-foreground">
                            Desligado, os e-mails saem a qualquer hora.
                        </p>
                    </div>
                    <Switch
                        id="sendWindowEnabled"
                        checked={form.sendWindowEnabled}
                        onCheckedChange={(checked) =>
                            setForm((current) => ({
                                ...current,
                                sendWindowEnabled: checked,
                            }))
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sendTimezone">Fuso horário</Label>
                    <Select
                        value={form.sendTimezone}
                        onValueChange={(value) =>
                            setForm((current) => ({ ...current, sendTimezone: value }))
                        }
                    >
                        <SelectTrigger id="sendTimezone">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map((timezone) => (
                                <SelectItem key={timezone.value} value={timezone.value}>
                                    {timezone.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Dias de envio</Label>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                            <Button
                                key={day.value}
                                type="button"
                                variant={
                                    form.sendDays.includes(day.value)
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => toggleDay(day.value)}
                            >
                                {day.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="sendStartHour">Hora inicial</Label>
                        <Input
                            id="sendStartHour"
                            type="number"
                            min={0}
                            max={23}
                            value={form.sendStartHour}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendStartHour: Number(event.target.value),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendEndHour">Hora final</Label>
                        <Input
                            id="sendEndHour"
                            type="number"
                            min={1}
                            max={24}
                            value={form.sendEndHour}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendEndHour: Number(event.target.value),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendJitterMinutes">Variação (min)</Label>
                        <Input
                            id="sendJitterMinutes"
                            type="number"
                            min={0}
                            max={120}
                            value={form.sendJitterMinutes}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendJitterMinutes: Number(event.target.value),
                                }))
                            }
                        />
                    </div>
                </div>

                {message && (
                    <p
                        className={
                            message.type === "ok"
                                ? "text-sm text-emerald-600"
                                : "text-sm text-destructive"
                        }
                    >
                        {message.text}
                    </p>
                )}

                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar janela de envio"}
                </Button>
            </CardContent>
        </Card>
    )
}
```

- [ ] **Step 3: Buscar os dados na página e passar ao client**

Em `app/(crm)/settings/page.tsx`, adicionar a chamada de `getSendWindowSettings(workspaceId)` junto das buscas existentes e repassar o resultado (`sendWindow`) para `<SettingsClient />`. Se `result.success` for falso, passar `null`.

Em `app/(crm)/settings/settings-client.tsx`:

1. Importar o componente e o tipo:

```tsx
import { SendWindowSettings } from "./components/send-window-settings"
import type { SendWindowSettingsData } from "@/actions/workspace-settings"
```

2. Acrescentar a prop na interface `SettingsClientProps`:

```tsx
    sendWindow: SendWindowSettingsData | null
```

3. Dentro de `<TabsContent value="email">` (linha ~221), renderizar abaixo de `<EmailSettings ... />`:

```tsx
                        {sendWindow && (
                            <div className="mt-6">
                                <SendWindowSettings
                                    workspaceId={workspace.id}
                                    initial={sendWindow}
                                />
                            </div>
                        )}
```

- [ ] **Step 4: Verificar tipos e build**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros de tipo; testes PASS.

- [ ] **Step 5: Verificar visualmente**

Subir o dev server pelo `.claude/launch.json` (porta 3001), abrir `/settings?tab=email` e conferir:

1. O cartão "Janela de envio" aparece, com o aviso de que os envios saem uma vez por dia.
2. Desmarcar todos os dias e salvar devolve "Selecione ao menos um dia".
3. Salvar com fuso `UTC` e 9→17 persiste após recarregar.
4. **O guard do cron funciona:** trocar o fuso para `America/Sao_Paulo` mantendo 9→17 e salvar **deve ser recusado**, com a mensagem explicando que os envios saem às 9h UTC (6h em Brasília) e que a janela precisa incluir esse horário. Ajustar para 6→17 no mesmo fuso deve passar.
5. O texto de aviso acompanha o fuso selecionado (trocar o select muda a hora citada entre parênteses).

- [ ] **Step 6: Commit**

```bash
git add actions/workspace-settings.ts "app/(crm)/settings"
git commit -m "feat(cold-mail): UI de janela de envio nas configuracoes do workspace"
```

---

## Task 5: Override de janela por campanha (CM-1)

**Files:**
- Modify: `components/campaigns/campaign-wizard.tsx`
- Modify: `actions/campaigns.ts`

**Interfaces:**
- Consumes: campos de override do `Campaign` (Task 2).
- Produces: os campos de override passam a ser persistidos na criação/edição de campanha.

- [ ] **Step 1: Localizar o ponto de configuração avançada do wizard**

```bash
grep -n "stopOnConverted\|stopOnUnsubscribe" components/campaigns/campaign-wizard.tsx actions/campaigns.ts
```

O override de janela entra **no mesmo bloco** em que hoje vivem `stopOnConverted`/`stopOnUnsubscribe` — tanto no formulário quanto no payload da action. Use as ocorrências retornadas como âncora para os passos seguintes.

- [ ] **Step 2: Adicionar o estado de override no wizard**

No `useState` do formulário da campanha, acrescentar aos valores iniciais:

```tsx
        sendWindowEnabled: null as boolean | null,
        sendTimezone: null as string | null,
        sendDays: [] as number[],
        sendStartHour: null as number | null,
        sendEndHour: null as number | null,
        sendJitterMinutes: null as number | null,
```

E, junto dos switches de `stopOnConverted`/`stopOnUnsubscribe`, renderizar o controle de herança:

```tsx
                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="overrideWindow">Janela de envio própria</Label>
                            <p className="text-sm text-muted-foreground">
                                Desligado, esta campanha usa a janela do workspace.
                            </p>
                        </div>
                        <Switch
                            id="overrideWindow"
                            checked={formData.sendWindowEnabled !== null}
                            onCheckedChange={(checked) =>
                                setFormData((current) => ({
                                    ...current,
                                    sendWindowEnabled: checked ? true : null,
                                    sendDays: checked ? [1, 2, 3, 4, 5] : [],
                                    sendStartHour: checked ? 9 : null,
                                    sendEndHour: checked ? 17 : null,
                                }))
                            }
                        />
                    </div>

                    {formData.sendWindowEnabled !== null && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="campaignStartHour">Hora inicial</Label>
                                <Input
                                    id="campaignStartHour"
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={formData.sendStartHour ?? 9}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            sendStartHour: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="campaignEndHour">Hora final</Label>
                                <Input
                                    id="campaignEndHour"
                                    type="number"
                                    min={1}
                                    max={24}
                                    value={formData.sendEndHour ?? 17}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            sendEndHour: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
```

- [ ] **Step 3: Persistir o override na action de campanha**

Em `actions/campaigns.ts`, nas funções de criar e atualizar campanha, incluir os seis campos no `data` do Prisma, exatamente como vieram do formulário (null significa herdar):

```ts
            sendWindowEnabled: data.sendWindowEnabled ?? null,
            sendTimezone: data.sendTimezone ?? null,
            sendDays: data.sendDays ?? [],
            sendStartHour: data.sendStartHour ?? null,
            sendEndHour: data.sendEndHour ?? null,
            sendJitterMinutes: data.sendJitterMinutes ?? null,
```

Acrescentar os mesmos campos ao schema Zod da campanha, todos opcionais/nuláveis, com mensagens em português em toda restrição numérica (zod 4 emite texto padrão em inglês quando falta mensagem, e ele vaza para a tela):

```ts
    sendWindowEnabled: z.boolean().nullable().optional(),
    sendTimezone: z.string().nullable().optional(),
    sendDays: z.array(z.number().int().min(1).max(7)).optional(),
    sendStartHour: z
        .number()
        .int()
        .min(0, "A hora inicial deve estar entre 0 e 23")
        .max(23, "A hora inicial deve estar entre 0 e 23")
        .nullable()
        .optional(),
    sendEndHour: z
        .number()
        .int()
        .min(1, "A hora final deve estar entre 1 e 24")
        .max(24, "A hora final deve estar entre 1 e 24")
        .nullable()
        .optional(),
    sendJitterMinutes: z
        .number()
        .int()
        .min(0, "A variação deve estar entre 0 e 120 minutos")
        .max(120, "A variação deve estar entre 0 e 120 minutos")
        .nullable()
        .optional(),
```

E — **obrigatório, não opcional** — a ordenação das horas nos dois schemas (create e update). Sem ela existe um bug espelho do que esta fase inteira combate: `resolveSendWindow` calcula `enabled` como `... && endHour > startHour`, então um par invertido (17→9) produz janela **desligada**, e `windowCoversCronRun` libera janela desligada. Resultado: a campanha salva sem erro e no cron `isWithinSendWindow` devolve `true` sempre — a janela que o usuário configurou não restringe nada. Em vez de "nunca envia em silêncio", vira "envia a qualquer hora em silêncio".

Como os campos são `.nullable().optional()`, o predicado só compara quando os **dois** são números de verdade — e o teste precisa ser `typeof`, não veracidade: `sendStartHour: 0` é meia-noite legítima e é falsy.

```ts
// Fora dos schemas, no mesmo arquivo:
function hasValidSendWindowOrder(data: {
    sendStartHour?: number | null
    sendEndHour?: number | null
}): boolean {
    if (typeof data.sendStartHour !== "number" || typeof data.sendEndHour !== "number") {
        return true
    }
    return data.sendEndHour > data.sendStartHour
}
```

Encadear em **ambos** os schemas (no `createCampaignSchema`, depois do refine de tipo/template/steps que já existe — sem mesclar os dois):

```ts
.refine(hasValidSendWindowOrder, {
    message: "O fim da janela precisa ser depois do início",
    path: ["sendEndHour"],
})
```

Cobrir com testes em `lib/validations/campaign.validations.test.ts` (arquivo novo), nos dois schemas: par invertido recusado, par igual recusado (a janela seria vazia e `resolveSendWindow` exige `>` estrito), par válido aceito, **ambos ausentes aceito** (é o caso "herda do workspace" — um refine que recusasse isso quebraria toda campanha sem override) e apenas um dos dois presente aceito.

- [ ] **Step 4: Validar que o override da campanha também é alcançável pelo cron**

O override por campanha recria exatamente a armadilha que a Task 4 fechou no workspace: uma campanha com janela que não contenha a execução diária das 09:00 UTC nunca envia, em silêncio. A diferença é que aqui a janela **efetiva** só existe depois de combinar o override com os defaults do workspace — o formulário nem oferece fuso, então a campanha herda o do workspace, e é a combinação que precisa ser validada.

Nas funções de criar e atualizar campanha, **depois** de validar o schema e **antes** de escrever no banco, resolver a janela efetiva e recusar se ela for inalcançável:

```ts
        // Só faz sentido checar quando a campanha define override próprio;
        // sem override ela herda o workspace, que a Task 4 já validou na escrita.
        const hasWindowOverride =
            data.sendWindowEnabled !== null && data.sendWindowEnabled !== undefined

        if (hasWindowOverride) {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: {
                    sendWindowEnabled: true,
                    sendTimezone: true,
                    sendDays: true,
                    sendStartHour: true,
                    sendEndHour: true,
                    sendJitterMinutes: true,
                },
            })

            if (!workspace) {
                return { success: false, error: "Workspace não encontrado" }
            }

            const effectiveWindow = resolveSendWindow(workspace, {
                sendWindowEnabled: data.sendWindowEnabled ?? null,
                sendTimezone: data.sendTimezone ?? null,
                sendDays: data.sendDays ?? [],
                sendStartHour: data.sendStartHour ?? null,
                sendEndHour: data.sendEndHour ?? null,
                sendJitterMinutes: data.sendJitterMinutes ?? null,
            })

            if (!windowCoversCronRun(effectiveWindow)) {
                return {
                    success: false,
                    error: `Os envios saem uma vez por dia, às ${CRON_SEND_HOUR_UTC}h UTC (${describeCronHourIn(
                        effectiveWindow.timezone
                    )} no fuso do workspace). A janela desta campanha precisa incluir esse horário, senão nenhum e-mail é enviado.`,
                }
            }
        }
```

Acrescentar ao topo de `actions/campaigns.ts`:

```ts
import {
    resolveSendWindow,
    windowCoversCronRun,
    describeCronHourIn,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"
```

Se as funções de criar e atualizar campanha já compartilham um helper de validação, colocar o bloco lá em vez de duplicá-lo nas duas. Se não compartilham, extrair uma função local — não copiar o bloco duas vezes.

Adaptar o formato do retorno de erro ao que as actions de campanha já usam neste arquivo (leia-as antes: o tipo de retorno pode não ser `ActionResult`).

- [ ] **Step 5: Verificar tipos e testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; testes PASS.

- [ ] **Step 6: Verificar visualmente**

No dev server, criar uma campanha com "Janela de envio própria" ligada em 10→12 e conferir no banco que `campaigns.sendStartHour = 10`; criar outra sem ligar e conferir que os campos ficam `NULL` e `sendDays = {}`. Com o workspace em `UTC`, criar uma terceira com override 14→18 e conferir que **é recusada** com a mensagem do cron (14h UTC não contém as 9h UTC).

- [ ] **Step 7: Commit**

```bash
git add components/campaigns/campaign-wizard.tsx actions/campaigns.ts
git commit -m "feat(cold-mail): override de janela de envio por campanha"
```

---

## Task 6: Classificador de bounce (CM-2)

**Files:**
- Create: `lib/campaigns/bounce-classifier.ts`
- Test: `lib/campaigns/bounce-classifier.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `export type BounceType = "hard" | "soft" | "unknown"`
  - `classifyBounce(reason: string | null | undefined): BounceType`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/campaigns/bounce-classifier.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { classifyBounce } from "./bounce-classifier"

describe("classifyBounce", () => {
    it("classifica caixa inexistente como hard", () => {
        expect(classifyBounce("550 5.1.1 User unknown")).toBe("hard")
        expect(classifyBounce("Recipient address rejected: does not exist")).toBe("hard")
        expect(classifyBounce("No such user here")).toBe("hard")
        expect(classifyBounce("551 invalid recipient")).toBe("hard")
    })

    it("classifica falha temporária como soft", () => {
        expect(classifyBounce("452 4.2.2 Mailbox full")).toBe("soft")
        expect(classifyBounce("Over quota, try again later")).toBe("soft")
        expect(classifyBounce("421 service temporarily unavailable")).toBe("soft")
        expect(classifyBounce("Connection timeout")).toBe("soft")
        expect(classifyBounce("Greylisted, please retry")).toBe("soft")
    })

    it("é insensível a maiúsculas e espaços", () => {
        expect(classifyBounce("  550 USER UNKNOWN  ")).toBe("hard")
    })

    it("devolve unknown para motivo vazio ou irreconhecível", () => {
        expect(classifyBounce(null)).toBe("unknown")
        expect(classifyBounce(undefined)).toBe("unknown")
        expect(classifyBounce("")).toBe("unknown")
        expect(classifyBounce("algo deu errado")).toBe("unknown")
    })

    it("prioriza hard quando o motivo tem sinais dos dois tipos", () => {
        expect(classifyBounce("550 user unknown; connection closed")).toBe("hard")
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/bounce-classifier.test.ts
```

Esperado: FAIL com `Failed to resolve import "./bounce-classifier"`.

- [ ] **Step 3: Implementar `lib/campaigns/bounce-classifier.ts`**

> **Correção aplicada durante a execução (2026-07-24).** A primeira versão deste passo
> guardava tudo numa lista plana de strings e casava com `includes()`. Três rodadas de
> review derrubaram essa abordagem: os códigos SMTP de três dígitos casavam **dentro de
> qualquer número** — `550` aparece em `45500ms`, em `5510000 bytes` e num queue id do
> Postfix como `20260724165503`; e o código estendido `5.1.1` casava dentro de
> `192.168.5.1.1` e de `openssh_5.1.1p1`. Todos esses viravam `hard`, que alimenta
> supressão **permanente**. O texto abaixo já é a versão corrigida — não voltar para
> `includes()` nos códigos.

A regra que separa as duas famílias: **frase de texto** casa por substring (é linguagem
natural, e `"mailbox full"` não aparece por acidente); **código numérico** casa por
estrutura, porque três dígitos aparecem em qualquer lugar.

```ts
// lib/campaigns/bounce-classifier.ts

/**
 * Classificação de bounce a partir da mensagem de erro do servidor SMTP.
 * Puro e conservador: só marca `hard` diante de sinal explícito de destinatário
 * inexistente/recusado, porque um `hard` alimenta a supressão permanente — um
 * `hard` falso destrói um prospect real e é praticamente irreversível, enquanto
 * um `soft` falso custa apenas uma tentativa desperdiçada.
 */

export type BounceType = "hard" | "soft" | "unknown"

const HARD_TEXT_PATTERNS = [
    "user unknown",
    "unknown user",
    "no such user",
    "no such recipient",
    "does not exist",
    "doesn't exist",
    "recipient rejected",
    "address rejected",
    "invalid recipient",
    "invalid address",
    "mailbox unavailable",
    "mailbox not found",
    "account disabled",
    "user not found",
]

const SOFT_TEXT_PATTERNS = [
    "mailbox full",
    "over quota",
    "quota exceeded",
    "insufficient storage",
    "try again",
    "temporarily",
    "temporary failure",
    "greylist",
    "timeout",
    "timed out",
    "connection",
    "rate limit",
    "too many",
]

const HARD_BASIC_CODES = ["550", "551", "553"]
const HARD_ENHANCED_CODES = ["5.1.1", "5.1.10", "5.4.1"]

const SOFT_BASIC_CODES = ["421", "450", "451", "452"]
const SOFT_ENHANCED_CODES = ["4.2.2"]

// Código básico de status SMTP (RFC 5321): três dígitos no início da mensagem
// OU no início de uma linha, seguidos de espaço, hífen ou fim de string.
// Espaços/tabs iniciais são tolerados antes do código.
function hasBasicCode(normalized: string, code: string): boolean {
    const pattern = new RegExp(`(^|\\n)[ \\t]*${code}(?:[ \\t\\-]|$)`, "m")
    return pattern.test(normalized)
}

// Código estendido (RFC 3463). O lookaround exclui letra, dígito, underscore e
// ponto dos dois lados; sem isso o código casa dentro de outro número pontuado
// (`192.168.5.1.1`) ou colado a texto (`v5.1.1`, `openssh_5.1.1p1`).
// LIMITAÇÃO ACEITA: código isolado entre espaços é indistinguível de número de
// versão — `"version 5.1.1 of the mail server"` classifica como `hard`. Não se
// resolve com regex; exigiria interpretar o contexto da frase.
function hasEnhancedCode(normalized: string, code: string): boolean {
    const escaped = code.replace(/\./g, "\\.")
    const pattern = new RegExp(`(?<![\\w.])${escaped}(?![\\w.])`)
    return pattern.test(normalized)
}

function matchesAnyCode(
    normalized: string,
    basicCodes: string[],
    enhancedCodes: string[]
): boolean {
    return (
        basicCodes.some((code) => hasBasicCode(normalized, code)) ||
        enhancedCodes.some((code) => hasEnhancedCode(normalized, code))
    )
}

export function classifyBounce(reason: string | null | undefined): BounceType {
    if (!reason) {
        return "unknown"
    }

    const normalized = reason.trim().toLowerCase()

    if (!normalized) {
        return "unknown"
    }

    // Hard vence: na dúvida entre os dois, o sinal mais grave manda.
    if (
        HARD_TEXT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
        matchesAnyCode(normalized, HARD_BASIC_CODES, HARD_ENHANCED_CODES)
    ) {
        return "hard"
    }

    if (
        SOFT_TEXT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
        matchesAnyCode(normalized, SOFT_BASIC_CODES, SOFT_ENHANCED_CODES)
    ) {
        return "soft"
    }

    return "unknown"
}
```

Além dos casos do Step 1, cobrir com testes os falsos positivos que motivaram a
correção — nenhum deles pode dar `hard`:
`"Delivery failed: connection timed out after 45500ms"`,
`"Message size 5510000 bytes exceeds limit, mailbox full"`,
`"Anti-spam block Ref 5530293, please contact administrator"`,
`"Queue id 20260724165503 rejected, please retry"`,
`"route via 192.168.5.1.1 failed"`, `"log 10.5.1.1.9"`,
`"v5.1.1 rejected"`, `"5.1.1a build failed"` e `"openssh_5.1.1p1 protocol error"`.

E provar que o casamento legítimo continua valendo: `"550 5.1.1 User unknown"`,
`"  550 USER UNKNOWN  "`, `"5.1.1, aborting"`, `"(5.1.1)"`, código no começo e no
fim da string, e `5.1.10` casando o próprio padrão sem casar o de `5.1.1`.


- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/bounce-classifier.test.ts
```

Esperado: PASS, 5 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/campaigns/bounce-classifier.ts lib/campaigns/bounce-classifier.test.ts
git commit -m "feat(cold-mail): classificador de bounce hard/soft"
```

---

## Task 7: Migração — supressão, tipo de bounce, messageId e IMAP (CM-2 e CM-3)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260724130000_add_suppression_and_reply_detection/migration.sql`

**Interfaces:**
- Consumes: `BounceType` (Task 6) como vocabulário do enum.
- Produces:
  - enum `SuppressionReason { hard_bounce complaint unsubscribe manual }`
  - enum `BounceType { hard soft unknown }`
  - model `Suppression { id, email, workspaceId?, reason, detail?, createdAt }`
  - `EmailSend.bounceType: BounceType?`, `EmailSend.messageId: String?` (indexado)
  - `Workspace.imapHost?`, `Workspace.imapPort?`, `Workspace.replyDetectionEnabled` (default `false`), `Workspace.replyCheckedAt?`

- [ ] **Step 1: Adicionar enums e model ao schema**

Em `prisma/schema.prisma`, junto dos demais enums (após `enum WorkspacePlan`, linha ~128):

```prisma
enum SuppressionReason {
  hard_bounce
  complaint
  unsubscribe
  manual
}

enum BounceType {
  hard
  soft
  unknown
}
```

E, após o model `EmailSend` (linha ~475):

```prisma
// ==================== SUPRESSÃO ====================

/// Lista de supressão de cold mail. `workspaceId` nulo = supressão global
/// (vale para todos os workspaces). O e-mail é sempre gravado normalizado
/// (trim + lowercase) por `normalizeEmail`.
model Suppression {
  id          String            @id @default(cuid())
  email       String
  workspaceId String?
  reason      SuppressionReason
  detail      String?
  createdAt   DateTime          @default(now())

  @@index([email])
  @@index([workspaceId, email])
  @@map("suppressions")
}
```

- [ ] **Step 2: Adicionar os campos novos a `EmailSend` e `Workspace`**

Em `model EmailSend`, junto de `bounceReason`:

```prisma
  bounceType   BounceType?
  messageId    String? // Message-ID gerado no envio, usado para casar respostas
```

E, no bloco de índices do mesmo model, acrescentar:

```prisma
  @@index([messageId])
```

Em `model Workspace`, abaixo do bloco de janela de envio:

```prisma
  // 🆕 Detecção de resposta via IMAP
  imapHost              String?
  imapPort              Int?
  replyDetectionEnabled Boolean   @default(false)
  replyCheckedAt        DateTime?
```

- [ ] **Step 3: Gerar o SQL da migração**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && mkdir -p prisma/migrations/20260724130000_add_suppression_and_reply_detection && npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260724130000_add_suppression_and_reply_detection/migration.sql
```

- [ ] **Step 4: Limpar o SQL gerado**

Abrir o arquivo e manter **somente**: os dois `CREATE TYPE`, o `CREATE TABLE "suppressions"`, os `CREATE INDEX` de `suppressions` e de `email_sends("messageId")`, e os `ALTER TABLE` de `email_sends` e `workspaces` com as colunas acima. Apagar os `CREATE INDEX` de `calls`/`leads`/`purchases` e quaisquer índices de `email_sends` que não sejam o de `messageId` — são o drift pré-existente.

- [ ] **Step 5: Aplicar e registrar**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx prisma db execute --file prisma/migrations/20260724130000_add_suppression_and_reply_detection/migration.sql --schema prisma/schema.prisma && npx prisma migrate resolve --applied 20260724130000_add_suppression_and_reply_detection && npx prisma generate
```

Esperado: `Script executed successfully.` e `Generated Prisma Client`.

- [ ] **Step 6: Rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test
```

Esperado: PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260724130000_add_suppression_and_reply_detection
git commit -m "feat(cold-mail): model de supressao, tipo de bounce, messageId e campos IMAP"
```

---

## Task 8: Helpers de supressão (CM-2)

**Files:**
- Create: `lib/campaigns/suppression.ts`
- Test: `lib/campaigns/suppression.test.ts`

**Interfaces:**
- Consumes: model `Suppression` (Task 7).
- Produces:
  - `normalizeEmail(email: string): string`
  - `isSuppressed(db: PrismaClient, email: string, workspaceId: string): Promise<boolean>`
  - `filterSuppressed(db: PrismaClient, emails: string[], workspaceId: string): Promise<Set<string>>`
  - `addSuppression(db: PrismaClient, input: { email: string; workspaceId: string | null; reason: SuppressionReason; detail?: string | null }): Promise<void>` — nunca lança
  - `removeSuppression(db: PrismaClient, id: string, workspaceId: string): Promise<void>`
  - `type SuppressionReason = "hard_bounce" | "complaint" | "unsubscribe" | "manual"`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/campaigns/suppression.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import type { PrismaClient } from "@prisma/client"
import {
    normalizeEmail,
    isSuppressed,
    filterSuppressed,
    addSuppression,
    removeSuppression,
} from "./suppression"

function createMockPrisma(overrides: Record<string, unknown> = {}): PrismaClient {
    return {
        suppression: {
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({}),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            ...overrides,
        },
    } as unknown as PrismaClient
}

describe("normalizeEmail", () => {
    it("remove espaços e baixa a caixa", () => {
        expect(normalizeEmail("  Joao@Empresa.DE ")).toBe("joao@empresa.de")
    })
})

describe("isSuppressed", () => {
    it("é verdadeiro quando existe registro global ou do workspace", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue({ id: "s1" }),
        })
        await expect(isSuppressed(prisma, "A@B.com", "ws-1")).resolves.toBe(true)
        expect(prisma.suppression.findFirst).toHaveBeenCalledWith({
            where: {
                email: "a@b.com",
                OR: [{ workspaceId: null }, { workspaceId: "ws-1" }],
            },
            select: { id: true },
        })
    })

    it("é falso quando não existe registro", async () => {
        const prisma = createMockPrisma()
        await expect(isSuppressed(prisma, "a@b.com", "ws-1")).resolves.toBe(false)
    })

    it("fail-closed: erro de banco suprime o envio", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(isSuppressed(prisma, "a@b.com", "ws-1")).resolves.toBe(true)
    })
})

describe("filterSuppressed", () => {
    it("devolve o conjunto de e-mails suprimidos, normalizados", async () => {
        const prisma = createMockPrisma({
            findMany: vi.fn().mockResolvedValue([{ email: "a@b.com" }]),
        })
        const result = await filterSuppressed(prisma, ["A@B.com", "c@d.com"], "ws-1")
        expect(result.has("a@b.com")).toBe(true)
        expect(result.has("c@d.com")).toBe(false)
    })

    it("propaga o erro de banco para o chamador abortar o lote", async () => {
        const prisma = createMockPrisma({
            findMany: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(
            filterSuppressed(prisma, ["a@b.com"], "ws-1")
        ).rejects.toThrow("db down")
    })
})

describe("addSuppression", () => {
    it("cria o registro com o e-mail normalizado", async () => {
        const prisma = createMockPrisma()
        await addSuppression(prisma, {
            email: " X@Y.com ",
            workspaceId: "ws-1",
            reason: "hard_bounce",
            detail: "550 user unknown",
        })
        expect(prisma.suppression.create).toHaveBeenCalledWith({
            data: {
                email: "x@y.com",
                workspaceId: "ws-1",
                reason: "hard_bounce",
                detail: "550 user unknown",
            },
        })
    })

    it("não duplica quando já existe registro equivalente", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue({ id: "s1" }),
        })
        await addSuppression(prisma, {
            email: "x@y.com",
            workspaceId: "ws-1",
            reason: "unsubscribe",
        })
        expect(prisma.suppression.create).not.toHaveBeenCalled()
    })

    it("nunca lança quando o banco falha", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(
            addSuppression(prisma, {
                email: "x@y.com",
                workspaceId: null,
                reason: "manual",
            })
        ).resolves.toBeUndefined()
    })
})

describe("removeSuppression", () => {
    it("só apaga registros do próprio workspace", async () => {
        const prisma = createMockPrisma()
        await removeSuppression(prisma, "s1", "ws-1")
        expect(prisma.suppression.deleteMany).toHaveBeenCalledWith({
            where: { id: "s1", workspaceId: "ws-1" },
        })
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/suppression.test.ts
```

Esperado: FAIL com `Failed to resolve import "./suppression"`.

- [ ] **Step 3: Implementar `lib/campaigns/suppression.ts`**

```ts
// lib/campaigns/suppression.ts

import type { PrismaClient } from "@prisma/client"

export type SuppressionReason = "hard_bounce" | "complaint" | "unsubscribe" | "manual"

export interface AddSuppressionInput {
    email: string
    /** null = supressão global (vale para todos os workspaces). */
    workspaceId: string | null
    reason: SuppressionReason
    detail?: string | null
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

/**
 * Fail-CLOSED de propósito: se o banco falhar, tratamos como suprimido e não
 * enviamos. Mandar e-mail para quem pediu para sair (ou para um endereço morto)
 * custa reputação de domínio; deixar de mandar um e-mail não custa nada.
 */
export async function isSuppressed(
    db: PrismaClient,
    email: string,
    workspaceId: string
): Promise<boolean> {
    try {
        const found = await db.suppression.findFirst({
            where: {
                email: normalizeEmail(email),
                OR: [{ workspaceId: null }, { workspaceId }],
            },
            select: { id: true },
        })
        return found !== null
    } catch (error) {
        console.error("[Suppression] Falha ao consultar supressão:", error)
        return true
    }
}

/**
 * Versão em lote de `isSuppressed`, para não consultar o banco por destinatário.
 * Devolve o conjunto de e-mails normalizados que estão suprimidos.
 *
 * Ao contrário de `isSuppressed`, esta **propaga** o erro em vez de devolver
 * "tudo suprimido": ela é chamada antes de qualquer envio do lote, então
 * deixar a exceção subir aborta o disparo inteiro sem mandar e-mail nenhum —
 * que é o comportamento fail-closed correto. Devolver o conjunto cheio faria o
 * chamador marcar todos os envios como bounce de supressão, gravando um dado
 * falso e irreversível por causa de uma falha transitória de banco.
 */
export async function filterSuppressed(
    db: PrismaClient,
    emails: string[],
    workspaceId: string
): Promise<Set<string>> {
    const normalized = emails.map(normalizeEmail)

    const rows = await db.suppression.findMany({
        where: {
            email: { in: normalized },
            OR: [{ workspaceId: null }, { workspaceId }],
        },
        select: { email: true },
    })

    return new Set(rows.map((row) => row.email))
}

/**
 * Registra uma supressão. NUNCA lança: uma falha aqui não pode derrubar o
 * fluxo de envio ou de unsubscribe que a originou.
 */
export async function addSuppression(
    db: PrismaClient,
    input: AddSuppressionInput
): Promise<void> {
    const email = normalizeEmail(input.email)

    try {
        const existing = await db.suppression.findFirst({
            where: { email, workspaceId: input.workspaceId },
            select: { id: true },
        })

        if (existing) {
            return
        }

        await db.suppression.create({
            data: {
                email,
                workspaceId: input.workspaceId,
                reason: input.reason,
                detail: input.detail ?? null,
            },
        })
    } catch (error) {
        console.error("[Suppression] Falha ao registrar supressão:", error)
    }
}

/**
 * Remove uma supressão do próprio workspace. O filtro por `workspaceId` no
 * `deleteMany` é o que impede um workspace de apagar a supressão de outro
 * (ou uma supressão global).
 */
export async function removeSuppression(
    db: PrismaClient,
    id: string,
    workspaceId: string
): Promise<void> {
    await db.suppression.deleteMany({ where: { id, workspaceId } })
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/suppression.test.ts
```

Esperado: PASS, 9 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/campaigns/suppression.ts lib/campaigns/suppression.test.ts
git commit -m "feat(cold-mail): helpers de lista de supressao"
```

---

## Task 9: Integrar supressão e bounce nos caminhos de envio (CM-2)

**Files:**
- Modify: `app/api/cron/process-sequences/route.ts`
- Modify: `lib/services/campaigns.service.ts:142-197`
- Modify: `lib/email.ts`

**Interfaces:**
- Consumes: `isSuppressed`, `filterSuppressed`, `addSuppression`, `normalizeEmail` (Task 8); `classifyBounce` (Task 6); campos `bounceType`/`messageId` (Task 7).
- Produces: `SendEmailResult` ganha `messageId?: string` — consumido pela Task 15 (detecção de resposta).

- [ ] **Step 1: `lib/email.ts` — devolver o Message-ID do envio SMTP**

Na interface `SendEmailResult` (linha 38):

```ts
export interface SendEmailResult {
    success: boolean
    id?: string
    /** Message-ID do cabeçalho, quando o transporte fornece (SMTP). */
    messageId?: string
    error?: string
}
```

Em `sendEmailSmtp`, no retorno de sucesso (linha 131):

```ts
        return { success: true, id: info.messageId, messageId: info.messageId }
```

- [ ] **Step 2: `process-sequences` — checar supressão antes de enviar e suprimir em hard bounce**

Adicionar aos imports:

```ts
import { isSuppressed, addSuppression } from "@/lib/campaigns/suppression"
import { classifyBounce } from "@/lib/campaigns/bounce-classifier"
```

Dentro do loop, **logo antes** do bloco "Preparar dados do lead" (linha ~190), inserir:

```ts
                // Supressão vence qualquer configuração de campanha.
                if (await isSuppressed(prisma, lead.email, campaign.workspaceId)) {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "suppressed",
                        },
                    })
                    skipped++
                    console.log(
                        `[Cron] Lead ${lead.id} está na lista de supressão - parando sequência`
                    )
                    continue
                }
```

- [ ] **Step 3: `process-sequences` — gravar `messageId` no sucesso**

No `prisma.emailSend.update` de sucesso (linha ~265), acrescentar o campo:

```ts
                        data: {
                            status: "SENT",
                            sentAt: now,
                            resendId: result.id,
                            messageId: result.messageId ?? null,
                        },
```

- [ ] **Step 4: `process-sequences` — classificar o bounce e alimentar a supressão**

Trocar o bloco de erro de envio (linhas ~318-329) por:

```ts
                } else {
                    // Erro no envio
                    const bounceType = classifyBounce(result.error)

                    await prisma.emailSend.update({
                        where: { id: emailSend.id },
                        data: {
                            status: "BOUNCED",
                            bouncedAt: now,
                            bounceReason: result.error,
                            bounceType,
                        },
                    })

                    if (bounceType === "hard") {
                        await addSuppression(prisma, {
                            email: lead.email,
                            workspaceId: campaign.workspaceId,
                            reason: "hard_bounce",
                            detail: result.error ?? null,
                        })
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { status: "BOUNCED" },
                        })
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                status: "stopped",
                                stoppedAt: now,
                                stopReason: "hard_bounce",
                            },
                        })
                    }

                    errors++
                    console.error(`[Cron] Erro ao enviar para ${lead.email}: ${result.error}`)
                }
```

- [ ] **Step 5: `campaigns.service.ts` — filtrar suprimidos antes do disparo em massa**

Em `sendCampaignEmails`, logo depois de montar `smtpConfig` (linha ~131), inserir:

```ts
    // Consulta antes de qualquer envio: se o banco falhar, a exceção sobe e o
    // disparo inteiro é abortado sem mandar e-mail nenhum e sem gravar bounce
    // falso. É o fail-closed correto para este caminho.
    const suppressed = await filterSuppressed(
        prisma,
        campaign.emailSends.map((emailSend) => emailSend.lead.email),
        campaign.workspaceId
    )
```

E no início do `for (const emailSend of campaign.emailSends)` (linha 142):

```ts
        const lead = emailSend.lead

        if (suppressed.has(normalizeEmail(lead.email))) {
            result.suppressedIds.push(emailSend.id)
            continue
        }

```

Adicionar `suppressedIds: string[]` à interface `SendCampaignResult` e inicializá-lo com `[]` no objeto `result` (linha ~133). Antes do `return result`, marcar esses envios:

```ts
    if (result.suppressedIds.length > 0) {
        await prisma.emailSend.updateMany({
            where: { id: { in: result.suppressedIds } },
            data: { status: "BOUNCED", bounceReason: "Endereço na lista de supressão" },
        })
    }
```

Ajustar os imports do arquivo:

```ts
import { filterSuppressed, normalizeEmail } from "@/lib/campaigns/suppression"
```

Verificar se `campaign.workspaceId` está no tipo do parâmetro `campaign` de `sendCampaignEmails`; se não estiver, adicionar `workspaceId: string` à assinatura e incluí-lo no `select`/`include` de quem chama.

- [ ] **Step 6: Verificar tipos e rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; testes PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/cron/process-sequences/route.ts lib/services/campaigns.service.ts lib/email.ts
git commit -m "feat(cold-mail): supressao e classificacao de bounce nos caminhos de envio"
```

---

## Task 10: UI de supressões nas configurações (CM-2)

**Files:**
- Modify: `actions/workspace-settings.ts`
- Create: `app/(crm)/settings/components/suppression-list.tsx`
- Modify: `app/(crm)/settings/settings-client.tsx`
- Modify: `app/(crm)/settings/page.tsx`

**Interfaces:**
- Consumes: `addSuppression`, `removeSuppression` (Task 8).
- Produces:
  - `listWorkspaceSuppressions(workspaceId: string): Promise<ActionResult<SuppressionRow[]>>`
  - `addWorkspaceSuppression(workspaceId: string, email: string): Promise<ActionResult>`
  - `deleteWorkspaceSuppression(workspaceId: string, id: string): Promise<ActionResult>`
  - `export interface SuppressionRow { id: string; email: string; reason: string; detail: string | null; createdAt: string; isGlobal: boolean }`

- [ ] **Step 1: Adicionar as três actions em `actions/workspace-settings.ts`**

```ts
export interface SuppressionRow {
    id: string
    email: string
    reason: string
    detail: string | null
    createdAt: string
    isGlobal: boolean
}

/**
 * Lista as supressões que afetam este workspace (as próprias e as globais).
 */
export async function listWorkspaceSuppressions(
    workspaceId: string
): Promise<ActionResult<SuppressionRow[]>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const rows = await prisma.suppression.findMany({
            where: { OR: [{ workspaceId: null }, { workspaceId }] },
            orderBy: { createdAt: "desc" },
            take: 200,
        })

        return {
            success: true,
            data: rows.map((row) => ({
                id: row.id,
                email: row.email,
                reason: row.reason,
                detail: row.detail,
                createdAt: row.createdAt.toISOString(),
                isGlobal: row.workspaceId === null,
            })),
        }
    } catch (error) {
        console.error("Erro ao listar supressões:", error)
        return { success: false, error: "Erro ao listar supressões" }
    }
}

export async function addWorkspaceSuppression(
    workspaceId: string,
    email: string
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = z.string().email("E-mail inválido").safeParse(email.trim())
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message }
        }

        await addSuppression(prisma, {
            email: parsed.data,
            workspaceId,
            reason: "manual",
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao adicionar supressão:", error)
        return { success: false, error: "Erro ao adicionar supressão" }
    }
}

export async function deleteWorkspaceSuppression(
    workspaceId: string,
    id: string
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // removeSuppression filtra por workspaceId — supressão global não sai daqui.
        await removeSuppression(prisma, id, workspaceId)

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao remover supressão:", error)
        return { success: false, error: "Erro ao remover supressão" }
    }
}
```

Adicionar ao topo do arquivo:

```ts
import { addSuppression, removeSuppression } from "@/lib/campaigns/suppression"
```

- [ ] **Step 2: Criar `app/(crm)/settings/components/suppression-list.tsx`**

```tsx
// app/(crm)/settings/components/suppression-list.tsx
"use client"

import { useState, useTransition } from "react"
import { Ban, Trash2 } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    addWorkspaceSuppression,
    deleteWorkspaceSuppression,
    type SuppressionRow,
} from "@/actions/workspace-settings"

const REASON_LABELS: Record<string, string> = {
    hard_bounce: "Endereço inválido",
    complaint: "Marcou como spam",
    unsubscribe: "Cancelou inscrição",
    manual: "Adicionado manualmente",
}

interface SuppressionListProps {
    workspaceId: string
    initial: SuppressionRow[]
}

export function SuppressionList({ workspaceId, initial }: SuppressionListProps) {
    const [rows, setRows] = useState(initial)
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleAdd() {
        setError(null)
        startTransition(async () => {
            const result = await addWorkspaceSuppression(workspaceId, email)
            if (!result.success) {
                setError(result.error || "Erro ao adicionar.")
                return
            }
            setRows((current) => [
                {
                    id: `temp-${Date.now()}`,
                    email: email.trim().toLowerCase(),
                    reason: "manual",
                    detail: null,
                    createdAt: new Date().toISOString(),
                    isGlobal: false,
                },
                ...current,
            ])
            setEmail("")
        })
    }

    function handleRemove(id: string) {
        startTransition(async () => {
            const result = await deleteWorkspaceSuppression(workspaceId, id)
            if (result.success) {
                setRows((current) => current.filter((row) => row.id !== id))
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Lista de supressão
                </CardTitle>
                <CardDescription>
                    Endereços que nunca recebem e-mail de campanha, em qualquer
                    campanha deste workspace.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="email@empresa.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <Button onClick={handleAdd} disabled={isPending || !email.trim()}>
                        Adicionar
                    </Button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nenhum endereço suprimido.
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {rows.map((row) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {row.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {REASON_LABELS[row.reason] || row.reason}
                                        {row.detail ? ` — ${row.detail}` : ""}
                                    </p>
                                </div>
                                {row.isGlobal ? (
                                    <Badge variant="secondary">Global</Badge>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remover ${row.email} da supressão`}
                                        disabled={isPending}
                                        onClick={() => handleRemove(row.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
```

- [ ] **Step 3: Ligar na página de settings**

Em `app/(crm)/settings/page.tsx`, chamar `listWorkspaceSuppressions(workspaceId)` e repassar `suppressions` (ou `[]` em caso de falha) ao `SettingsClient`. Em `settings-client.tsx`, acrescentar a prop `suppressions: SuppressionRow[]` e renderizar dentro de `<TabsContent value="email">`, abaixo de `<SendWindowSettings />`:

```tsx
                        <div className="mt-6">
                            <SuppressionList
                                workspaceId={workspace.id}
                                initial={suppressions}
                            />
                        </div>
```

- [ ] **Step 4: Verificar tipos e testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; PASS.

- [ ] **Step 5: Verificar visualmente**

Em `/settings?tab=email`: adicionar `teste@exemplo.com`, confirmar que aparece na lista com "Adicionado manualmente", remover e confirmar que some. Conferir no banco que a linha foi criada com `email` em minúsculas.

- [ ] **Step 6: Commit**

```bash
git add actions/workspace-settings.ts "app/(crm)/settings"
git commit -m "feat(cold-mail): UI de lista de supressao no workspace"
```

---

## Task 11: Construção dos headers List-Unsubscribe (CM-4)

**Files:**
- Create: `lib/email/list-unsubscribe.ts`
- Test: `lib/email/list-unsubscribe.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `buildUnsubscribeUrl(baseUrl: string, emailSendId: string, signature: string): string`
  - `buildListUnsubscribeHeaders(unsubscribeUrl: string, mailto?: string | null): Record<string, string>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/email/list-unsubscribe.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { buildUnsubscribeUrl, buildListUnsubscribeHeaders } from "./list-unsubscribe"

describe("buildUnsubscribeUrl", () => {
    it("monta a URL com sid e sig", () => {
        expect(buildUnsubscribeUrl("https://app.exemplo.com", "send-1", "abc123")).toBe(
            "https://app.exemplo.com/unsubscribe?sid=send-1&sig=abc123"
        )
    })

    it("remove a barra final do baseUrl", () => {
        expect(buildUnsubscribeUrl("https://app.exemplo.com/", "s", "g")).toBe(
            "https://app.exemplo.com/unsubscribe?sid=s&sig=g"
        )
    })

    it("escapa valores com caracteres especiais", () => {
        expect(buildUnsubscribeUrl("https://x.com", "a b", "c&d")).toBe(
            "https://x.com/unsubscribe?sid=a%20b&sig=c%26d"
        )
    })
})

describe("buildListUnsubscribeHeaders", () => {
    it("inclui a URL entre colchetes angulares e o header de one-click", () => {
        expect(buildListUnsubscribeHeaders("https://x.com/unsubscribe?sid=1&sig=2")).toEqual(
            {
                "List-Unsubscribe": "<https://x.com/unsubscribe?sid=1&sig=2>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
        )
    })

    it("põe o mailto antes da URL quando informado", () => {
        const headers = buildListUnsubscribeHeaders(
            "https://x.com/u",
            "baixa@exemplo.com"
        )
        expect(headers["List-Unsubscribe"]).toBe(
            "<mailto:baixa@exemplo.com>, <https://x.com/u>"
        )
    })

    it("ignora mailto vazio", () => {
        const headers = buildListUnsubscribeHeaders("https://x.com/u", "  ")
        expect(headers["List-Unsubscribe"]).toBe("<https://x.com/u>")
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/email/list-unsubscribe.test.ts
```

Esperado: FAIL com `Failed to resolve import "./list-unsubscribe"`.

- [ ] **Step 3: Implementar `lib/email/list-unsubscribe.ts`**

```ts
// lib/email/list-unsubscribe.ts

/**
 * Headers de descadastro one-click (RFC 8058). Gmail e Yahoo exigem esses
 * headers de remetentes de volume; o footer HTML continua existindo, mas não
 * substitui o header.
 *
 * `List-Unsubscribe-Post` só pode ser enviado junto de uma URL https — quando
 * o provedor aciona o one-click, ele faz um POST para essa URL.
 */

export function buildUnsubscribeUrl(
    baseUrl: string,
    emailSendId: string,
    signature: string
): string {
    const normalizedBase = baseUrl.replace(/\/+$/, "")
    const params = new URLSearchParams({ sid: emailSendId, sig: signature })
    // URLSearchParams codifica espaço como "+", que é válido em query string mas
    // costuma confundir clientes de e-mail — %20 é mais seguro aqui.
    return `${normalizedBase}/unsubscribe?${params.toString().replace(/\+/g, "%20")}`
}

export function buildListUnsubscribeHeaders(
    unsubscribeUrl: string,
    mailto?: string | null
): Record<string, string> {
    const entries: string[] = []

    if (mailto && mailto.trim()) {
        entries.push(`<mailto:${mailto.trim()}>`)
    }

    entries.push(`<${unsubscribeUrl}>`)

    return {
        "List-Unsubscribe": entries.join(", "),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/email/list-unsubscribe.test.ts
```

Esperado: PASS, 6 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/email/list-unsubscribe.ts lib/email/list-unsubscribe.test.ts
git commit -m "feat(cold-mail): construcao dos headers List-Unsubscribe"
```

---

## Task 12: Enviar os headers e aceitar o POST one-click (CM-4)

**Files:**
- Modify: `lib/email.ts:187-227`
- Modify: `app/api/unsubscribe/route.ts`

**Interfaces:**
- Consumes: `buildUnsubscribeUrl`, `buildListUnsubscribeHeaders` (Task 11); `addSuppression` (Task 8).
- Produces: `SendEmailParams` ganha `headers?: Record<string, string>`.

- [ ] **Step 1: `lib/email.ts` — aceitar headers e usá-los nos dois transportes**

Na interface `SendEmailParams` (linha 28), acrescentar:

```ts
    headers?: Record<string, string>
```

Em `sendEmailSmtp`, no `transporter.sendMail` (linha 122):

```ts
        const info = await transporter.sendMail({
            from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo || fromEmail,
            headers: params.headers,
        })
```

Em `sendEmailResend`, no `resend.emails.send` (linha 159):

```ts
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo,
            tags: params.tags,
            headers: params.headers,
        })
```

- [ ] **Step 2: `lib/email.ts` — calcular URL/headers uma vez em `sendEmail`**

Trocar o corpo de `sendEmail` (linhas 187-210) por:

```ts
export async function sendEmail(
    params: SendEmailParams,
    smtpConfig?: SmtpConfig | null
): Promise<SendEmailResult> {
    // Injetar tracking se emailSendId foi fornecido
    const htmlWithTracking = params.emailSendId
        ? injectTrackingIntoEmail(params.html, params.emailSendId)
        : params.html

    // E-mails de campanha (com emailSendId) levam footer + headers de descadastro.
    // A mesma URL assinada serve aos dois — assinar uma vez evita divergência.
    const unsubscribeUrl = params.emailSendId
        ? buildUnsubscribeUrl(
            process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br",
            params.emailSendId,
            sign(params.emailSendId)
        )
        : null

    const paramsFinal: SendEmailParams = {
        ...params,
        html: unsubscribeUrl
            ? appendUnsubscribeFooter(htmlWithTracking, unsubscribeUrl)
            : htmlWithTracking,
        headers: unsubscribeUrl
            ? {
                ...params.headers,
                ...buildListUnsubscribeHeaders(
                    unsubscribeUrl,
                    smtpConfig?.senderEmail || smtpConfig?.user || null
                ),
            }
            : params.headers,
    }

    // Se tem configuração SMTP válida, usa SMTP
    if (smtpConfig?.user && smtpConfig?.pass) {
        return sendEmailSmtp(smtpConfig, paramsFinal)
    }

    // Senão, usa Resend como fallback
    return sendEmailResend(paramsFinal)
}
```

E trocar a assinatura de `appendUnsubscribeFooter` (linha 212) para receber a URL pronta:

```ts
function appendUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
    const footer = `
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">
            <p>Se não deseja mais receber e-mails, <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">clique aqui para cancelar sua inscrição</a>.</p>
        </div>
    `
    if (html.toLowerCase().includes("</body>")) {
        return html.replace(/<\/body>/i, `${footer}</body>`)
    }
    return html + footer
}
```

Ajustar o import no topo:

```ts
import {
    buildUnsubscribeUrl,
    buildListUnsubscribeHeaders,
} from "@/lib/email/list-unsubscribe"
```

- [ ] **Step 3: `app/api/unsubscribe/route.ts` — ler sid/sig também da query no POST**

Trocar o início do `POST` (linhas 93-107) por:

```ts
export async function POST(request: Request) {
    const url = new URL(request.url)
    const contentType = request.headers.get("content-type") || ""

    // One-click (RFC 8058) faz POST com corpo "List-Unsubscribe=One-Click" e
    // mantém sid/sig na query string — por isso a query é a primeira fonte.
    let sid: string | null = url.searchParams.get("sid")
    let sig: string | null = url.searchParams.get("sig")
    let isOneClick = false

    if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => ({}))
        sid = sid ?? (typeof body.sid === "string" ? body.sid : null)
        sig = sig ?? (typeof body.sig === "string" ? body.sig : null)
    } else if (contentType) {
        const form = await request.formData().catch(() => null)
        if (form) {
            sid = sid ?? (form.get("sid")?.toString() ?? null)
            sig = sig ?? (form.get("sig")?.toString() ?? null)
            isOneClick = form.get("List-Unsubscribe")?.toString() === "One-Click"
        }
    }
```

- [ ] **Step 4: Gravar supressão e responder texto puro no one-click**

Trocar o bloco final do `POST` (linhas 108-124) por:

```ts
    const resolved = await resolveLead(sid, sig)
    if (!resolved) {
        if (isOneClick) {
            return new NextResponse("Invalid link", { status: 400 })
        }
        return confirmationPage("", "", "Link inválido ou expirado.")
    }

    try {
        await prisma.lead.update({
            where: { id: resolved.leadId },
            data: { status: LeadStatus.UNSUBSCRIBED },
        })

        // Descadastro também entra na supressão: o lead pode existir em outra
        // campanha do mesmo workspace, e ali o status do lead não seria checado.
        await addSuppression(prisma, {
            email: resolved.email,
            workspaceId: resolved.workspaceId,
            reason: "unsubscribe",
        })
    } catch (error) {
        console.error("[Unsubscribe] Error:", error)
        if (isOneClick) {
            return new NextResponse("Error", { status: 500 })
        }
        return confirmationPage("", "", "Não foi possível processar o cancelamento. Tente novamente.")
    }

    if (isOneClick) {
        return new NextResponse("Unsubscribed", {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    }

    return confirmationPage("", "", "Inscrição cancelada. Você não receberá mais e-mails.")
}
```

- [ ] **Step 5: Trocar `resolveLeadId` por `resolveLead`**

O novo fluxo precisa do e-mail e do workspace, não só do id. Substituir a função (linhas 20-31) por:

```ts
async function resolveLead(
    sid: string | null,
    sig: string | null
): Promise<{ leadId: string; email: string; workspaceId: string } | null> {
    if (!sid || !verifySignature(sid, sig)) {
        return null
    }

    const emailSend = await prisma.emailSend.findUnique({
        where: { id: sid },
        select: {
            leadId: true,
            lead: { select: { email: true, workspaceId: true } },
        },
    })

    if (!emailSend?.lead) {
        return null
    }

    return {
        leadId: emailSend.leadId,
        email: emailSend.lead.email,
        workspaceId: emailSend.lead.workspaceId,
    }
}
```

Atualizar o `GET` (linha 84) para usar a nova função:

```ts
    const resolved = await resolveLead(sid, sig)
    if (!resolved || !sid || !sig) {
        return confirmationPage("", "", "Link inválido ou expirado.")
    }
```

E acrescentar o import:

```ts
import { addSuppression } from "@/lib/campaigns/suppression"
```

- [ ] **Step 6: Verificar tipos e rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; PASS.

- [ ] **Step 7: Verificar o one-click de ponta a ponta**

Com o dev server no ar, pegar um `sid`/`sig` válidos de um `EmailSend` real (ou gerar com `sign()` num script), e simular o POST do provedor:

```bash
curl -i -X POST "http://localhost:3001/unsubscribe?sid=SID&sig=SIG" -H "Content-Type: application/x-www-form-urlencoded" -d "List-Unsubscribe=One-Click"
```

Esperado: `HTTP/1.1 200`, corpo `Unsubscribed`, lead com status `UNSUBSCRIBED` e uma linha nova em `suppressions` com `reason = 'unsubscribe'`. Repetir o GET no navegador e conferir que a página de confirmação continua funcionando.

- [ ] **Step 8: Commit**

```bash
git add lib/email.ts app/api/unsubscribe/route.ts
git commit -m "feat(cold-mail): headers List-Unsubscribe e descadastro one-click"
```

---

## Task 13: Parsers puros de detecção de resposta (CM-3)

**Files:**
- Create: `lib/campaigns/reply-detection.ts`
- Test: `lib/campaigns/reply-detection.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `normalizeMessageId(raw: string): string`
  - `parseHeaderBlock(raw: string): Record<string, string>`
  - `extractReferencedMessageIds(headers: { inReplyTo?: string | null; references?: string | null }): string[]`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/campaigns/reply-detection.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
    normalizeMessageId,
    parseHeaderBlock,
    extractReferencedMessageIds,
} from "./reply-detection"

describe("normalizeMessageId", () => {
    it("remove colchetes angulares, espaços e baixa a caixa", () => {
        expect(normalizeMessageId("  <ABC123@Mail.Exemplo.COM>  ")).toBe(
            "abc123@mail.exemplo.com"
        )
    })

    it("aceita id já sem colchetes", () => {
        expect(normalizeMessageId("abc@x.com")).toBe("abc@x.com")
    })
})

describe("parseHeaderBlock", () => {
    it("separa nome e valor, em minúsculas na chave", () => {
        const raw = "In-Reply-To: <a@x.com>\r\nSubject: Re: proposta\r\n"
        expect(parseHeaderBlock(raw)).toEqual({
            "in-reply-to": "<a@x.com>",
            subject: "Re: proposta",
        })
    })

    it("junta linhas dobradas (folding) do RFC 5322", () => {
        const raw = "References: <a@x.com>\r\n <b@x.com>\r\n\t<c@x.com>\r\n"
        expect(parseHeaderBlock(raw)).toEqual({
            references: "<a@x.com> <b@x.com> <c@x.com>",
        })
    })

    it("devolve objeto vazio para entrada vazia", () => {
        expect(parseHeaderBlock("")).toEqual({})
    })
})

describe("extractReferencedMessageIds", () => {
    it("junta In-Reply-To e References sem repetir", () => {
        expect(
            extractReferencedMessageIds({
                inReplyTo: "<A@x.com>",
                references: "<a@x.com> <b@x.com>",
            })
        ).toEqual(["a@x.com", "b@x.com"])
    })

    it("lida com campos ausentes", () => {
        expect(extractReferencedMessageIds({})).toEqual([])
        expect(
            extractReferencedMessageIds({ inReplyTo: null, references: null })
        ).toEqual([])
    })

    it("ignora fragmentos sem arroba", () => {
        expect(
            extractReferencedMessageIds({ references: "<lixo> <ok@x.com>" })
        ).toEqual(["ok@x.com"])
    })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/reply-detection.test.ts
```

Esperado: FAIL com `Failed to resolve import "./reply-detection"`.

- [ ] **Step 3: Implementar `lib/campaigns/reply-detection.ts`**

```ts
// lib/campaigns/reply-detection.ts

/**
 * Parsing puro dos cabeçalhos usados para casar uma resposta com o envio que a
 * originou. Uma resposta de verdade referencia o Message-ID original em
 * `In-Reply-To` e/ou `References` (RFC 5322).
 */

export function normalizeMessageId(raw: string): string {
    return raw.trim().replace(/^</, "").replace(/>$/, "").trim().toLowerCase()
}

/**
 * Converte um bloco cru de headers em mapa nome→valor, com as chaves em
 * minúsculas e as linhas dobradas (continuação iniciada por espaço/tab) já
 * concatenadas.
 */
export function parseHeaderBlock(raw: string): Record<string, string> {
    const headers: Record<string, string> = {}

    if (!raw) {
        return headers
    }

    let currentName: string | null = null

    for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) {
            continue
        }

        if (/^[ \t]/.test(line) && currentName) {
            headers[currentName] = `${headers[currentName]} ${line.trim()}`.trim()
            continue
        }

        const separator = line.indexOf(":")
        if (separator === -1) {
            continue
        }

        currentName = line.slice(0, separator).trim().toLowerCase()
        headers[currentName] = line.slice(separator + 1).trim()
    }

    return headers
}

export function extractReferencedMessageIds(headers: {
    inReplyTo?: string | null
    references?: string | null
}): string[] {
    const raw = [headers.inReplyTo, headers.references].filter(Boolean).join(" ")

    if (!raw) {
        return []
    }

    const found = raw.match(/<[^<>]+>|[^\s<>]+@[^\s<>]+/g) || []

    const normalized = found
        .map(normalizeMessageId)
        // Message-ID sempre tem domínio; sem arroba é ruído do parsing.
        .filter((id) => id.includes("@"))

    return Array.from(new Set(normalized))
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm test -- lib/campaigns/reply-detection.test.ts
```

Esperado: PASS, 8 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/campaigns/reply-detection.ts lib/campaigns/reply-detection.test.ts
git commit -m "feat(cold-mail): parsers de cabecalho para deteccao de resposta"
```

---

## Task 14: Cliente IMAP (CM-3)

**Files:**
- Modify: `package.json` (dependência `imapflow`)
- Modify: `lib/constants/smtp.constants.ts`
- Create: `lib/imap.ts`

**Interfaces:**
- Consumes: `parseHeaderBlock`, `extractReferencedMessageIds` (Task 13).
- Produces:
  - `interface ImapConfig { host: string; port: number; user: string; pass: string; secure: boolean }`
  - `resolveImapConfig(workspace: { smtpProvider: string | null; imapHost: string | null; imapPort: number | null; smtpUser: string | null }, pass: string): ImapConfig | null`
  - `interface InboundReply { referencedMessageIds: string[]; from: string | null; date: Date | null }`
  - `fetchInboundReplies(config: ImapConfig, since: Date, limit?: number): Promise<InboundReply[]>`
  - `SMTP_PROVIDERS[provider].imapHost` / `.imapPort`

- [ ] **Step 1: Instalar a dependência**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm install imapflow
```

Esperado: `imapflow` em `dependencies` no `package.json`.

- [ ] **Step 2: Acrescentar hosts IMAP às constantes de provedor**

Em `lib/constants/smtp.constants.ts`, adicionar `imapHost`/`imapPort` a cada provedor:

```ts
    google: {
        label: "Gmail / Google Workspace",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        imapHost: "imap.gmail.com",
        imapPort: 993,
        helpUrl: "https://support.google.com/accounts/answer/185833",
        helpText: "Use uma 'Senha de App', não sua senha normal",
    },
    zoho: {
        label: "Zoho Mail",
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        imapHost: "imap.zoho.com",
        imapPort: 993,
        helpUrl: "https://www.zoho.com/mail/help/zoho-smtp.html",
        helpText: "Use uma 'Senha de App' do Zoho",
    },
    outlook: {
        label: "Outlook / Microsoft 365",
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        imapHost: "outlook.office365.com",
        imapPort: 993,
        helpUrl: "https://support.microsoft.com/en-us/account-billing/using-app-passwords",
        helpText: "Use uma 'Senha de App' da Microsoft",
    },
    custom: {
        label: "Outro (configuração manual)",
        host: "",
        port: 587,
        secure: false,
        imapHost: "",
        imapPort: 993,
        helpText: "Configure manualmente o servidor SMTP",
        helpUrl: "",
    },
```

- [ ] **Step 3: Criar `lib/imap.ts`**

```ts
// lib/imap.ts

import { ImapFlow } from "imapflow"
import { SMTP_PROVIDERS, type SmtpProvider } from "@/lib/constants/smtp.constants"
import {
    parseHeaderBlock,
    extractReferencedMessageIds,
} from "@/lib/campaigns/reply-detection"

export interface ImapConfig {
    host: string
    port: number
    user: string
    pass: string
    secure: boolean
}

export interface InboundReply {
    referencedMessageIds: string[]
    from: string | null
    date: Date | null
}

/**
 * Monta a configuração IMAP a partir do workspace. Host explícito vence; sem
 * ele, cai no host do provedor SMTP escolhido. Devolve null quando não dá para
 * montar uma conexão (sem host ou sem usuário).
 */
export function resolveImapConfig(
    workspace: {
        smtpProvider: string | null
        imapHost: string | null
        imapPort: number | null
        smtpUser: string | null
    },
    pass: string
): ImapConfig | null {
    const providerConfig = SMTP_PROVIDERS[workspace.smtpProvider as SmtpProvider]
    const host = workspace.imapHost || providerConfig?.imapHost || ""
    const port = workspace.imapPort || providerConfig?.imapPort || 993

    if (!host || !workspace.smtpUser || !pass) {
        return null
    }

    return { host, port, user: workspace.smtpUser, pass, secure: true }
}

/**
 * Lê a INBOX e devolve, para cada mensagem recebida desde `since`, os
 * Message-IDs que ela referencia. Não guarda assunto nem corpo — só o
 * necessário para casar a resposta com o envio.
 */
export async function fetchInboundReplies(
    config: ImapConfig,
    since: Date,
    limit = 200
): Promise<InboundReply[]> {
    const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        logger: false,
    })

    const replies: InboundReply[] = []

    await client.connect()

    try {
        const lock = await client.getMailboxLock("INBOX")

        try {
            for await (const message of client.fetch(
                { since },
                { envelope: true, headers: ["in-reply-to", "references"] }
            )) {
                const raw = message.headers?.toString() ?? ""
                const headers = parseHeaderBlock(raw)

                const referencedMessageIds = extractReferencedMessageIds({
                    inReplyTo: headers["in-reply-to"] ?? null,
                    references: headers["references"] ?? null,
                })

                if (referencedMessageIds.length === 0) {
                    continue
                }

                replies.push({
                    referencedMessageIds,
                    from: message.envelope?.from?.[0]?.address ?? null,
                    date: message.envelope?.date ?? null,
                })

                if (replies.length >= limit) {
                    break
                }
            }
        } finally {
            lock.release()
        }
    } finally {
        await client.logout().catch(() => undefined)
    }

    return replies
}
```

- [ ] **Step 4: Verificar tipos e rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; PASS. Se `imapflow` não trouxer tipos próprios, instalar `@types/imapflow` ou declarar o módulo em `types/`; não silenciar com `any`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/imap.ts lib/constants/smtp.constants.ts
git commit -m "feat(cold-mail): cliente IMAP para leitura de respostas"
```

---

## Task 15: Cron de detecção de resposta + configuração na UI (CM-3)

**Files:**
- Create: `app/api/cron/detect-replies/route.ts`
- Modify: `app/api/cron/process-sequences/route.ts`
- Modify: `vercel.json`
- Modify: `actions/workspace-settings.ts`
- Modify: `app/(crm)/settings/components/send-window-settings.tsx`

**Interfaces:**
- Consumes: `resolveImapConfig`, `fetchInboundReplies` (Task 14); `decryptSecret` de `@/lib/secrets`; `EmailSend.messageId` (Tasks 7 e 9).
- Produces: nada consumido adiante (última tarefa).

- [ ] **Step 1: Criar `app/api/cron/detect-replies/route.ts`**

```ts
// app/api/cron/detect-replies/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decryptSecret } from "@/lib/secrets"
import { resolveImapConfig, fetchInboundReplies } from "@/lib/imap"

// Vercel Cron — roda antes do process-sequences para que uma resposta recebida
// interrompa a sequência antes do follow-up do mesmo dia sair.

export const dynamic = "force-dynamic"
export const maxDuration = 300

// Sem marca de última checagem, olha os últimos 3 dias.
const DEFAULT_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error("[Replies] CRON_SECRET nao configurado")
            return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 })
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()

        const workspaces = await prisma.workspace.findMany({
            where: {
                replyDetectionEnabled: true,
                smtpUser: { not: null },
                smtpPass: { not: null },
            },
            select: {
                id: true,
                smtpProvider: true,
                smtpUser: true,
                smtpPass: true,
                imapHost: true,
                imapPort: true,
                replyCheckedAt: true,
            },
        })

        let workspacesChecked = 0
        let repliesMatched = 0
        let errors = 0

        for (const workspace of workspaces) {
            try {
                const pass = decryptSecret(workspace.smtpPass)
                if (!pass) {
                    continue
                }

                const config = resolveImapConfig(workspace, pass)
                if (!config) {
                    console.warn(
                        `[Replies] Workspace ${workspace.id} sem host IMAP resolvível`
                    )
                    continue
                }

                const since =
                    workspace.replyCheckedAt ??
                    new Date(now.getTime() - DEFAULT_LOOKBACK_MS)

                const inbound = await fetchInboundReplies(config, since)
                workspacesChecked++

                const referencedIds = Array.from(
                    new Set(inbound.flatMap((reply) => reply.referencedMessageIds))
                )

                if (referencedIds.length > 0) {
                    repliesMatched += await markReplies(workspace.id, referencedIds, now)
                }

                await prisma.workspace.update({
                    where: { id: workspace.id },
                    data: { replyCheckedAt: now },
                })
            } catch (error) {
                errors++
                console.error(
                    `[Replies] Falha ao checar workspace ${workspace.id}:`,
                    error
                )
            }
        }

        const summary = {
            timestamp: now.toISOString(),
            workspacesChecked,
            repliesMatched,
            errors,
        }

        console.log("[Replies] Finalizado:", summary)

        return NextResponse.json({ success: true, ...summary })
    } catch (error) {
        console.error("[Replies] Erro geral:", error)
        return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 })
    }
}

/**
 * Casa os Message-IDs referenciados com envios do workspace e para as
 * sequências correspondentes. Devolve quantos envios foram marcados.
 */
async function markReplies(
    workspaceId: string,
    referencedMessageIds: string[],
    now: Date
): Promise<number> {
    const sends = await prisma.emailSend.findMany({
        where: {
            messageId: { in: referencedMessageIds },
            repliedAt: null,
            campaign: { workspaceId },
        },
        select: { id: true, leadId: true, campaignId: true },
    })

    if (sends.length === 0) {
        return 0
    }

    for (const send of sends) {
        await prisma.emailSend.update({
            where: { id: send.id },
            data: { status: "REPLIED", repliedAt: now },
        })

        await prisma.lead.update({
            where: { id: send.leadId },
            data: { status: "REPLIED" },
        })

        await prisma.campaignEnrollment.updateMany({
            where: {
                campaignId: send.campaignId,
                leadId: send.leadId,
                status: "active",
            },
            data: {
                status: "stopped",
                stoppedAt: now,
                stopReason: "replied",
                nextSendAt: null,
            },
        })

        await prisma.campaign.update({
            where: { id: send.campaignId },
            data: { totalReplied: { increment: 1 } },
        })
    }

    return sends.length
}
```

- [ ] **Step 2: `process-sequences` — parar sequência de lead que já respondeu**

Logo abaixo do bloco que trata `lead.status === "UNSUBSCRIBED"` (linha ~117), inserir:

```ts
                if (lead.status === "REPLIED") {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "replied",
                        },
                    })
                    skipped++
                    console.log(`[Cron] Lead ${lead.id} respondeu - parando sequência`)
                    continue
                }
```

- [ ] **Step 3: Registrar o cron no `vercel.json`**

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/detect-replies",
      "schedule": "30 8 * * *"
    },
    {
      "path": "/api/cron/process-sequences",
      "schedule": "0 9 * * *"
    }
  ]
}
```

A detecção roda **antes** do envio (08:30 vs 09:00) de propósito: uma resposta recebida durante a noite precisa parar a sequência antes do follow-up do dia sair.

- [ ] **Step 4: Action de configuração IMAP**

Em `actions/workspace-settings.ts`, acrescentar:

```ts
const replyDetectionSchema = z.object({
    replyDetectionEnabled: z.boolean(),
    imapHost: z.string().optional().nullable(),
    imapPort: z.number().int().min(1).max(65535).optional().nullable(),
})

export type ReplyDetectionSettingsData = z.infer<typeof replyDetectionSchema>

/**
 * Atualiza a configuração de detecção de resposta (IMAP) do workspace.
 * A senha usada é a mesma do SMTP — não há credencial separada.
 */
export async function updateReplyDetectionSettings(
    workspaceId: string,
    data: ReplyDetectionSettingsData
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = replyDetectionSchema.safeParse(data)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || "Dados inválidos",
            }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                replyDetectionEnabled: parsed.data.replyDetectionEnabled,
                imapHost: parsed.data.imapHost || null,
                imapPort: parsed.data.imapPort || null,
            },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar detecção de resposta:", error)
        return { success: false, error: "Erro ao atualizar detecção de resposta." }
    }
}
```

Os campos de IMAP **não** entram em `SendWindowSettingsData` — esse tipo é o payload de escrita da janela, validado por `sendWindowSchema`. Em vez disso, `getSendWindowSettings` (Task 4) passa a devolver os dois grupos agregados. Substituir a action inteira por:

```ts
export interface SendSettingsData {
    window: SendWindowSettingsData
    replyDetection: ReplyDetectionSettingsData
}

/**
 * Busca a janela de envio e a configuração de detecção de resposta do workspace.
 */
export async function getSendWindowSettings(
    workspaceId: string
): Promise<ActionResult<SendSettingsData>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                sendWindowEnabled: true,
                sendTimezone: true,
                sendDays: true,
                sendStartHour: true,
                sendEndHour: true,
                sendJitterMinutes: true,
                replyDetectionEnabled: true,
                imapHost: true,
                imapPort: true,
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const { replyDetectionEnabled, imapHost, imapPort, ...window } = workspace

        return {
            success: true,
            data: {
                window,
                replyDetection: { replyDetectionEnabled, imapHost, imapPort },
            },
        }
    } catch (error) {
        console.error("Erro ao buscar configurações de envio:", error)
        return { success: false, error: "Erro ao buscar configurações de envio" }
    }
}
```

Ajustar `app/(crm)/settings/page.tsx` e `settings-client.tsx` para repassar `sendSettings.window` e `sendSettings.replyDetection` como as props `initial` e `replyDetection` de `<SendWindowSettings />`.

- [ ] **Step 5: Bloco de detecção de resposta no componente de envio**

Em `app/(crm)/settings/components/send-window-settings.tsx`, acrescentar a prop `replyDetection` e, no fim do `CardContent`, um bloco próprio:

```tsx
                <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="replyDetectionEnabled">
                                Detectar respostas
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Lê a caixa de entrada por IMAP (mesma senha do SMTP) e
                                para a sequência de quem respondeu.
                            </p>
                        </div>
                        <Switch
                            id="replyDetectionEnabled"
                            checked={reply.replyDetectionEnabled}
                            onCheckedChange={(checked) =>
                                setReply((current) => ({
                                    ...current,
                                    replyDetectionEnabled: checked,
                                }))
                            }
                        />
                    </div>

                    {reply.replyDetectionEnabled && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="imapHost">
                                    Servidor IMAP (opcional)
                                </Label>
                                <Input
                                    id="imapHost"
                                    placeholder="imap.gmail.com"
                                    value={reply.imapHost ?? ""}
                                    onChange={(event) =>
                                        setReply((current) => ({
                                            ...current,
                                            imapHost: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imapPort">Porta (opcional)</Label>
                                <Input
                                    id="imapPort"
                                    type="number"
                                    placeholder="993"
                                    value={reply.imapPort ?? ""}
                                    onChange={(event) =>
                                        setReply((current) => ({
                                            ...current,
                                            imapPort: event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
```

Declarar o estado e salvar junto do restante:

```tsx
    const [reply, setReply] = useState(replyDetection)
```

e, dentro de `handleSave`, depois de `updateSendWindowSettings`, chamar `updateReplyDetectionSettings(workspaceId, reply)` e só reportar sucesso se as duas retornarem `success`.

- [ ] **Step 6: Verificar tipos e rodar a suíte**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test
```

Esperado: sem erros; PASS.

- [ ] **Step 7: Testar o cron manualmente**

Com o dev server no ar e `CRON_SECRET` definido no `.env`:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3001/api/cron/detect-replies
```

Esperado sem nenhum workspace com detecção ligada: `200` e `{"success":true,"workspacesChecked":0,"repliesMatched":0,"errors":0}`.

Teste positivo: ligar a detecção num workspace com SMTP real configurado, enviar um e-mail de campanha para uma caixa própria, responder essa mensagem, rodar o curl de novo e conferir: `repliesMatched: 1`, `email_sends.repliedAt` preenchido, lead com status `REPLIED` e enrollment `stopped` com `stopReason = 'replied'`.

Sem senha de app válida, a conexão IMAP falha e o contador `errors` sobe — comportamento esperado, o cron não derruba os demais workspaces.

- [ ] **Step 8: Commit**

```bash
git add app/api/cron/detect-replies/route.ts app/api/cron/process-sequences/route.ts vercel.json actions/workspace-settings.ts "app/(crm)/settings"
git commit -m "feat(cold-mail): deteccao de resposta via IMAP com cron dedicado"
```

---

## Verificação final

- [ ] **Suíte completa e tipos**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit && npm test && npm run lint
```

- [ ] **Build de produção**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && npm run build
```

- [ ] **Checklist de aceite da spec**
  - CM-1: nenhum envio fora da janela/dias configurados; horários com variação; testes das funções de cálculo passando (Tasks 1, 3).
  - CM-2: e-mail suprimido nunca recebe; hard bounce suprime automaticamente; UI lista supressões (Tasks 6, 8, 9, 10).
  - CM-3: resposta detectada para a sequência daquele lead e fica registrada (Tasks 13, 14, 15).
  - CM-4: headers presentes, one-click funciona, footer mantido (Tasks 11, 12).

## Fora do escopo deste plano

Ficam para planos próprios da Fase 1: SA-S3/SA-S4/CRM-S2 (rate limiting e revisão de settings), SA-U1/CRM-U3 (i18n de super-admin e CRM), SA-U2 (design tokens) e PAY-2 (facetas dinâmicas do catálogo). CM-5 (audiência de compradores) e CM-6 (A/B + warmup) são Fase 2 e 3 na spec.

## Riscos conhecidos

- **Frequência do cron — decidido: fica diário.** O dono do produto optou por manter `process-sequences` em `"0 9 * * *"` e não assinar o Vercel Pro. Consequências aceitas conscientemente: a janela de envio continua correta (ela **adia** o que cai fora para o próximo horário válido, e é o que impede envio de madrugada/fim de semana quando o cron for movido de horário), mas **o jitter fica praticamente inerte** — ele desloca o `nextSendAt` do próximo step em até N minutos, e com uma execução por dia esse deslocamento não muda o dia em que o envio acontece. Não remover o jitter do código: ele é gratuito e passa a valer sozinho se a frequência do cron subir. Na UI, deixar o campo "Variação (min)" como está; não prometer distribuição de horário ao usuário.
- **IMAP com senha de app.** Google e Microsoft vêm restringindo autenticação básica em IMAP para contas gerenciadas. Se a conexão falhar com erro de autenticação mesmo com senha de app válida, o caminho é OAuth (XOAUTH2) — não previsto aqui.
- **Fail-closed nos dois caminhos, com formas diferentes.** `isSuppressed` (envio unitário, dentro do cron) devolve `true` quando o banco falha: pula aquele lead e o cron segue com os demais. `filterSuppressed` (disparo em massa) **propaga** o erro: como roda antes do primeiro envio, a exceção aborta o lote inteiro sem mandar nada e sem gravar bounce falso. Em ambos, a troca é deliberada — reputação de domínio acima de volume.
- **Supressão global.** O model aceita `workspaceId = null`, mas este plano não cria UI para gravar supressão global — só o caminho de dados. Adicionar isso quando houver área de super-admin para cold mail.
