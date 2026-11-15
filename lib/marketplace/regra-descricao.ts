// lib/marketplace/regra-descricao.ts
//
// Regra da descrição curta do estudo — o texto do cartão no catálogo e da meta
// description no Google. Uma ou duas frases, sem números, terminando em ponto,
// entre 165 e 222 caracteres (o que cabe no cartão e não é cortado no Google).
//
// Em 14.11.2026 foi preciso reescrever 48 descrições à mão: 38 eram o texto da
// capa do PDF colado ("Edition: October 2026", "Product scope: …") e 10 eram
// parágrafos de 300 a 450 caracteres com números. O formulário só AVISA — não
// bloqueia — porque a regra é editorial, e o admin pode ter motivo para fugir
// dela.
//
// A mesma faixa está em scripts/resumos/gravar-descricoes.mjs (script .mjs
// avulso, que não importa TypeScript). Mudou aqui, mude lá.

export const DESCRICAO_MINIMO = 165
export const DESCRICAO_MAXIMO = 222

export type ProblemaDaDescricao = "vazia" | "curta" | "longa" | "numero" | "semPonto" | "capa"

/**
 * Rótulos da capa dos PDFs, nos idiomas do corpus. Só com dois-pontos, para
 * "a new edition of the study" na prosa não disparar.
 */
const RODAPE_DE_CAPA = /\b(?:edition|edição|edición|ausgabe|édition|edizione|editie|language|idioma|sprache|product scope|produktumfang)\s*:/i

export function conferirDescricao(texto: string | null | undefined): ProblemaDaDescricao[] {
    const limpo = (texto ?? "").trim()
    if (!limpo) return ["vazia"]

    const problemas: ProblemaDaDescricao[] = []
    if (limpo.length < DESCRICAO_MINIMO) problemas.push("curta")
    if (limpo.length > DESCRICAO_MAXIMO) problemas.push("longa")
    if (/\d/.test(limpo)) problemas.push("numero")
    if (!/[.!?]$/.test(limpo)) problemas.push("semPonto")
    if (RODAPE_DE_CAPA.test(limpo)) problemas.push("capa")
    return problemas
}
