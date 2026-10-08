// lib/i18n/idiomas-do-painel.ts

/**
 * Idiomas em que o painel admin existe por inteiro. es, fr, it e nl ficam de
 * fora de propósito (ver LACUNAS_CONHECIDAS em messages-integridade.test.ts).
 */
export const IDIOMAS_DO_PAINEL = ["pt", "de", "en"] as const
export type IdiomaDoPainel = (typeof IDIOMAS_DO_PAINEL)[number]
