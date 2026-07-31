import { cache } from "react"
import { getTranslations } from "next-intl/server"
import { getAuthenticatedDbUser } from "@/lib/auth"
import { DEFAULT_LOCALE, resolveMessagesLocale, type Locale } from "@/lib/i18n/locales"

/**
 * Idioma do super-admin: o da CONTA, não o do cookie do site.
 *
 * O painel tinha duas fontes de idioma ao mesmo tempo e mostrava as duas na
 * mesma tela: as páginas são server components e chamavam `getTranslations()`
 * sem locale, que cai no `i18n/request.ts` e lê o cookie `NEXT_LOCALE`; já a
 * sidebar e o header são client components e leem o `NextIntlClientProvider`
 * do layout, que sempre usou `dbUser.language`. Resultado visível em produção:
 * conteúdo em alemão com menu em português.
 *
 * A conta vence porque é o que serve ao caso real — um admin alemão abre o
 * painel em alemão mesmo tendo navegado no funil em português, e o cookie do
 * funil não deve arrastar a área interna junto.
 *
 * `cache` do React deduplica por request: as ~13 páginas server podem chamar
 * isto à vontade que a consulta ao banco acontece uma vez só.
 */
export const getAdminLocale = cache(async (): Promise<Locale> => {
    const dbUser = await getAuthenticatedDbUser()

    if (!dbUser?.language) {
        return DEFAULT_LOCALE
    }

    return resolveMessagesLocale(dbUser.language as Locale)
})

/**
 * Use isto no lugar de `getTranslations` em toda página server do super-admin.
 *
 * `getTranslations` sem locale explícito resolve pelo `i18n/request.ts`, que
 * nas rotas sem segmento de idioma lê o cookie — é exatamente o desencontro
 * que este módulo existe para fechar. Passando o locale, a página fala o mesmo
 * idioma que a sidebar e o header.
 */
export async function getAdminTranslations(namespace: string) {
    return getTranslations({ locale: await getAdminLocale(), namespace })
}
