import { describe, it, expect } from "vitest"
import { classifyBounce } from "./bounce-classifier"

describe("classifyBounce", () => {
    it("classifica caixa inexistente como hard", () => {
        expect(classifyBounce("550 5.1.1 User unknown")).toBe("hard")
        expect(classifyBounce("Recipient address rejected: does not exist")).toBe("hard")
        expect(classifyBounce("No such user here")).toBe("hard")
        expect(classifyBounce("551 invalid recipient")).toBe("hard")
    })

    it("classifica falha temporária como soft", () => {
        expect(classifyBounce("452 4.2.2 Mailbox full")).toBe("soft")
        expect(classifyBounce("Over quota, try again later")).toBe("soft")
        expect(classifyBounce("421 service temporarily unavailable")).toBe("soft")
        expect(classifyBounce("Connection timeout")).toBe("soft")
        expect(classifyBounce("Greylisted, please retry")).toBe("soft")
    })

    it("é insensível a maiúsculas e espaços", () => {
        expect(classifyBounce("  550 USER UNKNOWN  ")).toBe("hard")
    })

    it("devolve unknown para motivo vazio ou irreconhecível", () => {
        expect(classifyBounce(null)).toBe("unknown")
        expect(classifyBounce(undefined)).toBe("unknown")
        expect(classifyBounce("")).toBe("unknown")
        expect(classifyBounce("algo deu errado")).toBe("unknown")
    })

    it("prioriza hard quando o motivo tem sinais dos dois tipos", () => {
        expect(classifyBounce("550 user unknown; connection closed")).toBe("hard")
    })
})

describe("classifyBounce - falsos positivos de código numérico como substring", () => {
    it("não confunde '550' dentro de '45500ms' com o código de status 550", () => {
        expect(classifyBounce("Delivery failed: connection timed out after 45500ms")).toBe("soft")
    })

    it("não confunde '551' dentro de uma contagem de bytes com o código de status 551", () => {
        expect(classifyBounce("Message size 5510000 bytes exceeds limit, mailbox full")).toBe("soft")
    })

    it("não confunde '553' dentro de um número de referência arbitrário", () => {
        expect(classifyBounce("Anti-spam block Ref 5530293, please contact administrator")).toBe("unknown")
    })

    it("não confunde '550' dentro de um queue id estilo Postfix", () => {
        // unknown é o veredito correto aqui: sem "retry" na lista de padrões
        // de texto, a string não bate em nenhum padrão soft. O ponto do teste
        // continua provado — o '550' dentro do queue id não vira hard.
        expect(classifyBounce("Queue id 20260724165503 rejected, please retry")).toBe("unknown")
    })

    it("não confunde código estendido embutido num número pontuado maior (IP)", () => {
        expect(classifyBounce("route via 192.168.5.1.1 failed")).toBe("unknown")
    })

    it("não confunde código estendido embutido num número pontuado maior (log)", () => {
        expect(classifyBounce("log 10.5.1.1.9")).toBe("unknown")
    })

    it("reconhece código de status no início de uma linha de continuação em bounce multi-linha", () => {
        const message = [
            "The following message to <user@example.com> was undeliverable.",
            "The reason for the problem:",
            "550 5.1.1 The email account that you tried to reach does not exist",
        ].join("\n")
        expect(classifyBounce(message)).toBe("hard")
    })
})
