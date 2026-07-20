export const LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "pt"

// Locales roteáveis (LOCALES) x locales publicados (PUBLISHED_LOCALES) são
// conceitos diferentes. Todo locale em LOCALES responde 200 em suas rotas —
// o next-intl e o middleware não distinguem entre eles. Mas nem todo locale
// roteável tem tradução própria: hoje só pt e de têm arquivo em messages/,
// os demais caem no fallback para pt (ver comentário em i18n/request.ts).
// PUBLISHED_LOCALES é o subconjunto com conteúdo traduzido de verdade — só
// esses devem ser anunciados ao Google via sitemap e hreflang (alternates),
// para não submeter páginas em português como se fossem en-US, es-ES etc.
// As fases 3 e 4 do projeto devem acrescentar locales aqui à medida que os
// respectivos arquivos de messages/ forem criados.
export const PUBLISHED_LOCALES: readonly Locale[] = ["pt", "de"]

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
