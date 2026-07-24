/**
 * Construtores de JSON-LD (schema.org).
 *
 * São funções PURAS: recebem dados e devolvem objetos. Nenhuma faz I/O, para
 * poderem ser testadas sem banco nem request.
 *
 * Regra do projeto: schema só afirma o que existe de fato. Nada de
 * aggregateRating, review ou contagem de clientes enquanto não houver esse
 * dado real no banco.
 */

import { getPathname } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/locales"

export const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

export const ORGANIZATION_ID = `${BASE_URL}#organization`

const ORGANIZATION_NAME = "Easy Prospect"

export function buildOrganizationSchema(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: ORGANIZATION_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/logo-icon.png`,
    }
}

export function buildWebSiteSchema(): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${BASE_URL}#website`,
        name: ORGANIZATION_NAME,
        url: BASE_URL,
        publisher: { "@id": ORGANIZATION_ID },
    }
}

export interface FaqItem {
    question: string
    answer: string
}

/**
 * Só entram itens com pergunta E resposta preenchidas: FAQPage com Question
 * vazia é erro de rich result no Search Console.
 */
export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items
            .filter((item) => item.question.trim() && item.answer.trim())
            .map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
    }
}

export interface ProductSchemaInput {
    name: string
    slug: string
    description: string | null
    price: number
    currency: string
    isActive: boolean
    locale: string
}

/**
 * `price` sai como string com 2 casas: o schema.org espera o valor em texto,
 * e Number.toFixed evita "149.9" (que alguns validadores rejeitam).
 *
 * Sem aggregateRating/review de propósito — não há avaliação real no banco,
 * e rich result inventado é penalizável além de desonesto.
 */
export function buildProductSchema(input: ProductSchemaInput): Record<string, unknown> {
    const url = `${BASE_URL}${getPathname({ href: `/list/${input.slug}`, locale: input.locale as Locale })}`

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        url,
        inLanguage: input.locale,
        brand: { "@id": ORGANIZATION_ID },
        offers: {
            "@type": "Offer",
            price: Number(input.price).toFixed(2),
            priceCurrency: input.currency,
            availability: input.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url,
            seller: { "@id": ORGANIZATION_ID },
        },
    }
}

export function buildBreadcrumbSchema(
    trail: { name: string; url: string }[]
): Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((entry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: entry.name,
            item: entry.url,
        })),
    }
}

export interface BlogPostingSchemaInput {
    title: string
    description: string | null
    slug: string
    locale: string
    publishedAt: Date | string
    updatedAt: Date | string
    imageUrl?: string | null
}

/**
 * Sem `author` de pessoa física: o projeto não tem entidade de autor
 * publicada. O publisher (a organização) é o sinal honesto disponível.
 * Quando existir página de autor, acrescentar `author` apontando para ela.
 */
export function buildBlogPostingSchema(
    input: BlogPostingSchemaInput
): Record<string, unknown> {
    const toIso = (value: Date | string) =>
        value instanceof Date ? value.toISOString() : new Date(value).toISOString()

    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: input.title,
        ...(input.description ? { description: input.description } : {}),
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
        datePublished: toIso(input.publishedAt),
        dateModified: toIso(input.updatedAt),
        inLanguage: input.locale,
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: `${BASE_URL}${getPathname({ href: `/blog/${input.slug}`, locale: input.locale as Locale })}`,
    }
}

/**
 * JSON.stringify não escapa `<`: um valor com "</script>" (nome/descrição
 * vindos do banco) fecharia a tag <script> e quebraria para fora do JSON-LD.
 * Os três escapes abaixo continuam válidos dentro de uma string JSON.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
}
