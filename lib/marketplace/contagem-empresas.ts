// lib/marketplace/contagem-empresas.ts
//
// Estimativa de quantas empresas o diretório de um estudo lista. Só para o
// admin: serve para calibrar preço (um estudo de Luxemburgo com 20 empresas
// não vale o mesmo que um alemão com 50), nunca aparece no site.
//
// É ESTIMATIVA, e o painel mostra como tal ("≈ 25"). Os estudos não têm um
// formato único — uns trazem blocos "Address / Contact", outros tabelas
// "Company / Profile / Contact" — e nenhum rótulo existe em todos. O que todos
// têm é o site ou o e-mail de cada empresa, então a conta é de DOMÍNIOS
// DISTINTOS dentro da seção do diretório. Erros conhecidos, medidos no corpus:
// - empresa sem site nem e-mail publicado não conta (subestima);
// - a mesma empresa com sites em países diferentes conta uma vez só, porque o
//   agrupamento é pelo nome antes do TLD (dangaard.com + dangaard.dk = 1);
// - duas marcas do mesmo grupo com nomes diferentes contam duas vezes.
// O admin pode substituir pelo número conferido à mão.
//
// Pura de propósito, como resumo-do-estudo.ts: recebe linhas de texto, sem
// pdf.js. A leitura do PDF fica em pdf-do-estudo.ts.

/** Capítulo numerado de primeiro nível: "8. Directory of FMCG importers". */
const CAPITULO = /^\s*(\d{1,2})\.\s+(\S.{3,160})$/

/** Linha de sumário: título seguido de pontinhos até o número da página. */
const LINHA_DE_SUMARIO = /\.{4,}/

/**
 * Títulos do capítulo de diretório no corpus: "Directory of Importers and
 * Distribution Partners", "Importer & distributor directory", "Contact and
 * Reference List" (Frutas Exóticas, também em pt e es), "Key importers,
 * traders and distributors" (Enxofre).
 */
const TITULO_DE_DIRETORIO =
    /director|verzeichnis|directorio|diret[oó]rio|contact and reference list|lista de conta(?:c)?tos|key importers,? traders|importers?,? traders and distributors/i

/**
 * Capítulos que só FALAM do diretório e vêm depois dele: "10. How to read the
 * directory", "10. How to Approach the Companies in the Directory", e itens de
 * lista numerada ("1. Match the partner … use the directory to shortlist").
 * Sem isto, a "última ocorrência" caía num deles e a conta dava zero.
 */
const SO_MENCIONA_DIRETORIO = /\b(how to|read|using|use|shortlist|match|approach)\b/i

// Só a parte depois do "@": o pdf.js às vezes quebra o e-mail em duas linhas
// ("serdar.tansug" / "@yayla.de"), e o domínio é o que identifica a empresa.
const EMAIL = /@((?:[a-z0-9-]+\.)+[a-z]{2,6})\b/gi

// Domínio solto (www.x.de, https://x.de, ou só "asko.no" depois de "Web:").
// Não pode vir colado a "@" nem a letra, e não pode seguir "@" (local part de
// e-mail quebrado em duas linhas: "serdar.tansug" + "@empresa.com").
const DOMINIO = /(?<![@\w.-])(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,6})(?![\w@-])/gi

/**
 * TLDs aceitos. Sem esta lista, "serdar.tansug" ou "e.g" passariam por
 * domínio. São os que aparecem no corpus mais os genéricos comuns.
 */
const TLDS = new Set(
    (
        "com net org info biz eu co io shop store online group global trade " +
        "de at ch li lu be nl fr it es pt ie uk gb dk se no fi is ee lv lt pl cz sk hu si hr ba rs me mk al bg ro gr cy mt tr " +
        "ua md by ru ge am az " +
        "us ca mx br ar cl uy py bo pe ec co ve " +
        "za ng ke ma tn dz eg mu " +
        "ae sa qa kw bh om jo lb il " +
        "in pk bd lk cn hk tw jp kr sg my th vn ph id au nz"
    ).split(" ")
)

/** Segundo nível de domínios de país: "x.co.uk", "x.com.tr", "x.com.br". */
const SEGUNDO_NIVEL = new Set(["co", "com", "org", "net", "gov", "ac", "or", "ne", "gob", "gv", "edu"])

/**
 * Domínios que aparecem no diretório mas não são empresas do diretório:
 * portais de busca de empresas citados como fonte, redes sociais, associações.
 * Comparados pelo nome antes do TLD, então "europages" cobre .fr, .de, .com.
 */
const NAO_EMPRESA = new Set([
    "europages", "kompass", "editus", "paperjam", "linkedin", "facebook", "instagram", "twitter",
    "youtube", "google", "wikipedia", "xing", "northdata", "dnb", "zoominfo", "crunchbase",
    "gs1", "eur-lex", "europa", "trade", "gov", "statista",
])

/** Nome que identifica a empresa: "dangaard" para dangaard.com e dangaard.dk. */
function nomeDaEmpresa(dominio: string): string | null {
    const partes = dominio.toLowerCase().replace(/\.$/, "").split(".")
    const tld = partes.at(-1)!
    if (!TLDS.has(tld) || partes.length < 2) return null

    const temSegundoNivel = partes.length >= 3 && SEGUNDO_NIVEL.has(partes.at(-2)!)
    const nome = temSegundoNivel ? partes.at(-3)! : partes.at(-2)!

    // Um rótulo só de "e" ou "i" é "e.g." / "i.e." da prosa.
    if (nome.length < 2 || NAO_EMPRESA.has(nome)) return null
    if (temSegundoNivel && SEGUNDO_NIVEL.has(nome)) return null
    // Instituição pública (.gov, .gov.uk, .gob.es): fonte, não empresa.
    if (partes.includes("gov") || partes.includes("gob")) return null
    return nome
}

/**
 * As linhas do diretório: da ÚLTIMA ocorrência do capítulo de diretório (a
 * primeira costuma ser o sumário) até o capítulo seguinte. `null` quando o
 * estudo não tem capítulo de diretório reconhecível.
 */
export function linhasDoDiretorio(linhas: readonly string[]): string[] | null {
    let inicio = -1
    let numero = 0

    linhas.forEach((linha, indice) => {
        const capitulo = linha.match(CAPITULO)
        if (
            capitulo &&
            TITULO_DE_DIRETORIO.test(capitulo[2]) &&
            !SO_MENCIONA_DIRETORIO.test(capitulo[2]) &&
            !LINHA_DE_SUMARIO.test(linha)
        ) {
            inicio = indice
            numero = Number(capitulo[1])
        }
    })
    if (inicio === -1) return null

    let fim = linhas.length
    for (let j = inicio + 1; j < linhas.length; j++) {
        const capitulo = linhas[j].match(CAPITULO)
        if (capitulo && Number(capitulo[1]) === numero + 1 && !LINHA_DE_SUMARIO.test(linhas[j])) {
            fim = j
            break
        }
    }
    return linhas.slice(inicio, fim)
}

export interface ContagemDeEmpresas {
    total: number
    /** Os nomes contados, para conferência no admin. */
    empresas: string[]
}

/** Conta as empresas do diretório. `null` quando o estudo não tem diretório. */
export function contarEmpresas(linhas: readonly string[]): ContagemDeEmpresas | null {
    const diretorio = linhasDoDiretorio(linhas)
    if (!diretorio) return null

    const texto = diretorio.join("\n")
    const nomes = new Set<string>()
    for (const [, dominio] of texto.matchAll(EMAIL)) {
        const nome = nomeDaEmpresa(dominio)
        if (nome) nomes.add(nome)
    }
    for (const [, dominio] of texto.matchAll(DOMINIO)) {
        const nome = nomeDaEmpresa(dominio)
        if (nome) nomes.add(nome)
    }

    const empresas = juntarVariantes([...nomes])
    return { total: empresas.length, empresas }
}

/**
 * Junta variantes do nome da mesma empresa: "fleggaard" e "fleggaard-holding",
 * "transfood-grosshandel" e "transfoodgrosshandel". Compara sem hífen e junta
 * quando um nome é começo do outro — com pelo menos 5 letras, para "bio" não
 * engolir "biogros".
 */
export function juntarVariantes(nomes: string[]): string[] {
    const chave = (nome: string) => nome.replace(/-/g, "")
    const ordenados = [...new Set(nomes)].sort((a, b) => chave(a).length - chave(b).length || a.localeCompare(b))
    const mantidos: string[] = []
    for (const nome of ordenados) {
        const variante = mantidos.some((curto) => chave(curto).length >= 5 && chave(nome).startsWith(chave(curto)))
        if (!variante) mantidos.push(nome)
    }
    return mantidos.sort()
}
