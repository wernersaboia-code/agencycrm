import type { Locale } from "@/lib/i18n/locales"
import { DEFAULT_LOCALE } from "@/lib/i18n/locales"
import type { LegalDocument, LegalKind } from "./types"

import privacyPt from "./privacy.pt"
import privacyDe from "./privacy.de"
import privacyEn from "./privacy.en"
import privacyEs from "./privacy.es"
import privacyFr from "./privacy.fr"
import privacyIt from "./privacy.it"
import privacyNl from "./privacy.nl"

import termsPt from "./terms.pt"
import termsDe from "./terms.de"
import termsEn from "./terms.en"
import termsEs from "./terms.es"
import termsFr from "./terms.fr"
import termsIt from "./terms.it"
import termsNl from "./terms.nl"

const DOCUMENTOS: Record<LegalKind, Partial<Record<Locale, LegalDocument>>> = {
    privacy: {
        pt: privacyPt, de: privacyDe, en: privacyEn, es: privacyEs,
        fr: privacyFr, it: privacyIt, nl: privacyNl,
    },
    terms: {
        pt: termsPt, de: termsDe, en: termsEn, es: termsEs,
        fr: termsFr, it: termsIt, nl: termsNl,
    },
}

/**
 * Idioma sem arquivo cai no português, mesmo princípio do loadMessages: é
 * melhor entregar a política em outro idioma do que não entregar política.
 */
export function getLegalDocument(kind: LegalKind, locale: Locale): LegalDocument {
    return DOCUMENTOS[kind][locale] ?? DOCUMENTOS[kind][DEFAULT_LOCALE]!
}

export type { LegalDocument, LegalKind, LegalSection, LegalBlock } from "./types"
