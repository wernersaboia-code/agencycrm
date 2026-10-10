// lib/marketplace/texto-colado.ts

/**
 * Limpeza dos textos de lista colados de um estudo em PDF: a introdução e a
 * descrição — as duas são TEXTO PURO copiado do documento.
 *
 * O problema que isto resolve: um PDF não tem "linhas", tem posicionamento. Ao
 * copiar o texto de um estudo, cada linha VISUAL do documento entra no campo
 * como uma quebra de linha de verdade. A página da lista monta parágrafos (os
 * textos escritos à mão usam a linha em branco como separador), então cada
 * quebra da colagem vira uma quebra na tela: frase cortada no meio, linha órfã,
 * composto partido ("EU-" numa linha e "based" na outra) e — o pior — nenhum
 * parágrafo em 5.000 caracteres.
 *
 * Daí a "formatação horrível e aleatória": o resultado depende de onde o PDF
 * quebrou cada linha, não do texto. Duas introduções idênticas em conteúdo saem
 * diferentes se uma veio com as quebras do PDF e a outra sem.
 *
 * A limpeza junta de volta o que é o MESMO parágrafo e preserva o que é
 * intenção: linha em branco entre parágrafos, item de lista e título de seção
 * do estudo.
 *
 * Ela é idempotente de propósito — texto já limpo, passado de novo, sai igual.
 * É isso que permite rodá-la na colagem, na gravação e na renderização sem
 * risco de acumular efeito.
 */

/**
 * Marcador que abre um item de lista. A quebra antes dele é intenção do autor,
 * não layout — então ele começa parágrafo.
 *
 * Travessão e hífen ficam de fora de propósito: no fim da linha eles são o
 * intervalo partido no meio ("50,000–" / "70,000") ou o composto partido
 * ("EU-" / "based"), e tratá-los como marcador quebraria o texto em dois.
 */
const INICIO_DE_ITEM = /^[•·▪‣◦∙*]\s+\S/

/**
 * Título de seção numerado do estudo ("1. Executive Summary", "2.1 Demographic
 * base"). Exige maiúscula depois do número: linha de texto corrido que começa
 * por número ("3.5 million tonnes", "10.25 million tourist arrivals") não casa
 * — e é justamente isso que impede a limpeza de partir uma frase no meio.
 */
const TITULO_NUMERADO = /^\d+(?:\.\d+)*[.)]?\s+[A-ZÀ-ÖØ-Þ]/

/**
 * Títulos de seção sem número. Valem só na PRIMEIRA linha do bloco, que é onde
 * o PDF os coloca: no meio de um parágrafo, uma linha que começa por
 * "Summary..." é continuação de frase, não título.
 */
const TITULO_CONHECIDO = /^(?:executive\s+summary|table\s+of\s+contents|introduction|summary|contents|methodology|sources)\b/i

/** Linha de sumário com pontilhado de preenchimento ("1. Executive Summary....3"). */
const LINHA_DE_SUMARIO = /\.{4,}/

/** Título é rótulo, não texto: nunca é longo. */
const LIMITE_DE_TITULO = 90

/** Título sem número é ainda mais curto. */
const LIMITE_DE_TITULO_SEM_NUMERO = 60

function ehTituloDeSecao(linha: string, primeiraDoBloco: boolean): boolean {
    if (linha.length <= LIMITE_DE_TITULO && TITULO_NUMERADO.test(linha)) return true
    if (!primeiraDoBloco || linha.length > LIMITE_DE_TITULO_SEM_NUMERO) return false

    // "2. What Is FMCG?" é título e termina em interrogação; por isso a
    // pontuação final só desqualifica o título SEM número.
    return TITULO_CONHECIDO.test(linha) && !/[.!?,;:]$/.test(linha)
}

/**
 * Junta duas linhas que são o mesmo parágrafo.
 *
 * Hífen no fim da linha é hífen do texto, não hifenização de layout: as 20
 * ocorrências medidas nas introduções do banco são compostos de verdade
 * ("EU-based", "e-mail", "well-designed", "bright-yellow", "route-to-market").
 * Por isso o hífen FICA e o espaço não entra. O mesmo vale para o travessão de
 * intervalo partido no fim da linha ("50,000–" + "70,000" = "50,000–70,000").
 */
function juntarLinhas(atual: string, proxima: string): string {
    const ultimo = atual.slice(-1)

    if (ultimo === "-" || ultimo === "–" || ultimo === "—" || ultimo === "−") {
        return atual + proxima
    }

    return `${atual} ${proxima}`
}

/**
 * Devolve o texto limpo, com um parágrafo por linha e os parágrafos separados
 * por linha em branco (`\n\n`) — o mesmo formato dos textos escritos à mão.
 */
export function normalizarTextoColado(texto: string | null | undefined): string {
    if (!texto) return ""

    const limpo = texto
        // Acento decomposto pelo PDF ("a" + trema combinante) volta a ser um
        // caractere só, para não quebrar comparação nem busca.
        .normalize("NFC")
        .replace(/\r\n?/g, "\n")
        // Separadores de linha Unicode: o navegador não os trata como quebra
        // no `whitespace-pre-line`, então aqui viram quebra de verdade.
        .replace(/[\u2028\u2029]/g, "\n")
        // Invisíveis da extração de PDF: hífen condicional e largura zero.
        .replace(/[\u00ad\u200b-\u200d\ufeff]/g, "")
        // Marcador de lista da fonte Symbol (uso privado, como o Word o grava):
        // vira o marcador comum para abrir item como os outros.
        .replace(/\uf0b7/g, "\u2022")
        // Espaço "duro", espaço de tabulação e afins voltam a ser espaço comum.
        .replace(/[\t\u00a0\u2007\u202f]/g, " ")
        .replace(/ {2,}/g, " ")
        .replace(/ +\n/g, "\n")

    const paragrafos: string[] = []

    for (const bloco of limpo.split(/\n{2,}/)) {
        const linhas = bloco
            .split("\n")
            .map((linha) => linha.trim())
            .filter(Boolean)

        let atual = ""
        // A linha anterior exige que a próxima comece um parágrafo novo. Item
        // de lista NÃO entra aqui: o texto do item continua nas linhas
        // seguintes e só o PRÓXIMO marcador abre item novo.
        let corta = false

        linhas.forEach((linha, indice) => {
            const titulo = ehTituloDeSecao(linha, indice === 0)
            const sumario = LINHA_DE_SUMARIO.test(linha)
            const abre = titulo || sumario || INICIO_DE_ITEM.test(linha)

            if (atual && (corta || abre)) {
                paragrafos.push(atual)
                atual = linha
            } else {
                atual = atual ? juntarLinhas(atual, linha) : linha
            }

            corta = titulo || sumario
        })

        if (atual) paragrafos.push(atual)
    }

    return paragrafos.join("\n\n")
}

/**
 * Parágrafos da introdução prontos para a tela, na ordem.
 *
 * Normaliza na LEITURA de propósito: as introduções gravadas antes desta
 * limpeza continuam no banco com as quebras do PDF até o backfill rodar (ver
 * prisma/limpar-textos-colados.ts), e a página não pode depender disso para
 * ficar legível.
 */
export function paragrafosDaIntroducao(introducao: string | null | undefined): string[] {
    const normalizada = normalizarTextoColado(introducao)
    return normalizada ? normalizada.split("\n\n") : []
}
