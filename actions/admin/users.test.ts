import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}))
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ checkAdminRateLimit: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { updateUserRole, updateUserStatus } from "./users"

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" })
    prismaMock.user.count.mockResolvedValue(1)
    prismaMock.user.update.mockResolvedValue({})
})

// As recusas voltam como código, não exceção: em produção o Next apaga a
// mensagem da exceção e o admin via só "erro ao alterar".
describe("mudança de acesso recusada", () => {
    it("não deixa o admin tirar o próprio acesso", async () => {
        expect(await updateUserRole("admin-1", "USER")).toEqual({ success: false, error: "self_demote" })
        expect(await updateUserStatus("admin-1", "INACTIVE")).toEqual({ success: false, error: "self_deactivate" })
        expect(prismaMock.user.update).not.toHaveBeenCalled()
    })

    it("não deixa remover o último admin ativo", async () => {
        prismaMock.user.count.mockResolvedValue(0)
        expect(await updateUserRole("outro-admin", "USER")).toEqual({ success: false, error: "last_admin" })
        expect(prismaMock.user.update).not.toHaveBeenCalled()
    })

    it("avisa quando o usuário não existe", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null)
        expect(await updateUserStatus("sumiu", "INACTIVE")).toEqual({ success: false, error: "not_found" })
    })

    it("aceita a mudança quando sobra outro admin ativo", async () => {
        expect(await updateUserRole("outro-admin", "USER")).toEqual({ success: true })
        expect(prismaMock.user.update).toHaveBeenCalledOnce()
    })
})
