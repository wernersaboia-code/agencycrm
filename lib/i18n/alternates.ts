import { getPathname } from "./navigation"
import { PUBLISHED_LOCALES, DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

/**
 * hreflang de mão dupla: cada idioma publicado lista todos os outros, e
 * x-default aponta para o padrão. Sem isto o Google trata as traduções como
 * páginas concorrentes em vez de variantes.
 *
 * Iteramos sobre PUBLISHED_LOCALES, não LOCALES: locales roteáveis sem
 * tradução própria caem no fallback para pt (ver i18n/request.ts) e não
 * devem ser anunciados como variantes de idioma — isso sinalizaria conteúdo
 * duplicado ao buscador.
 *
 * O caminho com prefixo de locale vem de getPathname (next-intl), o mesmo
 * mecanismo usado em app/sitemap.ts — evita ter duas implementações da
 * mesma regra de prefixo.
 *
 * Usado nas rotas estáticas E nas páginas de lista. As listas antes
 * canonicalizavam todas as variantes para a URL pt (sem hreflang); a medição
 * com a URL Inspection API mostrou que o Google ignorava esse canonical e
 * indexava 322 variantes mesmo assim, deixando 31 canônicas de fora. Cada
 * variante passa a ter canonical próprio + hreflang recíproco: os sinais
 * apontam para a mesma família de páginas em vez de se dividirem.
 */
export function alternatesFor(path: string, current: Locale = DEFAULT_LOCALE) {
    const languages: Record<string, string> = {}
    for (const locale of PUBLISHED_LOCALES) {
        languages[htmlLangFor(locale)] = `${BASE_URL}${getPathname({ href: path, locale })}`
    }
    languages["x-default"] = `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}`

    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: current })}`, languages }
}
