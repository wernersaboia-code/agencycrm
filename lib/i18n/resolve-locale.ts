export const SITE_LOCALES = ["pt", "de"] as const
export type SiteLocale = (typeof SITE_LOCALES)[number]
export const DEFAULT_SITE_LOCALE: SiteLocale = "pt"

function isSiteLocale(value: string | undefined): value is SiteLocale {
    return value === "pt" || value === "de"
}

export function resolveSiteLocale(
    explicit: string | undefined,
    cookieValue: string | undefined
): SiteLocale {
    if (isSiteLocale(explicit)) return explicit
    if (isSiteLocale(cookieValue)) return cookieValue
    return DEFAULT_SITE_LOCALE
}

/**
 * Tag BCP 47 para o atributo `lang` do documento e para as APIs de formatação
 * (`Intl`), que precisam da região — "pt" sozinho não define separador decimal
 * nem formato de data.
 */
const HTML_LANG: Record<SiteLocale, string> = {
    pt: "pt-BR",
    de: "de-DE",
}

export function toHtmlLang(locale: string | undefined): string {
    return isSiteLocale(locale) ? HTML_LANG[locale] : HTML_LANG[DEFAULT_SITE_LOCALE]
}
