export const editableLocales = ["pt", "de", "en", "es", "fr", "it", "nl"] as const

export type EditableLocale = (typeof editableLocales)[number]

export const editableNamespaces = [
    "landing",
    "about",
    "faq",
    "footer",
    "nav",
    "terms",
    "privacy",
    "refund",
] as const
