"use client"

import { useSyncExternalStore } from "react"
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
 * Assinantes da troca de moeda.
 *
 * Antes isto não existia: quem exibia preço era Server Component, e o seletor
 * só precisava chamar router.refresh() para o servidor reler o cookie. Desde
 * que a ficha do estudo passou a ser estática (ISR, para o robô do Google não
 * pagar um render de origem por visita), não há mais servidor lendo cookie
 * naquela página — o preço é escolhido no cliente e precisa saber que a moeda
 * mudou.
 */
const assinantes = new Set<() => void>()

function subscribeCurrency(onChange: () => void): () => void {
    assinantes.add(onChange)
    return () => {
        assinantes.delete(onChange)
    }
}

/**
 * Grava a moeda ativa. Contraparte de readCurrencyCookie — as duas precisam
 * concordar sobre nome e formato do cookie, por isso moram juntas.
 */
export function writeCurrencyCookie(currency: Currency): void {
    writePreferenceCookie(CURRENCY_COOKIE, currency, PREFERENCE_COOKIE_MAX_AGE)
    for (const avisar of assinantes) avisar()
}

/**
 * Moeda ativa, reagindo à troca no seletor.
 *
 * `getServerSnapshot` devolve o euro: é o que o HTML pré-renderizado carrega,
 * e é também o que qualquer visitante sem cookie vê. O cliente monta com o
 * valor real logo depois, sem divergência de hidratação — mesmo contrato que
 * o seletor de moeda já usava, agora compartilhado para os dois não terem
 * cópias diferentes da mesma leitura.
 */
export function useActiveCurrency(): Currency {
    return useSyncExternalStore(subscribeCurrency, readCurrencyCookie, () => DEFAULT_CURRENCY)
}
