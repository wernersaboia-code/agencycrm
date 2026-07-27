import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { cookies } from "next/headers"
import { routing } from "@/lib/i18n/routing"
import { DEFAULT_LOCALE, resolveMessagesLocale } from "@/lib/i18n/locales"
import { resolveSiteLocale } from "@/lib/i18n/resolve-locale"
import { mergeMessages, type Messages } from "@/lib/i18n/merge-messages"

// O locale vem do segmento de rota ([locale]) quando disponível. Para o funil
// (páginas sem [locale]), cai no cookie NEXT_LOCALE e, por fim, no padrão pt.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value
    const locale = resolveSiteLocale(requested, cookieLocale)
    const messagesLocale = resolveMessagesLocale(locale)

    const messages = (await import(`../messages/${messagesLocale}.json`)).default as Messages

    if (messagesLocale === DEFAULT_LOCALE) {
        return { locale, messages }
    }

    // Chave sem tradução cai no português em vez de aparecer como caminho cru
    // na tela. É o caso hoje do namespace `admin` (o super-admin só tem pt e
    // en): quem tem o cookie de idioma em outro locale via "admin.common.save"
    // escrito na interface. Ver o teste de paridade em messages-integridade.
    const fallback = (await import(`../messages/${DEFAULT_LOCALE}.json`)).default as Messages

    return { locale, messages: mergeMessages(fallback, messages) }
})
