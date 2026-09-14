"use client"

import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency, type Currency } from "./index"
import { PREFERENCE_COOKIE_MAX_AGE, writePreferenceCookie } from "@/lib/cookies/client"

/**
 * Lê a moeda ativa direto do cookie no navegador. Único ponto de leitura do
 * cookie `CURRENCY` no cliente — o seletor de moeda e o carrinho precisam
 * concordar sobre qual é a moeda ativa, então nenhum dos dois deve ter a sua
 * própria cópia desta função.
 */
export function readCurrencyCookie(): Currency {
    if (typeof document === "undefined") return DEFAULT_CURRENCY
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]+)`))
    return parseCurrency(match?.[1]) ?? DEFAULT_CURRENCY
}

/**
 * Grava a moeda ativa. Contraparte de readCurrencyCookie — as duas precisam
 * concordar sobre nome e formato do cookie, por isso moram juntas.
 */
export function writeCurrencyCookie(currency: Currency): void {
    writePreferenceCookie(CURRENCY_COOKIE, currency, PREFERENCE_COOKIE_MAX_AGE)
}
