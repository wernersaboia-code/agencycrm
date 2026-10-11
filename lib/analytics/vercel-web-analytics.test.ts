import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))

import { getVercelWebAnalytics } from "./vercel-web-analytics"

describe("getVercelWebAnalytics", () => {
    beforeEach(() => {
        process.env.VERCEL_ANALYTICS_TOKEN = "token-teste"
        process.env.VERCEL_ANALYTICS_PROJECT_ID = "prj_teste"
        process.env.VERCEL_ANALYTICS_TEAM_ID = "team_teste"
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        delete process.env.VERCEL_ANALYTICS_TOKEN
        delete process.env.VERCEL_ANALYTICS_PROJECT_ID
        delete process.env.VERCEL_ANALYTICS_TEAM_ID
    })

    it("não chama a API quando faltam credenciais", async () => {
        delete process.env.VERCEL_ANALYTICS_TOKEN
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        const result = await getVercelWebAnalytics()

        expect(result.status).toBe("not_configured")
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("soma a série diária e normaliza os rankings", async () => {
        const fetchMock = vi.fn(async (input: URL | RequestInfo, _init?: RequestInit) => {
            void _init
            const url = new URL(String(input))
            const by = url.searchParams.get("by")
            const rows = by === "day"
                ? [
                    { timestamp: "2026-09-14T00:00:00.000Z", pageviews: 10, visitors: 7 },
                    { timestamp: "2026-09-15T00:00:00.000Z", pageviews: 20, visitors: 12 },
                ]
                : [{ [String(by)]: by === "requestPath" ? "/de" : "DE", pageviews: 9, visitors: 6 }]

            return new Response(JSON.stringify({ data: rows }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        })
        vi.stubGlobal("fetch", fetchMock)

        const result = await getVercelWebAnalytics()

        expect(result.status).toBe("ready")
        expect(result.pageviews).toBe(30)
        expect(result.visitors).toBe(19)
        expect(result.topPages[0]).toEqual({ label: "/de", pageviews: 9, visitors: 6 })
        expect(result.allCountries[0]).toEqual({ label: "DE", pageviews: 9, visitors: 6 })
        expect(result.filterOptions.pages).toContain("/de")
        expect(fetchMock).toHaveBeenCalledTimes(8)
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            headers: { Authorization: "Bearer token-teste" },
        })
    })

    function respostaComEstudos(falharConsultaDeEstudos: boolean) {
        return vi.fn(async (input: URL | RequestInfo) => {
            const url = new URL(String(input))
            const by = url.searchParams.get("by")
            const consultaDeEstudos = url.searchParams.get("filter")?.includes("startswith") ?? false
            if (consultaDeEstudos && falharConsultaDeEstudos) return new Response("{}", { status: 400 })
            const rows = by === "day"
                ? [{ timestamp: "2026-09-14T00:00:00.000Z", pageviews: 10, visitors: 7 }]
                : by === "requestPath"
                    ? [
                        { requestPath: "/de/list/toy-market-germany", pageviews: 6, visitors: 4 },
                        { requestPath: "/en/list/toy-market-germany", pageviews: 1, visitors: 1 },
                        ...(consultaDeEstudos ? [] : [{ requestPath: "/de/catalog", pageviews: 74, visitors: 16 }]),
                    ]
                    : [{ [String(by)]: "DE", pageviews: 9, visitors: 6 }]
            return new Response(JSON.stringify({ data: rows }), { status: 200 })
        })
    }

    it("agrupa as páginas de estudo por estudo, somando os idiomas", async () => {
        vi.stubGlobal("fetch", respostaComEstudos(false))

        const result = await getVercelWebAnalytics()

        expect(result.studies).toEqual([
            { slug: "toy-market-germany", pageviews: 7, visitors: 5, porIdioma: { de: 6, en: 1 } },
        ])
        expect(result.filterOptions.studies).toEqual(["toy-market-germany"])
    })

    it("agrupa a partir da lista geral quando a consulta de estudos falha", async () => {
        vi.stubGlobal("fetch", respostaComEstudos(true))

        const result = await getVercelWebAnalytics()

        expect(result.status).toBe("ready")
        expect(result.studies.map((study) => study.slug)).toEqual(["toy-market-germany"])
    })

    it("filtra um estudo em todos os idiomas", async () => {
        const fetchMock = respostaComEstudos(false)
        vi.stubGlobal("fetch", fetchMock)

        await getVercelWebAnalytics({ days: 30, study: "toy-market-germany" })

        const filtroDiario = new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("filter")
        expect(filtroDiario).toContain("requestPath eq '/list/toy-market-germany'")
        expect(filtroDiario).toContain("requestPath eq '/de/list/toy-market-germany'")
    })
})
