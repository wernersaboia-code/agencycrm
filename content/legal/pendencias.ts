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
    /**
     * Continua na lista, mas mudou de natureza: a política já publica cidade,
     * estado e país do responsável (2026-08-23), o que identifica jurisdição
     * e satisfaz a checagem de identidade das plataformas de pagamento. O
     * logradouro fica de fora por decisão do Werner — é residência de pessoa
     * física, e o endereço completo foi entregue ao Paddle no cadastro, que é
     * privado. Só sai daqui se um advogado disser que a venda para a UE exige
     * endereço completo público.
     */
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
