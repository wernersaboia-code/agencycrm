// lib/analytics/trafego-interno.test.ts
import { describe, it, expect } from "vitest"

import { contaComoAudiencia } from "./trafego-interno"

const SITE = "https://www.easyprospect.com.br"

describe("contaComoAudiencia", () => {
    it("conta qualquer página pública de quem não é da equipe", () => {
        const opcoes = { daEquipe: false, somenteEntrada: false }
        expect(contaComoAudiencia(`${SITE}/de/catalog`, opcoes)).toBe(true)
        expect(contaComoAudiencia(`${SITE}/list/toy-market-spain`, opcoes)).toBe(true)
    })

    it("não conta nada do navegador marcado como da equipe", () => {
        expect(contaComoAudiencia(`${SITE}/de`, { daEquipe: true, somenteEntrada: false })).toBe(false)
        expect(contaComoAudiencia(`${SITE}/sign-in`, { daEquipe: true, somenteEntrada: true })).toBe(false)
    })

    it("na área logada conta só as páginas de entrada", () => {
        const opcoes = { daEquipe: false, somenteEntrada: true }
        expect(contaComoAudiencia(`${SITE}/sign-in`, opcoes)).toBe(true)
        expect(contaComoAudiencia(`${SITE}/sign-up/verify`, opcoes)).toBe(true)
        expect(contaComoAudiencia(`${SITE}/super-admin/web-analytics`, opcoes)).toBe(false)
        expect(contaComoAudiencia(`${SITE}/dashboard`, opcoes)).toBe(false)
        expect(contaComoAudiencia(`${SITE}/leads`, opcoes)).toBe(false)
    })

    it("não confunde prefixo parecido com página de entrada", () => {
        expect(contaComoAudiencia(`${SITE}/sign-inside`, { daEquipe: false, somenteEntrada: true })).toBe(false)
    })
})
