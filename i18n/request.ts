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

    // O cookie só é lido quando a rota NÃO traz segmento de idioma nenhum, que
    // é o caso das áreas internas. Duas razões para não ler nos outros casos:
    //
    // 1. Quando a rota traz o idioma, ele já vence o cookie — ler seria inútil.
    //    E tocar em `cookies()` desliga a renderização estática de toda página
    //    que usa tradução, que é justamente o que o funil recuperou.
    // 2. Quando a rota traz um segmento QUE NÃO É idioma (`/llms.txt`,
    //    `/qualquer-coisa`), ela casa com `/[locale]` e vai terminar em 404 —
    //    mas a metadata roda antes disso. Ler cookie ali transformava uma
    //    página pré-renderizada em dinâmica no meio da requisição, e o Next
    //    responde 500 em vez do 404. Bots batem nesses caminhos o tempo todo.
    const cookieLocale = requested === undefined
        ? (await cookies()).get("NEXT_LOCALE")?.value
        : undefined

    const locale = resolveSiteLocale(explicit, cookieLocale)
    const messagesLocale = resolveMessagesLocale(locale)

    // loadMessages cuida do fallback de chave ausente (ver comentário lá).
    return { locale, messages: await loadMessages(messagesLocale) }
})
