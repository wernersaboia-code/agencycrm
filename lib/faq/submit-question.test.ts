import { describe, it, expect, vi, beforeEach } from "vitest"

// A submissão grava no banco e dispara e-mail. Os dois são I/O e ficam fora do
// teste unitário — o que interessa aqui é a decisão tomada antes deles.
//
// vi.hoisted: vi.mock é içado para o topo do arquivo, então a fábrica não
// enxerga const declarada depois. Declarar aqui dentro resolve a ordem.
const prismaMock = vi.hoisted(() => ({
    faqSubmission: {
        count: vi.fn(),
        create: vi.fn(),
    },
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue({ success: true }) }))
vi.mock("@/lib/email/system-smtp", () => ({ getSystemSmtpConfig: vi.fn().mockReturnValue({}) }))
vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.1" })),
}))

import { submitFaqQuestion } from "./submit-question"

const valid = {
    name: "Werner Carvalho",
    email: "werner@example.com",
    subject: "Dúvida sobre cobertura",
    message: "Preciso saber se há estudo para o setor automotivo.",
    consent: true as const,
    locale: "pt" as const,
}

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.faqSubmission.count.mockResolvedValue(0)
    prismaMock.faqSubmission.create.mockResolvedValue({})
})

describe("submitFaqQuestion", () => {
    // O bug que este teste evita: o schema validava o honeypot com `.max(0)`,
    // então um bot que preenchesse o campo era barrado ANTES desta função e
    // recebia `error: "invalid"` — a resposta confirmava para ele que o campo
    // era armadilha, e o ramo abaixo nunca rodava. Um honeypot que se anuncia
    // não serve para nada.
    it("responde sucesso e não grava nada quando o honeypot vem preenchido", async () => {
        const result = await submitFaqQuestion({ ...valid, website: "http://spam.example" })

        expect(result).toEqual({ success: true })
        expect(prismaMock.faqSubmission.create).not.toHaveBeenCalled()
    })

    it("grava quando o honeypot está vazio", async () => {
        const result = await submitFaqQuestion({ ...valid, website: "" })

        expect(result.success).toBe(true)
        expect(prismaMock.faqSubmission.create).toHaveBeenCalledOnce()
    })

    it("recusa payload que não passa na validação", async () => {
        const result = await submitFaqQuestion({ ...valid, email: "não-é-email" })

        expect(result).toEqual({ success: false, error: "invalid" })
        expect(prismaMock.faqSubmission.create).not.toHaveBeenCalled()
    })

    it("recusa quando o backstop de IP no banco já foi atingido", async () => {
        prismaMock.faqSubmission.count.mockResolvedValue(99)

        const result = await submitFaqQuestion(valid)

        expect(result).toEqual({ success: false, error: "rate_limited" })
        expect(prismaMock.faqSubmission.create).not.toHaveBeenCalled()
    })
})
