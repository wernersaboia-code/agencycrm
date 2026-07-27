import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { cookies } from "next/headers"
import { routing } from "@/lib/i18n/routing"
import { resolveMessagesLocale } from "@/lib/i18n/locales"
import { resolveSiteLocale } from "@/lib/i18n/resolve-locale"
import { loadMessages } from "@/lib/i18n/load-messages"

// O locale vem do segmento de rota ([locale]) quando disponível. Para o funil
// (páginas sem [locale]), cai no cookie NEXT_LOCALE e, por fim, no padrão pt.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value
    const locale = resolveSiteLocale(requested, cookieLocale)
    const messagesLocale = resolveMessagesLocale(locale)

    // loadMessages cuida do fallback de chave ausente (ver comentário lá).
    return { locale, messages: await loadMessages(messagesLocale) }
})
