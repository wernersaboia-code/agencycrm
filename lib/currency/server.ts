import { cookies } from "next/headers"
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency, type Currency } from "./index"

/**
 * Moeda ativa da requisição. Cookie inválido ou ausente cai no euro — na
 * vitrine, cair no padrão é o comportamento certo (ver parseCurrency, que
 * devolve null justamente para deixar essa escolha a quem chama).
 */
export async function getActiveCurrency(): Promise<Currency> {
    const cookie = (await cookies()).get(CURRENCY_COOKIE)?.value
    return parseCurrency(cookie) ?? DEFAULT_CURRENCY
}
