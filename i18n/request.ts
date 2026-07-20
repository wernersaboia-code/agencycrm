import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "@/lib/i18n/routing"

// O locale agora vem do segmento de rota ([locale]), não mais de cookie.
// Locale ausente ou desconhecido cai no padrão em vez de quebrar a página.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale

    // Fase 1: só pt e de têm arquivo de mensagens. Os demais locales existem
    // no roteamento (o blog já os usa) mas ainda não têm tradução do funil —
    // até a fase 3, caem no padrão em vez de estourar no import.
    const messagesLocale = locale === "de" ? "de" : "pt"

    return {
        locale,
        messages: (await import(`../messages/${messagesLocale}.json`)).default,
    }
})
