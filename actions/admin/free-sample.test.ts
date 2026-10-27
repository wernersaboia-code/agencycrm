import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    freeSample: {
        updateMany: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
    },
    freeSampleDownload: { delete: vi.fn() },
    $transaction: vi.fn(),
}))
const updateTagMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
// `unstable_cache` também precisa de mock: importar TAG_AMOSTRA carrega
// lib/free-sample/amostra-ativa.ts, que chama unstable_cache no topo do
// módulo. Sem isto o require falha antes mesmo do teste rodar — o mock do
// brief cobria só revalidateTag, que não bastava.
vi.mock("next/cache", () => ({
    updateTag: updateTagMock,
    unstable_cache: (fn: unknown) => fn,
}))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }))
vi.mock("@/lib/supabase/free-sample", () => ({ removeFreeSample: vi.fn() }))
const paginasMock = vi.hoisted(() => ({ garantirPaginas: vi.fn(), removerPaginas: vi.fn() }))
vi.mock("@/lib/free-sample/paginas", () => paginasMock)

import { deleteFreeSample, toggleFreeSample } from "./free-sample"

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.freeSample.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.freeSample.update.mockResolvedValue({ id: "s2", filePath: "sample-2.pdf" })
    // $transaction real roda as promises passadas; aqui só precisamos que ele
    // "execute" o array de operações mockadas, como o Prisma faria.
    prismaMock.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops))
})

describe("toggleFreeSample", () => {
    // O bug que este teste evita: ativar a segunda amostra sem desativar a
    // primeira. A home usa findFirst({ where: { isActive: true } }), que não
    // garante ordem — o visitante baixaria ora um arquivo, ora outro.
    it("desativa as outras ao ativar uma, numa transação", async () => {
        await toggleFreeSample("s2", true)

        // As duas operações precisam ir juntas para $transaction: chamadas
        // separadas reabririam a corrida entre updateMany e update.
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
        expect(prismaMock.freeSample.updateMany).toHaveBeenCalledWith({
            where: { isActive: true },
            data: { isActive: false },
        })
        expect(prismaMock.freeSample.update).toHaveBeenCalledWith({
            where: { id: "s2" },
            data: { isActive: true },
        })
    })

    it("não mexe nas outras ao apenas desativar, e não usa transação", async () => {
        await toggleFreeSample("s2", false)

        expect(prismaMock.$transaction).not.toHaveBeenCalled()
        expect(prismaMock.freeSample.updateMany).not.toHaveBeenCalled()
        expect(prismaMock.freeSample.update).toHaveBeenCalledWith({
            where: { id: "s2" },
            data: { isActive: false },
        })
    })

    // Sem invalidar a tag na hora, a home continua servindo o estado antigo do
    // cache e o interruptor parece não funcionar. `updateTag` (e não
    // `revalidateTag`) porque isto roda numa Server Action e precisa de
    // expiração IMEDIATA, não stale-while-revalidate.
    // A amostra que já estava no ar subiu antes do folhear existir: sem gerar
    // ao ligar, a home ficaria sem páginas até alguém subir o PDF de novo.
    it("garante as páginas do folhear ao ligar, e só ao ligar", async () => {
        await toggleFreeSample("s2", true)
        expect(paginasMock.garantirPaginas).toHaveBeenCalledWith("s2", "sample-2.pdf")

        paginasMock.garantirPaginas.mockClear()
        await toggleFreeSample("s2", false)
        expect(paginasMock.garantirPaginas).not.toHaveBeenCalled()
    })

    it("invalida o cache da home na hora, nos dois sentidos", async () => {
        await toggleFreeSample("s2", true)
        expect(updateTagMock).toHaveBeenCalledWith("free-sample")

        updateTagMock.mockClear()
        await toggleFreeSample("s2", false)
        expect(updateTagMock).toHaveBeenCalledWith("free-sample")
    })
})

describe("deleteFreeSample", () => {
    // As páginas moram num bucket público: apagar só o PDF deixaria o estudo
    // inteiro legível por quem tivesse a URL das imagens.
    it("apaga as páginas junto com o PDF", async () => {
        prismaMock.freeSample.findUnique.mockResolvedValue({ id: "s2", filePath: "sample-2.pdf", fileName: "x.pdf" })

        await deleteFreeSample("s2")

        expect(paginasMock.removerPaginas).toHaveBeenCalledWith("s2")
    })
})
