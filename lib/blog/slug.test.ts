// lib/blog/slug.test.ts
import { describe, it, expect } from "vitest"
import { slugify } from "./slug"

describe("slugify", () => {
    it("normaliza acentos e espaços", () => {
        expect(slugify("Oportunidades para Produtos Orgânicos")).toBe("oportunidades-para-produtos-organicos")
    })
    it("colapsa hífens e remove símbolos", () => {
        expect(slugify("Mercosul: o que & como!")).toBe("mercosul-o-que-como")
    })
    it("cai no fallback quando não sobra nada slugificável", () => {
        expect(slugify("سوق", "post")).toBe("post")
    })
    it("apara hífens das pontas", () => {
        expect(slugify("  --Olá--  ")).toBe("ola")
    })
})
