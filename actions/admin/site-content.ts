"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import type { Locale } from "@/lib/i18n/locales"

export const editableLocales = ["pt", "de", "en", "es", "fr", "it", "nl"] as const
type EditableLocale = (typeof editableLocales)[number]
const editableNamespaces = ["landing", "about", "faq", "footer", "nav", "terms", "privacy", "refund"]
const inputSchema = z.object({
    locale: z.enum(editableLocales),
    key: z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(180),
    value: z.string().trim().min(1).max(12_000),
})

export type SiteTextField = {
    key: string
    originalValue: string
    draftValue: string | null
    publishedValue: string | null
    updatedAt: string | null
}

function flattenStrings(value: unknown, prefix = ""): Array<{ key: string; value: string }> {
    if (typeof value === "string") return [{ key: prefix, value }]
    if (!value || typeof value !== "object") return []
    if (Array.isArray(value)) {
        return value.flatMap((child, index) => flattenStrings(child, `${prefix}.${index}`))
    }

    return Object.entries(value).flatMap(([key, child]) =>
        flattenStrings(child, prefix ? `${prefix}.${key}` : key)
    )
}

function isEditableKey(key: string) {
    return editableNamespaces.some((namespace) => key === namespace || key.startsWith(`${namespace}.`))
}

async function sourceMessages(locale: Locale): Promise<Record<string, unknown>> {
    return (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>
}

export async function getSiteTexts(locale: EditableLocale): Promise<SiteTextField[]> {
    await requireAdmin()
    const [messages, overrides] = await Promise.all([
        sourceMessages(locale),
        prisma.siteText.findMany({ where: { locale } }),
    ])
    const overridesByKey = new Map(overrides.map((item) => [item.key, item]))

    return flattenStrings(messages)
        .filter((field) => isEditableKey(field.key))
        .map((field) => {
            const override = overridesByKey.get(field.key)
            return {
                key: field.key,
                originalValue: field.value,
                draftValue: override?.draftValue ?? null,
                publishedValue: override?.publishedValue ?? null,
                updatedAt: override?.updatedAt.toISOString() ?? null,
            }
        })
}

export async function saveSiteTextDraft(input: unknown) {
    const admin = await requireAdmin()
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success || !isEditableKey(parsed.data?.key ?? "")) {
        throw new Error("Texto inválido")
    }

    await prisma.siteText.upsert({
        where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
        create: { ...parsed.data, draftValue: parsed.data.value, updatedById: admin.id },
        update: { draftValue: parsed.data.value, updatedById: admin.id },
    })
    return { success: true }
}

export async function publishSiteText(input: unknown) {
    const admin = await requireAdmin()
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success || !isEditableKey(parsed.data?.key ?? "")) {
        throw new Error("Texto inválido")
    }

    await prisma.siteText.upsert({
        where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
        create: { ...parsed.data, draftValue: parsed.data.value, publishedValue: parsed.data.value, updatedById: admin.id },
        update: { draftValue: parsed.data.value, publishedValue: parsed.data.value, updatedById: admin.id },
    })

    // A alteração é carregada junto das traduções; invalidar os layouts faz o
    // CDN descartar possíveis páginas pré-renderizadas de todos os idiomas.
    revalidatePath("/", "layout")
    revalidatePath(`/${parsed.data.locale}`, "layout")
    return { success: true }
}
