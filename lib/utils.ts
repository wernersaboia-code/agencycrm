// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * O locale formata (separador de milhar, posição do símbolo); a moeda é só a
 * moeda. Derivar o locale da moeda, como era antes, mostrava "R$ 1.234,56" com
 * pontuação brasileira para um leitor alemão lendo a página em alemão.
 */
export function formatCurrency(
  value: number,
  currency: string = "EUR",
  locale: string = "de-DE"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value)
}