// lib/marketplace/resumo-do-estudo.ts

/**
 * Isola o RESUMO EXECUTIVO (a primeira seção) do texto de um estudo de mercado.
 *
 * Por que não basta ler o texto corrido: a introdução de cada lista é o resumo
 * do estudo, e copiar isso à mão — estudo por estudo — é o que enchia o campo
 * com as quebras de linha do PDF (ver texto-colado.ts). Aqui a extração usa a
 * GEOMETRIA da página, que o pdf.js entrega junto do texto:
 *
 * - linhas de corpo do mesmo parágrafo ficam a ~14 pt uma da outra; o primeiro
 *   parágrafo novo vem depois de um vão maior (~20 pt);
 * - título de seção vem em corpo maior (~15 pt) contra ~10,5 pt do texto.
 *
 * A leitura por posição é o que torna o resultado confiável nos 118 estudos, que
 * seguem o mesmo modelo de documento. A leitura por expressão regular sozinha
 * quebra no primeiro estudo fora do padrão — e foi o que aconteceu com os
 * sumários sem pontilhado.
 *
 * Este módulo é PURO de propósito: recebe linhas já medidas e não conhece o
 * pdf.js. Quem fala com o PDF é pdf-do-estudo.ts, e é por isso que o teste daqui
 * não precisa carregar pdf.js — mesmo arranjo de pdf-contatos.ts.
 */

/** Item de texto como o pdf.js devolve: string + posição + corpo da fonte. */
export interface ItemDeTexto {
    texto: string
    /** Corpo da fonte em pontos (o `height` do pdf.js). */
    altura: number
    /** Coordenada vertical (o `transform[5]` do pdf.js): cresce para cima. */
    y: number
}

/** Uma linha visual da página, com o que a extração precisa saber sobre ela. */
export interface LinhaDoEstudo {
    texto: string
    altura: number
    /** Distância vertical até a linha anterior DA MESMA PÁGINA (0 na primeira). */
    espacoAcima: number
    /** Página de origem, começando em 1. */
    pagina: number
}

/** Rodapé numerado, com ou sem o título do estudo antes: "… | Page 3" ou "Page 3". */
const RODAPE_DE_PAGINA = /(?:^|\|)\s*Page\s+\d+\s*$/i

/** Entrada de índice com o pontilhado que liga o título ao número da página. */
const PONTILHADO = /\.{4,}/

/** Título do índice. */
const TITULO_DE_SUMARIO = /^(?:table\s+of\s+contents|contents|sum[áa]rio|[íi]ndice)\s*$/i

/**
 * Linha com cara de entrada de índice: título numerado ("3.1 Size of the
 * market") ou título terminando no número da página ("1. Definition 4").
 */
const LINHA_DE_INDICE = /^(?:\d+(?:\.\d+)*[.)]?\s+\S|[^\n]{3,90}\s\d{1,3}$)/

/**
 * Título de seção de primeiro nível: "1. Executive Summary" e também
 * "1 Executive summary", que é como um dos estudos escreve. "2.1 …" não casa —
 * o subnível tem ponto e dígito, não espaço.
 */
const TITULO_DE_NIVEL_1 = /^(\d+)[.)]?\s+\S/

/** Número de seção é pequeno; "2026 is an extraordinary year" não é seção. */
const MAXIMO_DE_NUMERO_DE_SECAO = 99

/** Estudo sem numeração de seções: o resumo é identificado pelo nome. */
const RESUMO_SEM_NUMERO = /^executive\s+summary\s*$/i

/** Item de lista: começa parágrafo, como no texto colado à mão. */
const INICIO_DE_ITEM = /^[•·▪‣◦∙*]\s+\S/

/**
 * Sequência mínima de linhas com cara de índice para tratá-las como índice.
 *
 * É a defesa contra o sumário sem pontilhado: no texto corrido não existem três
 * linhas seguidas de título numerado, mas num índice existem dezenas.
 */
const MINIMO_DE_ENTRADAS_DE_INDICE = 3

/** Dentro da sequência, pelo menos duas entradas numeradas: tabela não é índice. */
const MINIMO_DE_ENTRADAS_NUMERADAS = 2

/** Um vão deste tamanho maior que o normal já separa parágrafos. */
const FATOR_DE_PARAGRAFO = 1.3

/** Linha final de parágrafo ocupa menos que isto da largura típica da coluna. */
const FATOR_DE_LINHA_CURTA = 0.8

/**
 * Abaixo desta fração do corpo do documento a linha é tabela, nota de rodapé ou
 * legenda — não é o texto do resumo.
 *
 * O resumo de alguns estudos termina com uma tabela "de relance", e achatada em
 * texto corrido ela vira uma sequência de rótulos soltos ("Segment Product
 * groups Food and beverages Ambient groceries…"), que na introdução da página
 * não diz nada.
 */
const FATOR_DE_CORPO_MINIMO = 0.92

/** A partir deste comprimento a linha é prosa, não célula de tabela. */
const LIMITE_DE_LINHA_DE_PROSA = 90

/** Mobília de página: assinatura que se repete nesta fração das páginas. */
const FATOR_DE_REPETICAO = 0.3

/** E no mínimo nestas páginas, para uma frase repetida duas vezes não contar. */
const MINIMO_DE_PAGINAS_REPETIDAS = 3

/**
 * Costura os pedaços de texto de uma linha.
 *
 * O pdf.js quebra a linha em pedaços e cada pedaço costuma carregar o próprio
 * espaço; inserir espaço entre TODOS eles separaria palavra hifenizada partida
 * em dois pedaços ("produc-" + "tion"). A regra insere espaço só quando os dois
 * lados não pedem cola.
 */
function costurar(partes: readonly string[]): string {
    let texto = ""

    for (const parte of partes) {
        if (!texto) {
            texto = parte
            continue
        }

        const cola =
            /\s$/.test(texto) ||
            /^[\s.,;:!?%)\]}»”]/.test(parte) ||
            /[(\[{«“]$/.test(texto) ||
            /-$/.test(texto)

        texto += cola ? parte : ` ${parte}`
    }

    // U+F0B7 é o marcador de lista da fonte Symbol, como o Word o grava no PDF.
    // Sem a troca ele não é reconhecido como item e a lista vira um parágrafo só.
    return texto.replace(//g, "•").replace(/\s+/g, " ").trim()
}

/**
 * Reagrupa os itens do pdf.js em linhas visuais.
 *
 * Itens com a mesma coordenada vertical são a mesma linha — é assim que o
 * "2.1 Demographic base" deixa de virar duas linhas.
 */
export function montarLinhas(paginas: readonly (readonly ItemDeTexto[])[]): LinhaDoEstudo[] {
    const linhas: LinhaDoEstudo[] = []

    paginas.forEach((itens, indice) => {
        const porY = new Map<number, { y: number; altura: number; partes: string[] }>()

        for (const item of itens) {
            if (!item.texto.trim()) continue

            // Meio ponto de tolerância: o pdf.js varia a coordenada da mesma
            // linha em centésimos por causa do arredondamento da matriz.
            const y = Math.round(item.y * 2) / 2
            const atual = porY.get(y) ?? { y, altura: 0, partes: [] }
            atual.partes.push(item.texto)
            atual.altura = Math.max(atual.altura, item.altura)
            porY.set(y, atual)
        }

        const daPagina = [...porY.values()].sort((a, b) => b.y - a.y)
        let yAnterior: number | null = null

        for (const linha of daPagina) {
            linhas.push({
                texto: costurar(linha.partes),
                altura: linha.altura,
                espacoAcima: yAnterior === null ? 0 : Math.round((yAnterior - linha.y) * 10) / 10,
                pagina: indice + 1,
            })
            yAnterior = linha.y
        }
    })

    return linhas.filter((linha) => linha.texto.length > 0)
}

/** Assinatura para comparar linhas ignorando o número da página. */
function assinatura(texto: string): string {
    return texto
        .toLowerCase()
        .replace(/\d+/g, "#")
        .replace(/[^a-z#%]+/g, " ")
        .trim()
}

function mediana(valores: readonly number[]): number {
    if (valores.length === 0) return 0
    const ordenados = [...valores].sort((a, b) => a - b)
    return ordenados[Math.floor(ordenados.length / 2)]
}

/**
 * Cabeçalho e rodapé que se repetem página a página.
 *
 * O modelo repete o título do estudo no alto de cada página e o rodapé embaixo;
 * ambos caem no meio do texto extraído. A assinatura ignora os dígitos, então
 * "… | Page 3" e "… | Page 4" são a MESMA linha repetida.
 */
function indicesDeMoveisDePagina(linhas: readonly LinhaDoEstudo[]): Set<number> {
    const paginasPorAssinatura = new Map<string, Set<number>>()

    linhas.forEach((linha) => {
        const chave = assinatura(linha.texto)
        if (chave.length < 8) return

        const paginas = paginasPorAssinatura.get(chave) ?? new Set<number>()
        paginas.add(linha.pagina)
        paginasPorAssinatura.set(chave, paginas)
    })

    const totalDePaginas = new Set(linhas.map((linha) => linha.pagina)).size
    const repetidas = new Set<string>()

    for (const [chave, paginas] of paginasPorAssinatura) {
        if (paginas.size >= MINIMO_DE_PAGINAS_REPETIDAS && paginas.size >= totalDePaginas * FATOR_DE_REPETICAO) {
            repetidas.add(chave)
        }
    }

    const marcadas = new Set<number>()
    linhas.forEach((linha, indice) => {
        if (repetidas.has(assinatura(linha.texto))) marcadas.add(indice)
    })

    return marcadas
}

/**
 * Índice do estudo: o título do sumário, as sequências de entradas e o
 * pontilhado solto. O sumário lista os títulos das seções, então sem descartá-lo
 * a extração começaria numa linha de índice em vez do texto.
 */
function indicesDeSumario(linhas: readonly LinhaDoEstudo[]): Set<number> {
    const marcadas = new Set<number>()

    let i = 0
    while (i < linhas.length) {
        if (!LINHA_DE_INDICE.test(linhas[i].texto)) {
            i++
            continue
        }

        // A sequência NÃO atravessa página: o índice tem páginas próprias e o
        // título verdadeiro da primeira seção abre a página seguinte. Sem esta
        // parada, o título real entrava na sequência do índice e era descartado
        // junto com ela — a extração então começava na seção 2.
        const pagina = linhas[i].pagina
        let fim = i
        let numeradas = 0
        while (fim < linhas.length && linhas[fim].pagina === pagina && LINHA_DE_INDICE.test(linhas[fim].texto)) {
            if (TITULO_DE_NIVEL_1.test(linhas[fim].texto)) numeradas++
            fim++
        }

        if (fim - i >= MINIMO_DE_ENTRADAS_DE_INDICE && numeradas >= MINIMO_DE_ENTRADAS_NUMERADAS) {
            for (let k = i; k < fim; k++) marcadas.add(k)
        }

        i = fim
    }

    linhas.forEach((linha, indice) => {
        if (TITULO_DE_SUMARIO.test(linha.texto) || PONTILHADO.test(linha.texto)) marcadas.add(indice)
    })

    // Página que TEM um título de índice é página de índice inteira. Nem toda
    // entrada casa com `LINHA_DE_INDICE` — "6A–6E Channels by type", "Sources &
    // notes" —, e uma entrada solta que sobrevive vira o começo da extração: foi
    // assim que um estudo devolveu 25 mil caracteres em vez do resumo.
    const paginasDeIndice = new Set(
        linhas.filter((linha) => TITULO_DE_SUMARIO.test(linha.texto)).map((linha) => linha.pagina)
    )
    linhas.forEach((linha, indice) => {
        if (paginasDeIndice.has(linha.pagina)) marcadas.add(indice)
    })

    return marcadas
}

/**
 * Linhas que pertencem ao TEXTO do estudo: fora a mobília de página, fora o
 * índice, fora o rodapé numerado.
 *
 * Exportada porque é aqui que mora o julgamento mais delicado da extração — e
 * por isso o alvo mais direto dos testes.
 */
export function linhasDeTexto(linhas: readonly LinhaDoEstudo[]): LinhaDoEstudo[] {
    const moveis = indicesDeMoveisDePagina(linhas)
    const sumario = indicesDeSumario(linhas)

    return linhas.filter(
        (linha, indice) =>
            !moveis.has(indice) && !sumario.has(indice) && !RODAPE_DE_PAGINA.test(linha.texto)
    )
}

/** Mediana das alturas — o corpo do texto, resistente a um título fora de série. */
function alturaDoCorpo(linhas: readonly LinhaDoEstudo[]): number {
    return mediana(linhas.map((linha) => linha.altura))
}

/**
 * Corpo do texto do documento.
 *
 * Só linhas de PROSA contam: nos estudos com diretório, a maioria das linhas é
 * linha de tabela em corpo menor, e a altura mais comum do documento passa a ser
 * a da tabela — foi assim que a primeira tentativa não descartou tabela nenhuma.
 * Linha longa não é célula de tabela.
 */
function alturaDoCorpoDoDocumento(linhas: readonly LinhaDoEstudo[]): number {
    const prosa = linhas.filter((linha) => linha.texto.length >= LIMITE_DE_LINHA_DE_PROSA)
    return alturaMaisComum(prosa.length > 0 ? prosa : linhas)
}

/**
 * Corpo do texto pela altura MAIS COMUM.
 *
 * A mediana serve para medir o texto de um trecho, mas para dizer "esta linha é
 * um título" o que vale é a altura da maioria das linhas: num estudo com muitos
 * subtítulos a mediana sobe e nenhum título pareceria título.
 */
function alturaMaisComum(linhas: readonly LinhaDoEstudo[]): number {
    const contagem = new Map<number, number>()

    for (const linha of linhas) {
        const altura = Math.round(linha.altura * 2) / 2
        contagem.set(altura, (contagem.get(altura) ?? 0) + 1)
    }

    let escolhida = 0
    let maior = 0
    for (const [altura, vezes] of contagem) {
        // Empate desempata pela MENOR altura: o corpo é o texto miúdo; título
        // costuma ser a exceção, não a maioria.
        if (vezes > maior || (vezes === maior && escolhida > 0 && altura < escolhida)) {
            maior = vezes
            escolhida = altura
        }
    }

    return escolhida
}

/** Vão típico entre duas linhas do mesmo parágrafo. */
function espacoTipico(linhas: readonly LinhaDoEstudo[]): number {
    return mediana(linhas.map((linha) => linha.espacoAcima).filter((vao) => vao > 0))
}

function numeroDoTitulo(texto: string): number | null {
    const casamento = TITULO_DE_NIVEL_1.exec(texto)
    return casamento ? Number(casamento[1]) : null
}

/**
 * Devolve o resumo executivo como texto com uma linha visual por linha e uma
 * linha em branco entre parágrafos — o mesmo formato que a limpeza de colagem
 * espera (é ela que junta as linhas de cada parágrafo).
 *
 * `null` quando o estudo não tem uma primeira seção identificável: melhor não
 * mexer na introdução do que gravar um recorte errado.
 */
export function extrairResumoExecutivo(linhas: readonly LinhaDoEstudo[]): string | null {
    const texto = linhasDeTexto(linhas)
    if (texto.length === 0) return null

    const corpoDoDocumento = alturaDoCorpoDoDocumento(texto)

    // A primeira seção é o primeiro título de nível 1. A linha precisa TER CORPO
    // de título: no meio do texto, uma linha que começa por número ("3.5 million
    // tonnes…", "2026 is an extraordinary year…") não pode ser confundida com a
    // abertura do resumo.
    const inicio = texto.findIndex((linha) => {
        if (RESUMO_SEM_NUMERO.test(linha.texto)) return true

        const numero = numeroDoTitulo(linha.texto)
        if (numero === null || numero > MAXIMO_DE_NUMERO_DE_SECAO) return false
        return corpoDoDocumento === 0 || linha.altura > corpoDoDocumento * 1.15
    })
    if (inicio === -1) return null

    const numeroInicial = numeroDoTitulo(texto[inicio].texto) ?? 0
    const alturaDoTitulo = texto[inicio].altura
    const corpo = alturaDoCorpo(texto)

    // A seção termina no PRÓXIMO título de nível 1 depois dela. O número tem de
    // ser maior que o inicial e a linha tem de estar em corpo de título: um item
    // numerado dentro do texto ("2. …") não pode cortar o resumo no meio.
    let fim = texto.length
    for (let i = inicio + 1; i < texto.length; i++) {
        const numero = numeroDoTitulo(texto[i].texto)
        if (numero === null || numero <= numeroInicial) continue

        const ehTitulo = alturaDoTitulo > 0 ? texto[i].altura >= alturaDoTitulo - 0.5 : texto[i].altura > corpo
        if (ehTitulo) {
            fim = i
            break
        }
    }

    const corpoDaSecao = texto
        .slice(inicio + 1, fim)
        .filter((linha) => corpoDoDocumento === 0 || linha.altura >= corpoDoDocumento * FATOR_DE_CORPO_MINIMO)
    if (corpoDaSecao.length === 0) return null

    // O vão entre parágrafos é medido DENTRO do trecho: o limiar de uma seção
    // não vale para outra, e a mediana do documento inteiro é puxada pelos
    // títulos e pelas tabelas.
    const tipico = espacoTipico(corpoDaSecao)
    const limiar = tipico * FATOR_DE_PARAGRAFO
    const alturaDoTexto = alturaDoCorpo(corpoDaSecao)
    // A linha mais longa do trecho é a largura da coluna: é o melhor sinal de
    // "esta linha ia cheia". A mediana não serve — um parágrafo curto puxa a
    // mediana para baixo e nenhuma linha pareceria curta.
    const larguraDaColuna = Math.max(...corpoDaSecao.map((linha) => linha.texto.length))

    const blocos: string[][] = [[]]

    for (const [indice, linha] of corpoDaSecao.entries()) {
        const anterior = corpoDaSecao[indice - 1]
        const ehTitulo = linha.altura > alturaDoTexto * 1.15
        const anteriorEhTitulo = anterior !== undefined && anterior.altura > alturaDoTexto * 1.15

        // O primeiro parágrafo de uma página nova não tem vão medido (o
        // `espacoAcima` é 0). A pista é a linha anterior da página anterior: se
        // ela terminou curta, o parágrafo tinha acabado ali.
        const quebraDePagina = linha.espacoAcima === 0 && indice > 0
        const anteriorCurta = (anterior?.texto.length ?? 0) < larguraDaColuna * FATOR_DE_LINHA_CURTA

        const novoBloco =
            indice === 0 ||
            linha.espacoAcima > limiar ||
            (quebraDePagina && anteriorCurta) ||
            INICIO_DE_ITEM.test(linha.texto) ||
            ehTitulo ||
            anteriorEhTitulo

        if (novoBloco && blocos[blocos.length - 1].length > 0) blocos.push([])
        blocos[blocos.length - 1].push(linha.texto)
    }

    const paragrafos = blocos.filter((bloco) => bloco.length > 0).map((bloco) => bloco.join("\n"))

    return paragrafos.length > 0 ? paragrafos.join("\n\n") : null
}
