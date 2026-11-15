// lib/marketplace/conteudo-preservado.ts
//
// Confere se o PDF novo de um estudo traz todo o conteúdo do PDF que ele
// substitui. A troca de capa é feita fora do sistema (o PDF é refeito e subido
// de novo no admin), e o risco não é a capa: é o miolo não ter sido copiado
// inteiro — uma página, uma tabela ou uma empresa do diretório que somem sem
// ninguém reparar, e o comprador recebe menos do que a ficha promete.
//
// Regras:
//
// 1. A primeira página do PDF antigo fica de fora, porque é a capa, e a capa
//    é justamente o que se quer mudar. Do PDF novo entra tudo: se a capa nova
//    tiver duas páginas, ou o miolo outra paginação, nada muda na conta.
// 2. A comparação é por palavra, contando repetições: quatro "GmbH" no antigo
//    não se cobrem com dois no novo. Uma empresa a menos no diretório some com
//    o nome dela e com uma ocorrência das palavras comuns da linha.
// 3. Tolerância zero. Troca só de capa, com o miolo copiado como está, dá zero
//    palavra faltando (conferido com um estudo real de 17 páginas). Os 1% do
//    script editorial (scripts/redesign-market-study.py) deixariam passar
//    sem aviso uma empresa a menos no diretório: num estudo de 8.550 palavras
//    ela é 0,05%. Quando o miolo é recomposto e a extração difere um pouco, o
//    admin vê os trechos e confirma — a confirmação fica no log de auditoria.
//
// Puro de propósito: o PDF é lido em pdf-conteudo.ts, e este arquivo é
// testado com texto, sem carregar pdf.js.

export const LIMITE_PERDA = 0

const MAX_TRECHOS = 30
const MAX_PALAVRAS = 40

export interface ComparacaoDeConteudo {
    aprovado: boolean
    paginasAntigas: number
    paginasNovas: number
    /** Palavras do miolo antigo, contando repetições. */
    totalPalavras: number
    palavrasFaltando: number
    /** De 0 a 1. */
    proporcaoFaltando: number
    /** Linhas do miolo antigo que não aparecem no novo e levaram palavra junto. */
    trechosFaltando: string[]
    /** Amostra das palavras que faltam, para quando o miolo foi recomposto e as linhas não batem. */
    palavrasExemplo: string[]
}

function palavras(texto: string): string[] {
    return texto.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
}

function contar(itens: string[]): Map<string, number> {
    const contagem = new Map<string, number>()
    for (const item of itens) contagem.set(item, (contagem.get(item) ?? 0) + 1)
    return contagem
}

function linhas(paginas: string[]): string[] {
    return paginas.flatMap((pagina) => pagina.split(/\r?\n/)).map((l) => l.trim()).filter(Boolean)
}

/**
 * Compara o texto, página a página, do PDF antigo com o do novo.
 * `paginasNovas` vazio (PDF ilegível ou só imagem) reprova: sem texto não há
 * como afirmar que o conteúdo está lá.
 */
export function compararConteudo(paginasAntigas: string[], paginasNovas: string[]): ComparacaoDeConteudo {
    const linhasMiolo = linhas(paginasAntigas.slice(1))
    const linhasNovas = linhas(paginasNovas)

    const antigas = contar(linhasMiolo.flatMap(palavras))
    const novas = contar(linhasNovas.flatMap(palavras))

    const faltando = new Map<string, number>()
    let totalPalavras = 0
    let palavrasFaltando = 0
    for (const [palavra, quantidade] of antigas) {
        totalPalavras += quantidade
        const falta = quantidade - (novas.get(palavra) ?? 0)
        if (falta > 0) {
            faltando.set(palavra, falta)
            palavrasFaltando += falta
        }
    }

    // Linha a linha (também com repetição), para mostrar ao admin O QUE sumiu
    // e não só quanto. Só entram linhas que levaram alguma palavra junto:
    // uma linha quebrada em outro ponto não é conteúdo perdido.
    const linhasDisponiveis = contar(linhasNovas.map((l) => palavras(l).join(" ")))
    const trechosFaltando: string[] = []
    for (const linha of linhasMiolo) {
        const chave = palavras(linha).join(" ")
        const disponivel = linhasDisponiveis.get(chave) ?? 0
        if (disponivel > 0) {
            linhasDisponiveis.set(chave, disponivel - 1)
            continue
        }
        if (trechosFaltando.length < MAX_TRECHOS && palavras(linha).some((p) => faltando.has(p))) {
            trechosFaltando.push(linha)
        }
    }

    const proporcaoFaltando = totalPalavras === 0 ? 0 : palavrasFaltando / totalPalavras

    return {
        aprovado: palavrasFaltando <= totalPalavras * LIMITE_PERDA,
        paginasAntigas: paginasAntigas.length,
        paginasNovas: paginasNovas.length,
        totalPalavras,
        palavrasFaltando,
        proporcaoFaltando,
        trechosFaltando,
        palavrasExemplo: [...faltando.keys()].slice(0, MAX_PALAVRAS),
    }
}
