import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    googleSearchConsoleConnection: { findFirst: vi.fn(), findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/secrets", () => ({ decryptSecret: () => "refresh-token" }))

import { getGoogleSearchConsoleAnalytics } from "./google-search-console"

beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_ID", "id")
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET", "secret")
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
})

// A conexão é do site: um admin que nunca fez o OAuth precisa ver os mesmos
// dados que quem conectou. Antes a busca era pelo usuário logado.
describe("getGoogleSearchConsoleAnalytics", () => {
    it("usa a conexão mais recente do site, sem filtrar por usuário", async () => {
        prismaMock.googleSearchConsoleConnection.findFirst.mockResolvedValue(null)

        const dados = await getGoogleSearchConsoleAnalytics(28)

        expect(dados.status).toBe("not_connected")
        const [argumentos] = prismaMock.googleSearchConsoleConnection.findFirst.mock.calls[0]
        expect(argumentos).toEqual({ orderBy: { updatedAt: "desc" } })
        expect(prismaMock.googleSearchConsoleConnection.findUnique).not.toHaveBeenCalled()
    })

    it("informa quem conectou a conta", async () => {
        prismaMock.googleSearchConsoleConnection.findFirst.mockResolvedValue({
            userId: "werner",
            siteUrl: "sc-domain:easyprospect.com.br",
            refreshTokenEncrypted: "x",
        })
        prismaMock.user.findUnique.mockResolvedValue({ email: "werner@example.com" })
        vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(
            JSON.stringify(String(url).includes("oauth2") ? { access_token: "token" } : { rows: [] })
        )))

        const dados = await getGoogleSearchConsoleAnalytics(28)

        expect(dados.status).toBe("ready")
        expect(dados.connectedBy).toBe("werner@example.com")
    })
})
