import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"

/**
 * `LOCALES` inclui locales roteáveis sem tradução própria (hoje "ar"), que
 * caem no fallback para pt. Eles respondem 200 servindo português — se forem
 * indexáveis, viram conteúdo duplicado anunciado como outro idioma.
 *
 * `follow: true` de propósito: não queremos indexar a página, mas os links
 * dela apontam para páginas legítimas que devem seguir sendo rastreadas.
 */
export function isPublishedLocale(locale: string): boolean {
    return (PUBLISHED_LOCALES as readonly string[]).includes(locale as Locale)
}

export function robotsForLocale(locale: string): { index: boolean; follow: boolean } {
    return { index: isPublishedLocale(locale), follow: true }
}
