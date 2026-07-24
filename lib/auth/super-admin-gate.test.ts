import { describe, it, expect } from "vitest"
import { isSuperAdminPath, canAccessSuperAdmin } from "./super-admin-gate"

describe("isSuperAdminPath", () => {
    it("casa a raiz e as subrotas do super-admin", () => {
        expect(isSuperAdminPath("/super-admin")).toBe(true)
        expect(isSuperAdminPath("/super-admin/users")).toBe(true)
        expect(isSuperAdminPath("/super-admin/marketplace/lists")).toBe(true)
    })

    it("não casa rotas fora do super-admin", () => {
        expect(isSuperAdminPath("/dashboard")).toBe(false)
        expect(isSuperAdminPath("/super-admin-x")).toBe(false)
        expect(isSuperAdminPath("/")).toBe(false)
    })
})

describe("canAccessSuperAdmin", () => {
    it("libera apenas ADMIN", () => {
        expect(canAccessSuperAdmin("ADMIN")).toBe(true)
        expect(canAccessSuperAdmin("MANAGER")).toBe(false)
        expect(canAccessSuperAdmin("USER")).toBe(false)
        expect(canAccessSuperAdmin(null)).toBe(false)
        expect(canAccessSuperAdmin(undefined)).toBe(false)
    })
})
