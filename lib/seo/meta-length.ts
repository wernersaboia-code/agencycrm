/**
 * Limites de comprimento da metadata que aparece no resultado de busca.
 *
 * Não são regras do Google — ele corta por largura em pixels, não por número
 * de caracteres, e o ponto exato varia com a fonte e o dispositivo. São o
 * limite prático usado no projeto para que o texto chegue inteiro ao leitor na
 * maioria dos casos, em vez de terminar em reticências.
 *
 * O título soma o sufixo da marca antes de ser medido: o `<title>` que sai na
 * página é "<título da página> | Easy Prospect", então é esse conjunto que
 * precisa caber.
 */
export const TITLE_SUFFIX = " | Easy Prospect"
export const MAX_TITLE = 60
export const MAX_DESCRIPTION = 155

export function tituloCabeNaSerp(titulo: string): boolean {
    return (titulo + TITLE_SUFFIX).length <= MAX_TITLE
}

export function descricaoCabeNaSerp(descricao: string): boolean {
    return descricao.length <= MAX_DESCRIPTION
}

/**
 * Quantos caracteres sobram para o título de uma página, já descontado o
 * sufixo da marca. Usado pelos scripts que escrevem os títulos dos estudos.
 */
export const MAX_TITULO_PROPRIO = MAX_TITLE - TITLE_SUFFIX.length
