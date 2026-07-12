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
