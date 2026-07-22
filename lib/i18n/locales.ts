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
export const PUBLISHED_LOCALES: readonly Locale[] = ["pt", "de", "en"]

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

// Open Graph usa sublinhado em vez do hífen do BCP 47 (en_US, não en-US).
const OG_LOCALE: Record<Locale, string> = {
    pt: "pt_BR",
    de: "de_DE",
    en: "en_US",
    es: "es_ES",
    fr: "fr_FR",
    ar: "ar_AR",
    it: "it_IT",
    nl: "nl_NL",
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

export function ogLocaleFor(locale: Locale): string {
    return OG_LOCALE[locale]
}

/**
 * Qual arquivo de messages/ carregar para um locale roteável.
 *
 * Só os locales publicados têm tradução própria; os demais (roteáveis mas
 * sem messages/<locale>.json ainda) caem no padrão. Extraído para ser
 * testável isoladamente — antes vivia como ternária direto em
 * i18n/request.ts, crescendo um `: locale === "x" ? "x"` a cada locale novo.
 */
export function resolveMessagesLocale(
    locale: Locale,
    published: readonly Locale[] = PUBLISHED_LOCALES,
    fallback: Locale = DEFAULT_LOCALE
): Locale {
    return published.includes(locale) ? locale : fallback
}
