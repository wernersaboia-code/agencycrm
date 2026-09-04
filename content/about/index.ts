import type { Locale } from "@/lib/i18n/locales"
import { DEFAULT_LOCALE } from "@/lib/i18n/locales"
import type { AboutDocument } from "./types"

import aboutPt from "./about.pt"
import aboutDe from "./about.de"
import aboutEn from "./about.en"
import aboutEs from "./about.es"
import aboutFr from "./about.fr"
import aboutIt from "./about.it"
import aboutNl from "./about.nl"
import aboutAr from "./about.ar"

const DOCUMENTOS: Partial<Record<Locale, AboutDocument>> = {
    pt: aboutPt, de: aboutDe, en: aboutEn, es: aboutEs,
    fr: aboutFr, it: aboutIt, nl: aboutNl, ar: aboutAr,
}

/** Idioma sem documento cai no português, mesmo princípio de `content/legal`. */
export function getAboutDocument(locale: Locale): AboutDocument {
    return DOCUMENTOS[locale] ?? DOCUMENTOS[DEFAULT_LOCALE]!
}

export type { AboutDocument, AboutSection, AboutBlock } from "./types"
