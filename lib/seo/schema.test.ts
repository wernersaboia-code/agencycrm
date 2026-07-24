import { describe, it, expect } from "vitest"
import {
    buildOrganizationSchema,
    buildWebSiteSchema,
    buildFaqSchema,
    buildProductSchema,
    buildBreadcrumbSchema,
    buildListBreadcrumbTrail,
    buildBlogPostingSchema,
    serializeJsonLd,
    BASE_URL,
    ORGANIZATION_ID,
} from "./schema"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

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

describe("buildFaqSchema", () => {
    it("mapeia cada par pergunta/resposta para Question + Answer", () => {
        const schema = buildFaqSchema([
            { question: "Como recebo a lista?", answer: "Por download em PDF." },
        ])

        expect(schema["@type"]).toBe("FAQPage")
        expect(schema.mainEntity).toEqual([
            {
                "@type": "Question",
                name: "Como recebo a lista?",
                acceptedAnswer: { "@type": "Answer", text: "Por download em PDF." },
            },
        ])
    })

    it("ignora itens sem pergunta ou sem resposta", () => {
        const schema = buildFaqSchema([
            { question: "Válida?", answer: "Sim." },
            { question: "", answer: "Sem pergunta" },
            { question: "Sem resposta", answer: "" },
        ])

        expect((schema.mainEntity as unknown[]).length).toBe(1)
    })
})

describe("integridade do conteúdo do FAQ", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: toda resposta do FAQ está preenchida e sem placeholder`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            const items = messages.faq.items as { question: string; answer: string }[]

            expect(items.length).toBeGreaterThan(0)

            for (const item of items) {
                expect(item.question.trim()).not.toBe("")
                expect(item.answer.trim()).not.toBe("")
                expect(item.question).not.toContain("PLACEHOLDER")
                expect(item.answer).not.toContain("PLACEHOLDER")
            }

            expect(messages.faq._placeholder).toBeUndefined()
        })

        it(`${locale}: nenhuma chave _placeholder sobrevive em qualquer lugar das mensagens`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            // Um `_placeholder` marca texto de handoff que não pode ir ao ar
            // (números inventados, cópia provisória). Verificar só dentro de
            // `faq` deixava passar blocos como o antigo `landing.zahlen`, que
            // ficou meses no repositório a um remonte de distância de publicar
            // "6+ listas vendidas". A varredura é recursiva de propósito.
            const found: string[] = []
            const walk = (node: unknown, path: string) => {
                if (Array.isArray(node)) {
                    node.forEach((child, i) => walk(child, `${path}[${i}]`))
                    return
                }
                if (!node || typeof node !== "object") return
                for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
                    const childPath = path ? `${path}.${key}` : key
                    if (key === "_placeholder") found.push(childPath)
                    walk(value, childPath)
                }
            }
            walk(messages, "")

            expect(found).toEqual([])
        })

        it(`${locale}: buildFaqSchema emite uma Question por item do FAQ`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            const items = messages.faq.items as { question: string; answer: string }[]

            const schema = buildFaqSchema(items)
            expect((schema.mainEntity as unknown[]).length).toBe(items.length)
        })
    }
})

describe("buildProductSchema", () => {
    const base = {
        name: "Importadores de Café — Alemanha",
        slug: "importadores-cafe-alemanha",
        description: "Lista de importadores alemães.",
        price: 149.9,
        currency: "EUR",
        isActive: true,
        locale: "pt",
    }

    it("declara a oferta com preço, moeda e url canônica", () => {
        const schema = buildProductSchema(base)

        expect(schema["@type"]).toBe("Product")
        expect(schema.name).toBe(base.name)
        const offer = schema.offers as Record<string, unknown>
        expect(offer["@type"]).toBe("Offer")
        expect(offer.price).toBe("149.90")
        expect(offer.priceCurrency).toBe("EUR")
        expect(offer.url).toBe(`${BASE_URL}/list/${base.slug}`)
    })

    it("pt (default locale): url e offer.url não têm prefixo de idioma", () => {
        const schema = buildProductSchema(base)
        const offer = schema.offers as Record<string, unknown>

        expect(schema.url).toBe(`${BASE_URL}/list/${base.slug}`)
        expect(offer.url).toBe(`${BASE_URL}/list/${base.slug}`)
    })

    it("de: url e offer.url levam o prefixo /de", () => {
        const schema = buildProductSchema({ ...base, locale: "de" })
        const offer = schema.offers as Record<string, unknown>

        expect(schema.url).toBe(`${BASE_URL}/de/list/${base.slug}`)
        expect(offer.url).toBe(`${BASE_URL}/de/list/${base.slug}`)
    })

    it("declara o idioma da página", () => {
        expect(buildProductSchema(base).inLanguage).toBe("pt")
    })

    it("marca disponibilidade a partir de isActive", () => {
        const ativo = buildProductSchema(base).offers as Record<string, unknown>
        const inativo = buildProductSchema({ ...base, isActive: false }).offers as Record<string, unknown>

        expect(ativo.availability).toBe("https://schema.org/InStock")
        expect(inativo.availability).toBe("https://schema.org/OutOfStock")
    })

    it("não inventa avaliação nem estoque numérico", () => {
        const schema = buildProductSchema(base)

        expect(schema.aggregateRating).toBeUndefined()
        expect(schema.review).toBeUndefined()
    })
})

describe("buildBreadcrumbSchema", () => {
    it("numera as posições a partir de 1", () => {
        const schema = buildBreadcrumbSchema([
            { name: "Catálogo", url: `${BASE_URL}/catalog` },
            { name: "Lista X", url: `${BASE_URL}/list/x` },
        ])

        expect(schema["@type"]).toBe("BreadcrumbList")
        expect(schema.itemListElement).toEqual([
            { "@type": "ListItem", position: 1, name: "Catálogo", item: `${BASE_URL}/catalog` },
            { "@type": "ListItem", position: 2, name: "Lista X", item: `${BASE_URL}/list/x` },
        ])
    })
})

describe("buildListBreadcrumbTrail", () => {
    const base = {
        catalogLabel: "Catálogo",
        listName: "Importadores de Café — Alemanha",
        slug: "importadores-cafe-alemanha",
        locale: "pt",
    }

    it("pt (default locale): urls do catálogo e da lista não têm prefixo de idioma", () => {
        const trail = buildListBreadcrumbTrail(base)

        expect(trail).toEqual([
            { name: "Catálogo", url: `${BASE_URL}/catalog` },
            { name: base.listName, url: `${BASE_URL}/list/${base.slug}` },
        ])
    })

    it("de: urls do catálogo e da lista levam o prefixo /de", () => {
        const trail = buildListBreadcrumbTrail({ ...base, locale: "de" })

        expect(trail).toEqual([
            { name: "Catálogo", url: `${BASE_URL}/de/catalog` },
            { name: base.listName, url: `${BASE_URL}/de/list/${base.slug}` },
        ])
    })

    it("o último item da trilha bate com a própria url da página (regra do rich result)", () => {
        const trail = buildListBreadcrumbTrail({ ...base, locale: "de" })
        const lastItem = trail[trail.length - 1]

        expect(lastItem.url).toBe(`${BASE_URL}/de/list/${base.slug}`)
    })
})

describe("buildBlogPostingSchema", () => {
    const base = {
        title: "Como escolher um importador",
        description: "Guia prático.",
        slug: "como-escolher-importador",
        locale: "pt",
        publishedAt: new Date("2026-07-01T10:00:00Z"),
        updatedAt: new Date("2026-07-10T10:00:00Z"),
    }

    it("emite datas em ISO e publisher pela organização", () => {
        const schema = buildBlogPostingSchema(base)

        expect(schema["@type"]).toBe("BlogPosting")
        expect(schema.headline).toBe(base.title)
        expect(schema.datePublished).toBe("2026-07-01T10:00:00.000Z")
        expect(schema.dateModified).toBe("2026-07-10T10:00:00.000Z")
        expect(schema.publisher).toEqual({ "@id": ORGANIZATION_ID })
    })

    it("omite image quando não há capa", () => {
        expect(buildBlogPostingSchema(base).image).toBeUndefined()
        expect(buildBlogPostingSchema({ ...base, imageUrl: "https://x/i.png" }).image)
            .toBe("https://x/i.png")
    })

    it("pt (default locale): mainEntityOfPage não tem prefixo de idioma", () => {
        const schema = buildBlogPostingSchema(base)
        expect(schema.mainEntityOfPage).toBe(`${BASE_URL}/blog/${base.slug}`)
    })

    it("de: mainEntityOfPage leva o prefixo /de", () => {
        const schema = buildBlogPostingSchema({ ...base, locale: "de" })
        expect(schema.mainEntityOfPage).toBe(`${BASE_URL}/de/blog/${base.slug}`)
    })
})

describe("serializeJsonLd", () => {
    it("escapa </script> para não quebrar a tag script", () => {
        const malicious = { "@context": "https://schema.org", name: "</script><script>alert(1)</script>" }

        const serialized = serializeJsonLd(malicious)

        expect(serialized).not.toContain("</script>")
        expect(JSON.parse(serialized)).toEqual(malicious)
    })

    it("mantém a serialização válida para dados normais", () => {
        const data = { "@type": "Organization", name: "Easy Prospect" }
        const serialized = serializeJsonLd(data)

        expect(JSON.parse(serialized)).toEqual(data)
    })
})
