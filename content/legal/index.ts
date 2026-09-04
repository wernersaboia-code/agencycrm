import type { Locale } from "@/lib/i18n/locales"
import { DEFAULT_LOCALE, PUBLISHED_LOCALES } from "@/lib/i18n/locales"
import type { LegalDocument, LegalKind } from "./types"

import privacyPt from "./privacy.pt"
import privacyDe from "./privacy.de"
import privacyEn from "./privacy.en"
import privacyEs from "./privacy.es"
import privacyFr from "./privacy.fr"
import privacyIt from "./privacy.it"
import privacyNl from "./privacy.nl"

import refundPt from "./refund.pt"
import refundDe from "./refund.de"
import refundEn from "./refund.en"
import refundEs from "./refund.es"
import refundFr from "./refund.fr"
import refundIt from "./refund.it"
import refundNl from "./refund.nl"

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
    refund: {
        pt: refundPt, de: refundDe, en: refundEn, es: refundEs,
        fr: refundFr, it: refundIt, nl: refundNl,
    },
}

/**
 * Idioma sem arquivo cai no português, mesmo princípio do loadMessages: é
 * melhor entregar a política em outro idioma do que não entregar política.
 */
export function getLegalDocument(kind: LegalKind, locale: Locale): LegalDocument {
    return DOCUMENTOS[kind][locale] ?? DOCUMENTOS[kind][DEFAULT_LOCALE]!
}

/**
 * Idiomas que têm o documento de verdade, e não o português do fallback.
 *
 * O fallback acima é a decisão certa para quem ABRE a página — política em
 * outro idioma é melhor que política nenhuma. Mas é a decisão errada para o
 * buscador: submeter `/ar/terms` ao Google com hreflang `ar` anuncia texto
 * português como se fosse árabe, exatamente a duplicata que PUBLISHED_LOCALES
 * existe para evitar. Quem monta sitemap, hreflang e robots pergunta aqui.
 *
 * Derivado do mapa, não escrito à mão: no dia em que `terms.ar.ts` entrar em
 * DOCUMENTOS, a rota passa a ser indexável em árabe sozinha.
 */
export function legalLocales(kind: LegalKind): readonly Locale[] {
    return PUBLISHED_LOCALES.filter((locale) => DOCUMENTOS[kind][locale] !== undefined)
}

export type { LegalDocument, LegalKind, LegalSection, LegalBlock } from "./types"
