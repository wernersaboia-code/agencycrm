import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    leadList: { findMany: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
// `unstable_cache` envolve a função no topo do módulo; sem mock o import
// falha antes do teste rodar. Mesmo motivo comentado em
// actions/admin/free-sample.test.ts.
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))

import { getResumoCatalogo } from "./resumo-catalogo"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("getResumoCatalogo", () => {
    it("conta paises e setores DISTINTOS, nao ocorrencias", async () => {
        // Tres estudos, mas Alemanha aparece duas vezes e horeca tres.
        // O numero que vai para a home e "quantos paises distintos", nao
        // "quantas linhas de pais" — foi assim que a analise inicial errou.
        prismaMock.leadList.findMany.mockResolvedValue([
            { countries: ["DE"], industries: ["horeca"], dataReviewedAt: new Date("2026-07-01") },
            { countries: ["DE"], industries: ["horeca"], dataReviewedAt: new Date("2026-08-26") },
            { countries: ["FR"], industries: ["horeca", "fmcg"], dataReviewedAt: null },
        ])

        const resumo = await getResumoCatalogo()

        expect(resumo.estudos).toBe(3)
        expect(resumo.paises).toBe(2)
        expect(resumo.setores).toBe(2)
    })

    it("le apenas estudos ativos", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([])

        await getResumoCatalogo()

        expect(prismaMock.leadList.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            select: { countries: true, industries: true, dataReviewedAt: true },
        })
    })

    it("devolve a revisao MAIS RECENTE, ignorando as nulas", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([
            { countries: ["DE"], industries: [], dataReviewedAt: new Date("2026-07-01") },
            { countries: ["FR"], industries: [], dataReviewedAt: null },
            { countries: ["IT"], industries: [], dataReviewedAt: new Date("2026-08-26") },
        ])

        const resumo = await getResumoCatalogo()

        expect(resumo.revisadoEm).toBe(new Date("2026-08-26").toISOString())
    })

    it("converte a revisao para string ISO na fronteira, porque unstable_cache serializa para JSON", async () => {
        // Sem esta conversao, um cache hit devolveria a data ja como string
        // enquanto o tipo ainda prometia `Date` — e o formatador da home
        // estouraria. O teste crava que a saida e string, com `Date` na entrada.
        prismaMock.leadList.findMany.mockResolvedValue([
            { countries: ["DE"], industries: [], dataReviewedAt: new Date("2026-07-01") },
            { countries: ["IT"], industries: [], dataReviewedAt: new Date("2026-08-26") },
        ])

        const resumo = await getResumoCatalogo()

        expect(typeof resumo.revisadoEm).toBe("string")
    })

    it("catalogo vazio devolve zeros e revisao nula, sem estourar", async () => {
        prismaMock.leadList.findMany.mockResolvedValue([])

        const resumo = await getResumoCatalogo()

        expect(resumo).toEqual({ estudos: 0, paises: 0, setores: 0, revisadoEm: null })
    })
})
