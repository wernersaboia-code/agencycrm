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

    const anchor = getZonedParts(date, window.timezone)

    // 14 dias cobrem qualquer configuração de dias da semana com folga.
    for (let offset = 0; offset <= 14; offset++) {
        // Avança dias de calendário no fuso alvo — somar 24h em ms não é um dia
        // em fuso com horário de verão, e pode repetir a mesma data local.
        const wall = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day))
        wall.setUTCDate(wall.getUTCDate() + offset)

        const isoWeekday = ((wall.getUTCDay() + 6) % 7) + 1
        if (!window.days.includes(isoWeekday)) {
            continue
        }

        const candidate = zonedWallTimeToUtc(
            {
                year: wall.getUTCFullYear(),
                month: wall.getUTCMonth() + 1,
                day: wall.getUTCDate(),
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
