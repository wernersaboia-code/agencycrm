import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"

export type LandingLocale = "pt" | "de" | "en" | "es" | "fr" | "it" | "nl"

// Temporário até a fase 4 trazer tradução da landing para o árabe: hoje só
// falta ele entre os locales roteáveis, então qualquer locale de rota sem
// tradução própria cai no padrão pt em vez de quebrar o tipo.
export function toLandingLocale(locale: string): LandingLocale {
    return PUBLISHED_LOCALES.includes(locale as Locale) ? (locale as LandingLocale) : "pt"
}
