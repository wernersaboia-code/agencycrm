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
        expect(fetchMock).toHaveBeenCalledTimes(7)
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            headers: { Authorization: "Bearer token-teste" },
        })
    })
})
