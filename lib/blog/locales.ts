export const BLOG_LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type BlogLocale = (typeof BLOG_LOCALES)[number]

export const DEFAULT_BLOG_LOCALE: BlogLocale = "pt"

const RTL_LOCALES = new Set<BlogLocale>(["ar"])

export function isBlogLocale(value: string): value is BlogLocale {
    return (BLOG_LOCALES as readonly string[]).includes(value)
}

export function isRtlLocale(locale: BlogLocale): boolean {
    return RTL_LOCALES.has(locale)
}

export function dirForLocale(locale: BlogLocale): "rtl" | "ltr" {
    return isRtlLocale(locale) ? "rtl" : "ltr"
}
