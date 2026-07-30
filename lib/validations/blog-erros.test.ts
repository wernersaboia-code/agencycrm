import { describe, it, expect } from "vitest"
import type { ZodIssue } from "zod"
import { traduzirErrosDoPost } from "./blog-erros"

// Fixture verbatim do log de produção (Vercel): ZodError real que estourou
// createPostSchema.parse() ao criar o primeiro post do blog. Reproduz o bug
// como teste, em vez de só descrever o que ele fazia.
const ISSUES_DE_PRODUCAO = [
    {
        code: "too_big",
        maximum: 500,
        path: ["translations", 0, "excerpt"],
        message: "Too big: expected string to have <=500 characters",
    },
    {
        code: "too_big",
        maximum: 320,
        path: ["translations", 0, "metaDescription"],
        message: "Too big: expected string to have <=320 characters",
    },
] as unknown as ZodIssue[]

describe("traduzirErrosDoPost", () => {
    it("resolve o índice de translations[0] para o locale correto (bug de produção)", () => {
        const erros = traduzirErrosDoPost(ISSUES_DE_PRODUCAO, ["pt", "en"])

        expect(erros).toEqual([
            { campo: "excerpt", locale: "pt", codigo: "too_big", limite: 500 },
            { campo: "metaDescription", locale: "pt", codigo: "too_big", limite: 320 },
        ])
    })

    it("resolve o locale certo quando o índice não é o primeiro", () => {
        const issues = [
            {
                code: "too_big",
                maximum: 500,
                path: ["translations", 1, "excerpt"],
                message: "Too big: expected string to have <=500 characters",
            },
        ] as unknown as ZodIssue[]

        const erros = traduzirErrosDoPost(issues, ["pt", "en"])

        expect(erros).toEqual([{ campo: "excerpt", locale: "en", codigo: "too_big", limite: 500 }])
    })

    it("issues fora de translations (ex.: categoryId) não recebem locale", () => {
        const issues = [
            {
                code: "invalid_type",
                path: ["categoryId"],
                message: "Invalid input",
            },
        ] as unknown as ZodIssue[]

        const erros = traduzirErrosDoPost(issues, ["pt"])

        expect(erros).toEqual([{ campo: "categoryId", codigo: "invalid_type", limite: undefined }])
    })
})
