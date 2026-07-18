export const LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "pt"

const RTL_LOCALES = new Set<Locale>(["ar"])

// Tags BCP 47 para o atributo `lang` e para as APIs Intl, que precisam da
// região — "pt" sozinho não define separador decimal nem formato de data.
const HTML_LANG: Record<Locale, string> = {
    pt: "pt-BR",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    ar: "ar",
    it: "it-IT",
    nl: "nl-NL",
}

export function isLocale(value: string): value is Locale {
    return (LOCALES as readonly string[]).includes(value)
}

export function isRtlLocale(locale: Locale): boolean {
    return RTL_LOCALES.has(locale)
}

export function dirForLocale(locale: Locale): "rtl" | "ltr" {
    return isRtlLocale(locale) ? "rtl" : "ltr"
}

export function htmlLangFor(locale: Locale): string {
    return HTML_LANG[locale]
}
