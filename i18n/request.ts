import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { isLocale, resolveMessagesLocale } from "@/lib/i18n/locales"
import { resolveSiteLocale } from "@/lib/i18n/resolve-locale"
import { loadMessages } from "@/lib/i18n/load-messages"

// O locale vem do segmento de rota ([locale]) quando disponível. Para as áreas
// internas (páginas sem [locale]), cai no cookie NEXT_LOCALE e, por fim, no pt.
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const explicit = requested && isLocale(requested) ? requested : undefined

    // O cookie só é lido quando a rota NÃO traz o idioma. Ler sempre não muda o
    // resultado (o locale da rota já vence o cookie), mas tocar em `cookies()`
    // aqui desliga a renderização estática de toda página que usa tradução —
    // era, junto com o `getLocale()` do layout raiz antigo, o que mantinha o
    // funil inteiro sendo renderizado no servidor a cada visita.
    const cookieLocale = explicit
        ? undefined
        : (await cookies()).get("NEXT_LOCALE")?.value

    const locale = resolveSiteLocale(explicit, cookieLocale)
    const messagesLocale = resolveMessagesLocale(locale)

    // loadMessages cuida do fallback de chave ausente (ver comentário lá).
    return { locale, messages: await loadMessages(messagesLocale) }
})
