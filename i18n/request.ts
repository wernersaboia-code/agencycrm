import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "@/lib/i18n/routing"
import { resolveMessagesLocale } from "@/lib/i18n/locales"

// O locale agora vem do segmento de rota ([locale]), não mais de cookie.
// Locale ausente ou desconhecido cai no padrão em vez de quebrar a página.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale

    // Nem todo locale roteável tem messages/ próprio — resolveMessagesLocale
    // devolve o próprio locale se ele estiver publicado, ou o padrão se ainda
    // não tiver tradução (ver PUBLISHED_LOCALES em lib/i18n/locales.ts).
    const messagesLocale = resolveMessagesLocale(locale)

    return {
        locale,
        messages: (await import(`../messages/${messagesLocale}.json`)).default,
    }
})
