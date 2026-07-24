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
