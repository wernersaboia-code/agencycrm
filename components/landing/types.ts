export type LandingLocale = "pt" | "de" | "en" | "es" | "fr"

// Temporário até a fase 3 trazer traduções da landing para os demais idiomas:
// hoje só existe conteúdo em pt, de, en, es e fr, então qualquer outro locale
// de rota (ar, it, nl) cai no padrão pt em vez de quebrar o tipo.
export function toLandingLocale(locale: string): LandingLocale {
    if (locale === "de" || locale === "en" || locale === "es" || locale === "fr") return locale
    return "pt"
}
