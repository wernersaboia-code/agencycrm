// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = "EUR"): string {
  const locales: Record<string, string> = {
    EUR: "de-DE",
    BRL: "pt-BR",
    USD: "en-US",
  }

  return new Intl.NumberFormat(locales[currency] || "en-US", {
    style: "currency",
    currency: currency,
  }).format(value)
}