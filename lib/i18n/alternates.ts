import { LOCALES, DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

function urlFor(path: string, locale: Locale): string {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
    const clean = path === "/" ? "" : path
    return `${BASE_URL}${prefix}${clean}` || BASE_URL
}

/**
 * hreflang de mão dupla: cada idioma lista todos os outros, e x-default
 * aponta para o padrão. Sem isto o Google trata as traduções como páginas
 * concorrentes em vez de variantes.
 */
export function alternatesFor(path: string, current: Locale = DEFAULT_LOCALE) {
    const languages: Record<string, string> = {}
    for (const locale of LOCALES) {
        languages[htmlLangFor(locale)] = urlFor(path, locale)
    }
    languages["x-default"] = urlFor(path, DEFAULT_LOCALE)

    return { canonical: urlFor(path, current), languages }
}
