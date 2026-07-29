// lib/constants/list-languages.ts
export type ListLanguageCode = "pt" | "en" | "de" | "fr" | "es" | "it" | "nl"

export interface ListLanguage {
    code: ListLanguageCode
    label: string
    /** Código de país para o flagcdn (FlagIcon). */
    flagCode: string
}

export const LIST_LANGUAGES: ReadonlyArray<ListLanguage> = [
    { code: "pt", label: "Português", flagCode: "br" },
    { code: "en", label: "English", flagCode: "gb" },
    { code: "de", label: "Deutsch", flagCode: "de" },
    { code: "fr", label: "Français", flagCode: "fr" },
    { code: "es", label: "Español", flagCode: "es" },
    { code: "it", label: "Italiano", flagCode: "it" },
    { code: "nl", label: "Nederlands", flagCode: "nl" },
]

// Vocabulário para o filtro do catálogo, no mesmo formato dos ids de faceta.
export const LIST_LANGUAGE_CODES: readonly ListLanguageCode[] = LIST_LANGUAGES.map(
    (l) => l.code
)

export function getListLanguage(code: string | null | undefined): ListLanguage | null {
    if (!code) return null
    return LIST_LANGUAGES.find((l) => l.code === code) ?? null
}
