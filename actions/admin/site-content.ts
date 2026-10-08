"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import type { Locale } from "@/lib/i18n/locales"
import { editableLocales, editableNamespaces, type EditableLocale } from "@/lib/site-content/config"
import { SITE_TEXTS_CACHE_TAG } from "@/lib/site-content/published"

// `value` é o texto digitado, não uma coluna: vira draftValue/publishedValue.
// Espalhar o objeto validado no `create` do upsert mandava `value` ao Prisma,
// que recusava — toda PRIMEIRA edição de um texto falhava (só a criação; o
// update não espalhava). O editor nunca gravou nada até 09.10.2026.
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

/**
 * Resultado das ações de salvar e publicar. A falha é devolvida, não lançada:
 * em produção o Next apaga a mensagem de exceção de Server Action, e o editor
 * só conseguia dizer "não foi possível salvar" — foi assim que o editor ficou
 * quebrado sem que ninguém soubesse o motivo. `error` é um código que a tela
 * traduz para o idioma do admin.
 */
export type SiteTextResult = { success: true } | { success: false; error: "invalid" | "unexpected" }

export async function saveSiteTextDraft(input: unknown): Promise<SiteTextResult> {
    const admin = await requireAdmin()
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success || !isEditableKey(parsed.data?.key ?? "")) {
        return { success: false, error: "invalid" }
    }

    try {
        await prisma.siteText.upsert({
            where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
            create: { locale: parsed.data.locale, key: parsed.data.key, draftValue: parsed.data.value, updatedById: admin.id },
            update: { draftValue: parsed.data.value, updatedById: admin.id },
        })
    } catch (error) {
        console.error("[site-content] Falha ao salvar rascunho:", error)
        return { success: false, error: "unexpected" }
    }
    revalidatePath("/super-admin/content")
    return { success: true }
}

export async function publishSiteText(input: unknown): Promise<SiteTextResult> {
    const admin = await requireAdmin()
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success || !isEditableKey(parsed.data?.key ?? "")) {
        return { success: false, error: "invalid" }
    }

    try {
        await prisma.siteText.upsert({
            where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
            create: {
                locale: parsed.data.locale,
                key: parsed.data.key,
                draftValue: parsed.data.value,
                publishedValue: parsed.data.value,
                updatedById: admin.id,
            },
            update: { draftValue: parsed.data.value, publishedValue: parsed.data.value, updatedById: admin.id },
        })
    } catch (error) {
        console.error("[site-content] Falha ao publicar texto:", error)
        return { success: false, error: "unexpected" }
    }

    // Server Action: updateTag invalida imediatamente e garante que o próprio
    // administrador já veja o texto novo na visita seguinte.
    updateTag(SITE_TEXTS_CACHE_TAG)
    // A alteração é carregada junto das traduções; invalidar os layouts faz o
    // CDN descartar possíveis páginas pré-renderizadas de todos os idiomas.
    revalidatePath("/", "layout")
    revalidatePath(`/${parsed.data.locale}`, "layout")
    revalidatePath("/super-admin/content")
    return { success: true }
}
