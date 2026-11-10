import { describe, expect, it } from "vitest"
import { alternatesDoPost } from "./alternates"

const BASE = "https://www.easyprospect.com.br"

describe("alternatesDoPost", () => {
    it("post com uma tradução só tem canonical próprio, sem hreflang", () => {
        const r = alternatesDoPost("de", "der-markt", { de: "der-markt" })
        expect(r.canonical).toBe(`${BASE}/de/blog/der-markt`)
        expect(r.languages).toBeUndefined()
    })

    it("idioma padrão não leva prefixo no canonical", () => {
        const r = alternatesDoPost("pt", "o-mercado", { pt: "o-mercado" })
        expect(r.canonical).toBe(`${BASE}/blog/o-mercado`)
    })

    it("post com várias traduções lista todas, cada uma com o próprio slug", () => {
        const r = alternatesDoPost("es", "el-mercado", { es: "el-mercado", it: "il-mercato" })
        expect(r.canonical).toBe(`${BASE}/es/blog/el-mercado`)
        expect(Object.values(r.languages ?? {})).toEqual([
            `${BASE}/es/blog/el-mercado`,
            `${BASE}/it/blog/il-mercato`,
        ])
    })

    it("x-default só aparece quando o post tem o idioma padrão", () => {
        const sem = alternatesDoPost("es", "a", { es: "a", it: "b" })
        expect(sem.languages?.["x-default"]).toBeUndefined()

        const com = alternatesDoPost("de", "b", { pt: "a", de: "b" })
        expect(com.languages?.["x-default"]).toBe(`${BASE}/blog/a`)
    })

    it("ignora tradução em idioma não publicado", () => {
        const r = alternatesDoPost("de", "b", { de: "b", ar: "c" })
        expect(r.languages).toBeUndefined()
    })
})
