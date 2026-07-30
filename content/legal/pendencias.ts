/**
 * Lacunas que dependem do responsável ou de advogado.
 *
 * Seção pendente NÃO entra no documento — a página nunca mostra texto
 * inventado nem marcador esquecido. Esta lista existe para a lacuna ficar
 * rastreada em vez de virar esquecimento, no mesmo espírito do
 * LACUNAS_CONHECIDAS de lib/i18n/messages-integridade.test.ts.
 *
 * Tirar da lista somente quando o item for de fato resolvido e a seção
 * correspondente entrar nos sete idiomas.
 */
export const PENDENCIAS_ACEITAS = [
    "privacy.responsavel.enderecoPostal",
    "privacy.representanteUE",
    "privacy.baseLegal.listas",
    "terms.foroLei",
] as const

/** Ids de seção que, por estarem pendentes, não podem existir em documento. */
export const SECOES_PENDENTES: Record<string, readonly string[]> = {
    privacy: ["representanteUE"],
    terms: ["foroLei"],
}
