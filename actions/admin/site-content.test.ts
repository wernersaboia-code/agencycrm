import { beforeEach, describe, expect, it, vi } from "vitest"
import { Prisma } from "@prisma/client"

const prismaMock = vi.hoisted(() => ({
    siteText: { upsert: vi.fn(), findMany: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({
    updateTag: vi.fn(),
    revalidatePath: vi.fn(),
    unstable_cache: (fn: unknown) => fn,
}))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("server-only", () => ({}))

import { publishSiteText, saveSiteTextDraft } from "./site-content"

/** As colunas que a tabela site_texts tem de verdade, do client gerado. */
const COLUNAS = new Set<string>(Object.values(Prisma.SiteTextScalarFieldEnum))

const ENTRADA = {
    locale: "de",
    key: "landing.einkaufsprofile.intro",
    value: "Unsere Studien unterscheiden zwischen mehreren Profilen von Importeuren:",
}

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.siteText.upsert.mockResolvedValue({})
})

// O mock do Prisma não recusa campo inexistente; o Prisma real recusa. Foi o
// que derrubou o editor: `value` ia no `create` e toda primeira edição falhava.
describe.each([
    ["saveSiteTextDraft", saveSiteTextDraft],
    ["publishSiteText", publishSiteText],
])("%s", (_nome, acao) => {
    it("só manda colunas que existem em site_texts", async () => {
        await acao(ENTRADA)

        const { create, update } = prismaMock.siteText.upsert.mock.calls[0][0]
        for (const campo of [...Object.keys(create), ...Object.keys(update)]) {
            expect(COLUNAS, `campo "${campo}" não existe em site_texts`).toContain(campo)
        }
    })

    it("grava o texto digitado como rascunho", async () => {
        await acao(ENTRADA)
        const { create, update } = prismaMock.siteText.upsert.mock.calls[0][0]
        expect(create.draftValue).toBe(ENTRADA.value)
        expect(update.draftValue).toBe(ENTRADA.value)
    })
})

describe("publishSiteText", () => {
    it("publica o mesmo texto na criação e na atualização", async () => {
        await publishSiteText(ENTRADA)
        const { create, update } = prismaMock.siteText.upsert.mock.calls[0][0]
        expect(create.publishedValue).toBe(ENTRADA.value)
        expect(update.publishedValue).toBe(ENTRADA.value)
    })
})
