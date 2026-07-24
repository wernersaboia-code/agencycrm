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
