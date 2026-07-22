import { describe, expect, it } from "vitest"
import { isRotaDeEscapeDoWorkspace } from "./workspace-guard"

describe("isRotaDeEscapeDoWorkspace", () => {
    // O laço real: o layout mandava para /workspaces?message=create-first, e
    // essa página herdava o mesmo layout, que redirecionava de novo.
    it("libera a página que existe para criar o primeiro workspace", () => {
        expect(isRotaDeEscapeDoWorkspace("/workspaces")).toBe(true)
        expect(isRotaDeEscapeDoWorkspace("/workspaces?message=create-first")).toBe(true)
        expect(isRotaDeEscapeDoWorkspace("/workspaces/")).toBe(true)
        expect(isRotaDeEscapeDoWorkspace("/workspaces/novo")).toBe(true)
    })

    it("libera a tela de trial expirado, que tem o mesmo laço", () => {
        expect(isRotaDeEscapeDoWorkspace("/trial-expired")).toBe(true)
        expect(isRotaDeEscapeDoWorkspace("/trial-expired?motivo=x")).toBe(true)
    })

    it("mantém a guarda no restante do CRM", () => {
        expect(isRotaDeEscapeDoWorkspace("/dashboard")).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("/leads")).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("/campaigns")).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("/settings")).toBe(false)
    })

    // Um prefixo parecido não pode furar a guarda por acidente.
    it("não confunde rotas de nome parecido", () => {
        expect(isRotaDeEscapeDoWorkspace("/workspaces-antigo")).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("/trial-expired-teste")).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("/super-admin/workspaces")).toBe(false)
    })

    it("trata ausência de caminho", () => {
        expect(isRotaDeEscapeDoWorkspace(null)).toBe(false)
        expect(isRotaDeEscapeDoWorkspace("")).toBe(false)
    })
})
