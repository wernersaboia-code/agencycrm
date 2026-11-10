// lib/blog/alternates.ts
import { getPathname } from "@/lib/i18n/navigation"
import { DEFAULT_LOCALE, PUBLISHED_LOCALES, htmlLangFor, type Locale } from "@/lib/i18n/locales"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

function urlDoPost(locale: Locale, slug: string): string {
    return `${BASE_URL}${getPathname({ href: `/blog/${slug}`, locale })}`
}

/**
 * Canonical e hreflang da página de um post.
 *
 * Não dá para usar `alternatesFor` (lib/i18n/alternates): ele supõe o mesmo
 * caminho em todos os idiomas, e o slug do post é traduzido. Aqui a lista de
 * variantes vem das traduções do próprio post (`localeSlugs`).
 *
 * A página do post ficou sem canonical desde a criação do blog — só o índice
 * declarava. Cada tradução ganha canonical próprio; hreflang só aparece
 * quando o post tem mais de uma tradução em idioma publicado, porque um
 * grupo de hreflang com um membro só não diz nada ao buscador.
 *
 * x-default aponta para o idioma padrão quando o post o tem; sem ele, fica de
 * fora em vez de apontar para uma tradução arbitrária.
 */
export function alternatesDoPost(
    locale: Locale,
    slug: string,
    localeSlugs: Record<string, string>,
): { canonical: string; languages?: Record<string, string> } {
    const canonical = urlDoPost(locale, slug)

    const variantes = PUBLISHED_LOCALES.filter((l) => Boolean(localeSlugs[l]))
    if (variantes.length < 2 || !variantes.includes(locale)) return { canonical }

    const languages: Record<string, string> = {}
    for (const l of variantes) {
        languages[htmlLangFor(l)] = urlDoPost(l, localeSlugs[l])
    }
    if (localeSlugs[DEFAULT_LOCALE]) {
        languages["x-default"] = urlDoPost(DEFAULT_LOCALE, localeSlugs[DEFAULT_LOCALE])
    }

    return { canonical, languages }
}
