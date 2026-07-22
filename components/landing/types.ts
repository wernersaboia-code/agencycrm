export type LandingLocale = "pt" | "de" | "en"

// Temporário até a fase 3 trazer traduções da landing para os demais idiomas:
// hoje só existe conteúdo em pt, de e en, então qualquer outro locale de rota
// (es, fr, ar, it, nl) cai no padrão pt em vez de quebrar o tipo.
export function toLandingLocale(locale: string): LandingLocale {
    if (locale === "de" || locale === "en") return locale
    return "pt"
}
