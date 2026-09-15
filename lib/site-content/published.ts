import "server-only"

import type { AbstractIntlMessages } from "next-intl"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { mergeMessages, type Messages } from "@/lib/i18n/merge-messages"

export const SITE_TEXTS_CACHE_TAG = "site-texts-published"

const getPublishedSiteTexts = unstable_cache(
    async (locale: Locale) => prisma.siteText.findMany({
        where: { locale, publishedValue: { not: null } },
        select: { key: true, publishedValue: true },
    }),
    ["site-texts-published-v1"],
    { tags: [SITE_TEXTS_CACHE_TAG], revalidate: 3600 }
)

function setMessageValue(messages: Record<string, unknown>, key: string, value: string) {
    const parts = key.split(".")
    let current: unknown = messages

    for (const part of parts.slice(0, -1)) {
        if (!current || typeof current !== "object") return
        const next = Array.isArray(current)
            ? current[Number(part)]
            : (current as Record<string, unknown>)[part]
        if (!next || typeof next !== "object") return
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

async function loadLocaleWithPublishedTexts(locale: Locale): Promise<Messages> {
    const messages = (await import(`../../messages/${locale}.json`)).default as Messages

    try {
        const overrides = await getPublishedSiteTexts(locale)
        if (overrides.length === 0) return messages

        const merged = structuredClone(messages) as Record<string, unknown>
        for (const override of overrides) {
            if (override.publishedValue !== null) {
                setMessageValue(merged, override.key, override.publishedValue)
            }
        }
        return merged as Messages
    } catch (error) {
        // Uma indisponibilidade do banco não pode derrubar o site público.
        console.error("[site-content] Não foi possível carregar textos publicados:", error)
        return messages
    }
}

/** Carregador exclusivo do site público; banco e cache não entram no painel. */
export async function loadPublicMessages(locale: Locale): Promise<AbstractIntlMessages> {
    const messages = await loadLocaleWithPublishedTexts(locale)
    if (locale === DEFAULT_LOCALE) return messages

    const fallback = await loadLocaleWithPublishedTexts(DEFAULT_LOCALE)
    return mergeMessages(fallback, messages)
}
