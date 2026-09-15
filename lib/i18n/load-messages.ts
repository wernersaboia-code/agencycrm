import type { AbstractIntlMessages } from "next-intl"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { mergeMessages, type Messages } from "@/lib/i18n/merge-messages"
import { prisma } from "@/lib/prisma"

function setMessageValue(messages: Record<string, unknown>, key: string, value: string) {
    const parts = key.split(".")
    let current: unknown = messages

    for (const part of parts.slice(0, -1)) {
        if (!current || typeof current !== "object") return
        const next = Array.isArray(current)
            ? current[Number(part)]
            : (current as Record<string, unknown>)[part]
        if (!next || typeof next !== "object") return
        // Itens de FAQ e listas da landing também são mensagens editáveis.
        current = next
    }

    const last = parts.at(-1)
    if (!last || !current || typeof current !== "object") return
    if (Array.isArray(current)) {
        const index = Number(last)
        if (typeof current[index] === "string") current[index] = value
    } else if (typeof (current as Record<string, unknown>)[last] === "string") {
        ;(current as Record<string, unknown>)[last] = value
    }
}

async function applyPublishedSiteTexts(locale: Locale, messages: Messages): Promise<Messages> {
    try {
        const overrides = await prisma.siteText.findMany({
            where: { locale, publishedValue: { not: null } },
            select: { key: true, publishedValue: true },
        })

        if (overrides.length === 0) return messages

        // Imports JSON são compartilhados pelo runtime; jamais altere o objeto
        // original, ou uma visita poderia vazar o texto para outro idioma.
        const merged = structuredClone(messages) as Record<string, unknown>
        for (const override of overrides) {
            if (override.publishedValue !== null) {
                setMessageValue(merged, override.key, override.publishedValue)
            }
        }
        return merged as Messages
    } catch (error) {
        // A vitrine continua disponível durante a primeira implantação, antes
        // da migration da tabela de conteúdo ter sido executada.
        console.error("[i18n] Não foi possível carregar textos publicados:", error)
        return messages
    }
}

// Carrega o pacote de mensagens de um locale publicado. Caminho relativo (não
// alias) para o import dinâmico funcionar no bundler, igual a i18n/request.ts.
//
// Chave sem tradução cai no português em vez de aparecer como caminho cru na
// tela. É o caso hoje do namespace `admin` (o super-admin só tem pt e en):
// quem tem o idioma da conta em de/es/fr/it/nl veria "admin.common.save"
// escrito na interface. Ver o teste de paridade em messages-integridade.
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
    const messages = await applyPublishedSiteTexts(
        locale,
        (await import(`../../messages/${locale}.json`)).default as Messages
    )

    if (locale === DEFAULT_LOCALE) {
        return messages
    }

    const fallback = await applyPublishedSiteTexts(
        DEFAULT_LOCALE,
        (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default as Messages
    )

    return mergeMessages(fallback, messages)
}
