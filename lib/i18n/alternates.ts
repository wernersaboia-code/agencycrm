import { getPathname } from "./navigation"
import { LOCALES, DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

/**
 * hreflang de mão dupla: cada idioma lista todos os outros, e x-default
 * aponta para o padrão. Sem isto o Google trata as traduções como páginas
 * concorrentes em vez de variantes.
 *
 * O caminho com prefixo de locale vem de getPathname (next-intl), o mesmo
 * mecanismo usado em app/sitemap.ts — evita ter duas implementações da
 * mesma regra de prefixo.
 */
export function alternatesFor(path: string, current: Locale = DEFAULT_LOCALE) {
    const languages: Record<string, string> = {}
    for (const locale of LOCALES) {
        languages[htmlLangFor(locale)] = `${BASE_URL}${getPathname({ href: path, locale })}`
    }
    languages["x-default"] = `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}`

    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: current })}`, languages }
}
