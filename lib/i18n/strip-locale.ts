import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales"

/**
 * Separa o prefixo de idioma do restante do caminho.
 *
 * O middleware de auth casa rotas públicas por caminho literal; sem isto,
 * "/de/catalog" não seria reconhecida como a mesma rota que "/catalog".
 */
export function stripLocale(pathname: string): { locale: Locale; pathname: string } {
    const segments = pathname.split("/")
    const first = segments[1] ?? ""

    if (!isLocale(first)) {
        return { locale: DEFAULT_LOCALE, pathname }
    }

    const rest = "/" + segments.slice(2).join("/")
    return { locale: first, pathname: rest === "/" ? "/" : rest.replace(/\/$/, "") }
}
