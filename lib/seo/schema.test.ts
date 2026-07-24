import { describe, it, expect } from "vitest"
import { buildOrganizationSchema, buildWebSiteSchema, BASE_URL } from "./schema"

describe("buildOrganizationSchema", () => {
    it("identifica a organização com @id estável e url absoluta", () => {
        const schema = buildOrganizationSchema()

        expect(schema["@context"]).toBe("https://schema.org")
        expect(schema["@type"]).toBe("Organization")
        expect(schema["@id"]).toBe(`${BASE_URL}#organization`)
        expect(schema.name).toBe("Easy Prospect")
        expect(schema.url).toBe(BASE_URL)
    })

    it("usa logo absoluto", () => {
        const schema = buildOrganizationSchema()
        expect(String(schema.logo)).toContain(BASE_URL)
    })
})

describe("buildWebSiteSchema", () => {
    it("aponta o publisher para a organização pelo @id", () => {
        const schema = buildWebSiteSchema()

        expect(schema["@type"]).toBe("WebSite")
        expect(schema.url).toBe(BASE_URL)
        expect(schema.publisher).toEqual({ "@id": `${BASE_URL}#organization` })
    })
})
