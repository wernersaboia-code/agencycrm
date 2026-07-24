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

    it("recalcula o offset por dia de calendário na virada do horário de verão", () => {
        // sexta 2026-10-23 20:00 em Berlim (CEST, UTC+2) -> segunda 2026-10-26 09:00 em Berlim
        // Berlim já está em CET (UTC+1) nessa data, então o resultado é 08:00Z, não 07:00Z.
        expect(
            nextWindowStart(new Date("2026-10-23T18:00:00Z"), berlinWindow).toISOString()
        ).toBe("2026-10-26T08:00:00.000Z")
    })

    it("não pula nenhum dia válido ao atravessar a virada de horário de verão", () => {
        // Este caso distingue iteração por dia de calendário de avanço fixo de 24h em
        // milissegundos: as transições de DST na UE sempre caem num domingo, então uma
        // janela sem fins de semana nunca observa o artefato de dia pulado. Com todos os
        // dias liberados, o anchor é sábado 2026-03-28 23:00 em Berlim (ainda CET, UTC+1),
        // pouco antes da virada de 2026-03-29T01:00:00Z. A implementação antiga (passos
        // fixos de 24h) somava 24h em milissegundos ao anchor, cruzava a virada e o relógio
        // local pulava de sábado 23:00 direto para segunda 00:00, sem nunca passar por
        // domingo. Não "simplifique" este teste para um caso de dia útil — ele deixaria de
        // provar o comportamento que importa.
        expect(
            nextWindowStart(
                new Date("2026-03-28T22:00:00Z"),
                { ...berlinWindow, days: [1, 2, 3, 4, 5, 6, 7] }
            ).toISOString()
        ).toBe("2026-03-29T07:00:00.000Z")
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
