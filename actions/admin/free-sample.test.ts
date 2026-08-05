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
// `unstable_cache` também precisa de mock: importar TAG_AMOSTRA carrega
// lib/free-sample/amostra-ativa.ts, que chama unstable_cache no topo do
// módulo. Sem isto o require falha antes mesmo do teste rodar — o mock do
// brief cobria só revalidateTag, que não bastava.
vi.mock("next/cache", () => ({
    revalidateTag: revalidateTagMock,
    unstable_cache: (fn: unknown) => fn,
}))
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
        // Segundo argumento "max": esta versão do Next exige o perfil de
        // cache em revalidateTag (chamada de um argumento só é depreciada).
        await toggleFreeSample("s2", true)
        expect(revalidateTagMock).toHaveBeenCalledWith("free-sample", "max")

        revalidateTagMock.mockClear()
        await toggleFreeSample("s2", false)
        expect(revalidateTagMock).toHaveBeenCalledWith("free-sample", "max")
    })
})
