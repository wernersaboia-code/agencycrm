// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * O locale formata (separador de milhar, posição do símbolo); a moeda é só a
 * moeda. Quando o locale é informado explicitamente, ele manda — é o correto,
 * porque mostrar "R$ 1.234,56" com pontuação brasileira para um leitor alemão
 * lendo a página em alemão está errado.
 *
 * Quando `locale` NÃO é informado, caímos de volta em derivá-lo da moeda
 * (comportamento anterior a esta task). Isso é só uma ponte para as ~15
 * chamadas existentes que ainda passam moeda sem passar locale — elas serão
 * migradas nas Tasks 6, 7 e 11. Não é um padrão a imitar: código novo deve
 * sempre passar o locale explicitamente.
 */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  EUR: "de-DE",
  BRL: "pt-BR",
  USD: "en-US",
}

export function formatCurrency(
  value: number,
  currency: string = "EUR",
  locale?: string
): string {
  const resolvedLocale = locale ?? LOCALE_BY_CURRENCY[currency] ?? "en-US"
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: currency,
  }).format(value)
}
