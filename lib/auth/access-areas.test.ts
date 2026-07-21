import { describe, expect, it } from "vitest"
import {
    DEFAULT_ACCESS_AREA,
    getAreaFromRedirect,
    isAdminDestination,
    normalizeRedirect,
    resolvePostLoginRedirect,
} from "./access-areas"

describe("getAreaFromRedirect", () => {
    // O bug: quem abre /sign-in direto (sem ?redirect) recebia a Área
    // Administrativa selecionada. 3 dos 5 usuários do banco têm papel USER,
    // então a maioria era mandada para um destino que a rejeita.
    it("não escolhe a área administrativa quando não há destino na URL", () => {
        expect(getAreaFromRedirect(null, null)).not.toBe("admin")
    })

    it("assume a área de compras como padrão", () => {
        expect(getAreaFromRedirect(null, null)).toBe(DEFAULT_ACCESS_AREA)
        expect(DEFAULT_ACCESS_AREA).toBe("purchases")
    })

    it("respeita o contexto de marketplace", () => {
        expect(getAreaFromRedirect(null, "marketplace")).toBe("purchases")
        expect(getAreaFromRedirect("/super-admin", "marketplace")).toBe("purchases")
    })

    it("deriva a área do destino pedido", () => {
        expect(getAreaFromRedirect("/super-admin", null)).toBe("admin")
        expect(getAreaFromRedirect("/super-admin/users", null)).toBe("admin")
        expect(getAreaFromRedirect("/my-purchases", null)).toBe("purchases")
        expect(getAreaFromRedirect("/checkout", null)).toBe("purchases")
        expect(getAreaFromRedirect("/cart", null)).toBe("purchases")
        expect(getAreaFromRedirect("/dashboard", null)).toBe("crm")
        expect(getAreaFromRedirect("/leads", null)).toBe("crm")
    })
})

describe("normalizeRedirect", () => {
    it("converte as rotas legadas de /crm", () => {
        expect(normalizeRedirect("/crm")).toBe("/dashboard")
        expect(normalizeRedirect("/crm/dashboard")).toBe("/dashboard")
        expect(normalizeRedirect("/crm/leads")).toBe("/leads")
    })

    it("deixa as demais rotas intactas", () => {
        expect(normalizeRedirect("/my-purchases")).toBe("/my-purchases")
        expect(normalizeRedirect("/super-admin")).toBe("/super-admin")
    })
})

describe("isAdminDestination", () => {
    it("reconhece as rotas administrativas", () => {
        expect(isAdminDestination("/super-admin")).toBe(true)
        expect(isAdminDestination("/super-admin/users")).toBe(true)
        expect(isAdminDestination("/dashboard")).toBe(false)
        // não confunde um prefixo parecido com a área administrativa
        expect(isAdminDestination("/super-admin-outra-coisa")).toBe(false)
    })
})

describe("resolvePostLoginRedirect", () => {
    // Sem esta barreira o USER chega em /super-admin, o layout de lá o
    // devolve, e ele volta ao início sem nenhuma explicação.
    it("desvia quem não é ADMIN de destinos administrativos", () => {
        expect(resolvePostLoginRedirect("/super-admin", "USER")).toBe("/my-purchases")
        expect(resolvePostLoginRedirect("/super-admin/users", null)).toBe("/my-purchases")
    })

    it("deixa o ADMIN entrar na área administrativa", () => {
        expect(resolvePostLoginRedirect("/super-admin", "ADMIN")).toBe("/super-admin")
        expect(resolvePostLoginRedirect("/super-admin/users", "ADMIN")).toBe("/super-admin/users")
    })

    it("não interfere em destinos não administrativos", () => {
        expect(resolvePostLoginRedirect("/dashboard", "USER")).toBe("/dashboard")
        expect(resolvePostLoginRedirect("/my-purchases", null)).toBe("/my-purchases")
        expect(resolvePostLoginRedirect("/dashboard", "ADMIN")).toBe("/dashboard")
    })
})
