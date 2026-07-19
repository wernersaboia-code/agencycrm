export type LandingLocale = "pt" | "de"

// Temporário até a fase 3 trazer traduções da landing para os demais idiomas:
// hoje só existe conteúdo em pt e de, então qualquer outro locale de rota
// (en, es, fr, ar, it, nl) cai no padrão pt em vez de quebrar o tipo.
export function toLandingLocale(locale: string): LandingLocale {
    return locale === "de" ? "de" : "pt"
}
