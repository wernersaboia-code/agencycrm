import { describe, expect, it } from "vitest"
import { DEFAULT_POST_CONFIRM_REDIRECT, safeInternalPath } from "./safe-redirect"

describe("safeInternalPath", () => {
    it("aceita caminhos internos", () => {
        expect(safeInternalPath("/my-purchases")).toBe("/my-purchases")
        expect(safeInternalPath("/dashboard")).toBe("/dashboard")
        expect(safeInternalPath("/de/catalog")).toBe("/de/catalog")
        expect(safeInternalPath("/checkout?purchaseId=abc")).toBe("/checkout?purchaseId=abc")
    })

    it("cai no padrão quando não há destino", () => {
        expect(safeInternalPath(null)).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        expect(safeInternalPath("")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
    })

    // O link de confirmação sai do NOSSO domínio e carrega a nossa
    // credibilidade. Sem filtrar o `next`, ele vira isca de phishing assinada
    // por nós.
    it("recusa destinos que saem do domínio", () => {
        expect(safeInternalPath("//evil.com")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        expect(safeInternalPath("//evil.com/login")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        expect(safeInternalPath("https://evil.com")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        expect(safeInternalPath("http://evil.com")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        // alguns navegadores normalizam a barra invertida para barra
        expect(safeInternalPath("/\\evil.com")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
    })

    it("recusa esquemas perigosos", () => {
        expect(safeInternalPath("javascript:alert(1)")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
        expect(safeInternalPath("data:text/html,<script>")).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
    })

    it("recusa caracteres de controle", () => {
        // Quebra de linha permitiria injetar cabeçalho HTTP no Location.
        expect(safeInternalPath("/ok\nLocation: https://evil.com")).toBe(
            DEFAULT_POST_CONFIRM_REDIRECT
        )
        expect(safeInternalPath("/ok\r\nSet-Cookie: sessao=1")).toBe(
            DEFAULT_POST_CONFIRM_REDIRECT
        )
        // Byte NUL é clássico para truncar validação em camadas escritas em C.
        expect(safeInternalPath(`/${String.fromCharCode(0)}/evil`)).toBe(DEFAULT_POST_CONFIRM_REDIRECT)
    })

    // Documenta uma escolha deliberada: espaço não tira ninguém do domínio,
    // então não é filtrado. Sem este teste, alguém "endureceria" a regex por
    // engano achando que espaço era uma brecha.
    it("deixa passar espaço, que é caminho interno inofensivo", () => {
        expect(safeInternalPath("/minha lista")).toBe("/minha lista")
    })

    it("respeita um padrão customizado", () => {
        expect(safeInternalPath(null, "/dashboard")).toBe("/dashboard")
        expect(safeInternalPath("//evil.com", "/dashboard")).toBe("/dashboard")
    })
})
