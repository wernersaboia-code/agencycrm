import { stripLocale } from "@/lib/i18n/strip-locale"

/**
 * Vocabulário único de moedas do marketplace.
 *
 * Preço é FIXO por moeda, cadastrado à mão — nunca convertido em runtime.
 * Um valor convertido na hora flutua entre a vitrine e o checkout, e a
 * diferença aparece no momento exato em que a pessoa decide pagar.
 */
export const SUPPORTED_CURRENCIES = ["EUR", "BRL", "USD"] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

/** EUR é o padrão e a única moeda obrigatória por lista. */
export const DEFAULT_CURRENCY: Currency = "EUR"

export const CURRENCY_COOKIE = "CURRENCY"

/**
 * Devolve `null` — não o padrão — para código não suportado. Quem chama decide
 * se aquilo é "cai no euro" (cookie corrompido, vitrine) ou "erro 400"
 * (checkout). Cair no padrão aqui dentro apagaria essa distinção.
 */
export function parseCurrency(value: string | null | undefined): Currency | null {
    if (!value) return null
    const upper = value.toUpperCase()
    return SUPPORTED_CURRENCIES.includes(upper as Currency) ? (upper as Currency) : null
}

const COUNTRY_CURRENCY: Record<string, Currency> = {
    BR: "BRL",
    US: "USD",
    CA: "USD",
}

const LOCALE_CURRENCY: Record<string, Currency> = {
    pt: "BRL",
    en: "USD",
}

/**
 * Palpite inicial, nunca uma decisão final: assim que a pessoa usa o seletor,
 * o cookie manda e esta função não é mais consultada.
 *
 * A geografia vem antes do idioma de propósito. O idioma sozinho erra os dois
 * casos reais do projeto — o alemão morando no Brasil e o brasileiro lendo a
 * página em inglês.
 */
export function guessCurrency(input: { country?: string | null; locale?: string | null }): Currency {
    const country = input.country?.toUpperCase()
    if (country) {
        return COUNTRY_CURRENCY[country] || DEFAULT_CURRENCY
    }

    const locale = input.locale?.toLowerCase()
    if (locale && LOCALE_CURRENCY[locale]) {
        return LOCALE_CURRENCY[locale]
    }

    return DEFAULT_CURRENCY
}

/**
 * Decide o que o proxy grava no cookie. `null` = não mexer.
 *
 * A geografia só é consultada UMA vez, aqui. As páginas leem o cookie e nada
 * mais: ler geografia dentro do render foi o que já tornou o funil inteiro
 * dinâmico neste projeto uma vez, e o custo não se paga de novo.
 */
export function decideCurrencyCookie(input: {
    existing: string | null
    country: string | null
    pathname: string
}): Currency | null {
    if (parseCurrency(input.existing)) return null

    // stripLocale devolve DEFAULT_LOCALE ("pt") quando o caminho não tem
    // prefixo de idioma — é por isso que "/catalog" resulta em BRL.
    const { locale } = stripLocale(input.pathname)

    return guessCurrency({ country: input.country, locale })
}
