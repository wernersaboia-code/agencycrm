import { describe, it, expect } from "vitest"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { describeListError } from "./action-errors"

function conflitoDeSlug() {
    return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
        meta: { modelName: "LeadList", target: ["slug"] },
    })
}

describe("describeListError", () => {
    it("explica o conflito de slug em vez de devolver o texto do Prisma", () => {
        const mensagem = describeListError(conflitoDeSlug())

        expect(mensagem).toMatch(/slug/i)
        expect(mensagem).not.toMatch(/Unique constraint/i)
        expect(mensagem).not.toMatch(/P2002/)
    })

    it("nomeia o campo em conflito quando não é o slug", () => {
        const erro = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
            code: "P2002",
            clientVersion: "6.19.3",
            meta: { modelName: "LeadList", target: ["name"] },
        })

        expect(describeListError(erro)).toMatch(/name/)
    })

    it("traduz erro de validação sem despejar o JSON do zod", () => {
        const schema = z.object({ prices: z.object({ EUR: z.number().positive() }) })
        const resultado = schema.safeParse({ prices: { EUR: 0 } })
        const mensagem = describeListError(resultado.success ? null : resultado.error)

        expect(mensagem).toMatch(/prices\.EUR/)
        expect(mensagem).not.toMatch(/\[\s*\{/)
    })

    it("preserva mensagem nossa — é escrita para ser lida pelo admin", () => {
        const mensagem = describeListError(
            new Error("Publicar exige o estudo em PDF anexado.")
        )

        expect(mensagem).toBe("Publicar exige o estudo em PDF anexado.")
    })

    it("cai numa mensagem genérica para o que não reconhece", () => {
        expect(describeListError({ estranho: true })).toMatch(/inesperado/i)
    })
})
