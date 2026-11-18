import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
    leadList: { update: vi.fn() },
}))
const updateTagMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
    updateTag: updateTagMock,
    unstable_cache: (fn: unknown) => fn,
}))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }))

import { markListReviewed } from "./lists"
import { TAG_RESUMO_CATALOGO } from "@/lib/marketplace/resumo-catalogo"
import { LOCALES } from "@/lib/i18n/locales"

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.leadList.update.mockResolvedValue({
        slug: "horeca-alemanha",
        name: "HoReCa & Foodservice Market - Germany",
        dataReviewedAt: new Date("2026-08-26"),
    })
})

describe("revalidacao do resumo do catalogo", () => {
    // O bug que este teste evita: a faixa de numeros da home congelar. Ela le
    // de unstable_cache com tag; sem updateTag o admin publica um estudo novo
    // e a home segue anunciando o total antigo — um numero sem base, que e
    // exatamente o que a faixa existe para nao ser.
    it("expira a tag do resumo ao registrar revisao de um estudo", async () => {
        await markListReviewed("lista-1")

        expect(updateTagMock).toHaveBeenCalledWith(TAG_RESUMO_CATALOGO)
    })

    it("continua revalidando as rotas que ja revalidava", async () => {
        await markListReviewed("lista-1")

        expect(revalidatePathMock).toHaveBeenCalledWith("/catalog")
    })

    // A ficha fica em cache por um dia; e o admin que a renova na hora. O
    // caminho tem que ser o interno, com idioma: `/list/x` (o do navegador)
    // e reescrito pelo proxy para `/pt/list/x` e nao invalidava nada.
    it("revalida a ficha do estudo pelo caminho interno, em todos os idiomas", async () => {
        await markListReviewed("lista-1")

        for (const locale of LOCALES) {
            expect(revalidatePathMock).toHaveBeenCalledWith(`/${locale}/list/horeca-alemanha`)
        }
        expect(revalidatePathMock).not.toHaveBeenCalledWith("/list/horeca-alemanha")
    })
})
