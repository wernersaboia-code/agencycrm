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
 */
export function alternatesFor(path: string, current: Locale = DEFAULT_LOCALE) {
    const languages: Record<string, string> = {}
    for (const locale of PUBLISHED_LOCALES) {
        languages[htmlLangFor(locale)] = `${BASE_URL}${getPathname({ href: path, locale })}`
    }
    languages["x-default"] = `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}`

    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: current })}`, languages }
}

/**
 * Canonical único, sem hreflang, sempre na URL do locale padrão.
 *
 * Para páginas roteáveis em todos os locales mas com um só idioma de
 * conteúdo — hoje as listas do marketplace: nome, descrição, tabela de
 * amostra e leads vêm do banco num idioma só; as versões com prefixo
 * (/de/list, /fr/list…) traduzem apenas a interface em volta. Anunciá-las
 * com hreflang recíproco fazia o Google ver 7 quase-duplicatas por lista e
 * empilhá-las em "Detectada, mas não indexada". Apontando todas as variantes
 * para a mesma URL, o buscador consolida os sinais numa página só. Sem
 * `languages` aqui de propósito: com o canonical cruzando para outra URL, o
 * Google ignora o par hreflang de qualquer forma.
 */
export function canonicalDefaultLocale(path: string) {
    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}` }
}
