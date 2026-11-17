// lib/marketplace/leads-do-diretorio.ts
//
// Lê as empresas do diretório de um estudo e devolve uma linha por empresa,
// para a tabela de leads do admin (MarketplaceLead). SÓ PARA O ADMIN: serve
// para a equipe conhecer as empresas que entram nos estudos; nunca vai para o
// site nem para o comprador.
//
// Sem IA, de propósito. O diretório é uma tabela ("Company / location | Type &
// focus | Website | General contact | Notes"), e o texto corrido do pdf.js
// embaralha as colunas linha a linha. O que separa as colunas é a POSIÇÃO: o
// cabeçalho da tabela diz onde cada coluna começa (x), e cada item de texto
// cai na coluna cujo começo fica à esquerda dele. As linhas da tabela começam
// onde a primeira coluna recomeça depois de um vão.
//
// Erros conhecidos: estudo sem cabeçalho de tabela reconhecível não rende nada
// (fica para a contagem aproximada); nome que ocupa mais de uma linha pode vir
// com a cidade colada; e-mail quebrado em lugar inesperado pode sair cortado.
//
// Puro, como contagem-empresas.ts: recebe os itens já lidos do PDF. A leitura
// fica em pdf-do-estudo.ts.

import { montarLinhas, type ItemDeTexto } from "./resumo-do-estudo"
import { intervaloDoDiretorio } from "./contagem-empresas"

/** Item do pdf.js com a posição horizontal, que a contagem não precisa. */
export interface ItemPosicionado extends ItemDeTexto {
    /** `transform[4]` do pdf.js: distância da margem esquerda. */
    x: number
    /** `width` do pdf.js. */
    largura: number
}

export interface LeadDoDiretorio {
    companyName: string
    location: string | null
    website: string | null
    contactForm: string | null
    emailGeneral: string | null
    emailPurchasing: string | null
    phoneGeneral: string | null
    companyType: string | null
    productPortfolio: string | null
    specialFocus: string | null
    /** Subseção do diretório ("8.2 Specialist retailers…"), quando houver. */
    secao: string | null
}

interface Linha {
    pagina: number
    y: number
    texto: string
    itens: ItemPosicionado[]
}

interface Coluna {
    x: number
    rotulo: string
}

/** Primeira coluna de um cabeçalho de diretório, nos idiomas dos estudos. */
const ROTULO_EMPRESA = /^(company|companies|name|firma|unternehmen|empresa|entreprise|soci[eé]t[eé]|azienda|bedrijf|importer|distributor)\b/i

const SUBSECAO = /^\d{1,2}(\.\d{1,2})+\.?\s+\S/
const RODAPE = /(^|\|\s*)(page|seite|página|pagina|p\.)\s*\d+\s*$|\b(page|seite|página|pagina)\s+\d+\s+(of|von|de|di|sur)\s+\d+\b/i

const FORMA_JURIDICA =
    /\b(inc|ltd|llc|corp|co|gmbh|ag|kg|se|sa|s\.a|sas|sarl|srl|s\.r\.l|spa|s\.p\.a|bv|b\.v|nv|n\.v|ab|as|a\/s|oy|plc|pty|limited|lda|sl|s\.l|sp\.\s*z\s*o\.o|kft|d\.o\.o|ehf|aps)\b\.?/i

const EMAIL = /[a-z0-9][a-z0-9._%+-]*@(?:[a-z0-9-]+\.)+[a-z]{2,6}/gi
const URL = /(?<![@\w.-])(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,6}(?:\/[^\s,;)]*)?/gi
const TELEFONE = /(?:\+|00)?\(?\d[\d\s().\/–-]{5,}\d/g
const TLD = new Set(
    (
        "com net org info biz eu co io shop store online group global trade " +
        "de at ch li lu be nl fr it es pt ie uk dk se no fi is ee lv lt pl cz sk hu si hr ba rs me mk al bg ro gr cy mt tr " +
        "ua md ge am az us ca mx br ar cl uy py bo pe ec ve za ng ke ma tn dz eg mu ae sa qa kw bh om jo lb il " +
        "in pk bd lk cn hk tw jp kr sg my th vn ph id au nz"
    ).split(" ")
)
const NAO_SITE = /^(?:www\.)?(linkedin|facebook|instagram|twitter|x|youtube|google|wikipedia|europages|kompass|northdata)\./i
const COMPRAS = /purchas|einkauf|buying|buyer|compras|achat|acquist|inkoop|procurement|sourcing|supplier|lieferant|fornec/i

/** Junta os itens da página em linhas, na mesma ordem de `montarLinhas`. */
function linhasComPosicao(paginas: readonly (readonly ItemPosicionado[])[]): Linha[] {
    const linhas: Linha[] = []
    paginas.forEach((itens, indice) => {
        const porY = new Map<number, ItemPosicionado[]>()
        for (const item of itens) {
            if (!item.texto.trim()) continue
            const y = Math.round(item.y * 2) / 2
            porY.set(y, [...(porY.get(y) ?? []), item])
        }
        for (const [y, doY] of [...porY.entries()].sort((a, b) => b[0] - a[0])) {
            const ordenados = [...doY].sort((a, b) => a.x - b.x)
            linhas.push({
                pagina: indice + 1,
                y,
                texto: ordenados.map((i) => i.texto.trim()).join(" "),
                itens: ordenados,
            })
        }
    })
    return linhas
}

/** Linha de cabeçalho de tabela: rótulo de empresa à esquerda e ≥ 2 colunas. */
function colunasDoCabecalho(linha: Linha): Coluna[] | null {
    const itens = linha.itens.filter((i) => i.texto.trim())
    if (itens.length < 2 || !ROTULO_EMPRESA.test(itens[0].texto.trim())) return null
    // Rótulos colados ("Company / location") vêm num item só; colunas reais
    // ficam a pelo menos 40 pt uma da outra.
    const colunas: Coluna[] = []
    for (const item of itens) {
        const ultima = colunas.at(-1)
        if (ultima && item.x - ultima.x < 40) {
            ultima.rotulo += " " + item.texto.trim()
        } else {
            colunas.push({ x: item.x, rotulo: item.texto.trim() })
        }
    }
    return colunas.length >= 2 ? colunas : null
}

function colunaDoItem(colunas: Coluna[], x: number): number {
    let indice = 0
    colunas.forEach((coluna, i) => {
        if (x + 4 >= coluna.x) indice = i
    })
    return indice
}

/**
 * Junta as linhas de uma célula. E-mail e endereço quebrados no meio
 * ("info@maighandistributi" / "on.com", "kidcentral.ca/pages/cont" / "act")
 * colam sem espaço; telefone partido no hífen ("1-877-218-" / "0395") também.
 */
function juntarCelula(partes: string[]): string {
    let texto = ""
    for (const parte of partes.map((p) => p.trim()).filter(Boolean)) {
        if (!texto) {
            texto = parte
            continue
        }
        const ultimoToken = texto.split(/\s+/).at(-1) ?? ""
        const primeiroToken = parte.split(/\s+/)[0]
        // Endereço que já termina em domínio completo ("x.com") não continua:
        // a linha de baixo é outro e-mail ou site.
        const pedacoDeEndereco =
            /[@./]/.test(ultimoToken) &&
            !/[:]$/.test(ultimoToken) &&
            !/\.[a-z]{2,6}$/i.test(ultimoToken) &&
            /^[a-z0-9./_-]/.test(primeiroToken) &&
            !/:/.test(primeiroToken)
        const telefonePartido = /\d-$/.test(texto) && /^\d/.test(parte)
        texto += pedacoDeEndereco || telefonePartido ? parte : " " + parte
    }
    return texto
}

function primeiroSite(texto: string): { site: string | null; formulario: string | null } {
    let site: string | null = null
    let formulario: string | null = null
    for (const [bruto] of texto.matchAll(URL)) {
        const url = bruto.replace(/[.,;:]+$/, "")
        const dominio = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase()
        const tld = dominio.split(".").at(-1) ?? ""
        if (!TLD.has(tld) || dominio.split(".")[0].length < 2 || NAO_SITE.test(dominio)) continue
        if (/\/.*(contact|kontakt|contacto|contato|contatt|contactez|form)/i.test(url)) {
            formulario ??= url
            continue
        }
        site ??= dominio
    }
    return { site, formulario }
}

function telefones(texto: string): string[] {
    return [...texto.matchAll(TELEFONE)]
        .map(([t]) => t.trim().replace(/[\s(–-]+$/, ""))
        .filter((t) => {
            const digitos = t.replace(/\D/g, "")
            // Ano, faixa de faturamento ou CEP não são telefone.
            return digitos.length >= 7 && digitos.length <= 15 && !/^\d{4}\s*[–-]\s*\d{2,4}$/.test(t)
        })
}

/**
 * Nome e local saem da primeira coluna. O nome continua na linha seguinte
 * quando ela traz forma jurídica ("Distribution Inc."), começa minúscula ou a
 * anterior terminou pendurada ("&", "-", ",", "/", "(").
 */
function nomeELocal(partes: string[]): { nome: string; local: string | null } {
    const linhas = partes.map((p) => p.trim()).filter(Boolean)
    if (linhas.length === 0) return { nome: "", local: null }
    let nome = linhas[0]
    let i = 1
    while (i < linhas.length) {
        const proxima = linhas[i]
        const continua =
            /[&\-,/(]$/.test(nome) ||
            /\s(e|and|und|et|y|of|de|di|van|der|du|des)$/i.test(nome) ||
            (nome.match(/\(/g)?.length ?? 0) > (nome.match(/\)/g)?.length ?? 0) ||
            /^[&]/.test(proxima) ||
            (FORMA_JURIDICA.test(proxima) && proxima.split(/\s+/).length <= 4 && !FORMA_JURIDICA.test(nome))
        if (!continua) break
        nome = nome.endsWith("-") ? nome + proxima : `${nome} ${proxima}`
        i++
    }
    const local = linhas.slice(i).join(", ") || null
    return { nome: nome.replace(/\s+/g, " ").trim(), local }
}

function semRotulo(texto: string): string {
    return texto.replace(/\b(web(site)?|e-?mail|tel(efon|ephone|\.)?|phone|fax|contact form)\s*:\s*/gi, "").trim()
}

function linhaParaLead(colunas: Coluna[], celulas: string[][], secao: string | null): LeadDoDiretorio | null {
    const { nome, local } = nomeELocal(celulas[0] ?? [])
    if (nome.length < 2) return null

    const textos = celulas.map((c) => juntarCelula(c))
    const resto = textos.slice(1).join("\n")

    const emails = [...new Set([...resto.matchAll(EMAIL)].map(([e]) => e.toLowerCase().replace(/\.$/, "")))]
    // O site só conta fora dos e-mails: "info@x.de" não é o site "x.de" por si.
    const { site, formulario } = primeiroSite(resto.replace(EMAIL, " "))
    const fones = telefones(resto.replace(EMAIL, " ").replace(URL, " "))

    // Sem site, e-mail nem telefone não é linha de diretório: é tabela-resumo
    // ou texto que caiu na grade.
    if (!site && emails.length === 0 && fones.length === 0) return null

    let companyType: string | null = null
    let productPortfolio: string | null = null
    let specialFocus: string | null = null
    colunas.forEach((coluna, i) => {
        if (i === 0) return
        const texto = semRotulo(textos[i] ?? "")
        if (!texto) return
        if (/type|channel|profile|focus|categor|tipo|typ|art|perfil|profil|segment/i.test(coluna.rotulo)) {
            productPortfolio = productPortfolio ? `${productPortfolio}\n${texto}` : texto
            companyType ??= texto.split(/\s+[–—-]\s+|[.;(]/)[0].trim().slice(0, 120) || null
        } else if (/note|remark|comment|hinweis|observa|bemerk|remarque|osserva|opmerk|why|fit/i.test(coluna.rotulo)) {
            specialFocus = specialFocus ? `${specialFocus}\n${texto}` : texto
        }
    })

    return {
        companyName: nome,
        location: local,
        website: site,
        contactForm: formulario,
        emailGeneral: emails.find((e) => !COMPRAS.test(e.split("@")[0])) ?? emails[0] ?? null,
        emailPurchasing: emails.find((e) => COMPRAS.test(e.split("@")[0])) ?? null,
        phoneGeneral: fones[0] ?? null,
        companyType,
        productPortfolio,
        specialFocus,
        secao,
    }
}

// ==================== FORMATO FICHA ====================
//
// Parte dos estudos não usa tabela: cada empresa é uma ficha, com o nome numa
// linha e depois rótulo + valor ("Profile", "Address", "Phone", "E-mail",
// "Website"). O rótulo vem sozinho na linha ou como primeiro item dela, com o
// valor à direita.

const ROTULO_DE_FICHA = new RegExp(
    "^(?:" +
        [
            "company profile", "profile", "profil", "perfil", "profilo", "description", "about",
            "products? ?(?:/ ?relevance)?", "product range", "range", "sortiment", "brands?", "focus", "channel", "type",
            "address", "adresse", "anschrift", "direcci[oó]n", "indirizzo", "adres", "morada", "endere[cç]o", "location", "headquarters", "hq",
            "telephone(?: \\([^)]*\\))?", "phone(?: \\([^)]*\\))?", "tel\\.?", "telefon", "t[eé]l[eé]phone", "tel[eé]fono", "telefoon", "fax",
            "general e-?mail", "e-?mail(?: \\([^)]*\\))?", "named buyer e-?mails?(?: on)?", "website", "web", "internet", "homepage",
            "contact(?: form| route)?", "kontakt", "supplier route(?: / notes)?", "best first contact", "notes?", "remarks?",
        ].join("|") +
        ")\\s*:?$",
    "i"
)

/**
 * Palavras que aparecem nos rótulos das fichas do corpus ("Likely interest in
 * new lines", "Head office / base", "Switchboard / company phone", "Decision-
 * maker names on website?"). A lista fechada de rótulos não dá conta: cada
 * família de estudos inventa os seus.
 */
const PALAVRA_DE_ROTULO =
    /\b(profile|profil|perfil|categor|interest|orientation|brand|headquarter|head office|base|address|adress|anschrift|location|switchboard|phone|telephone|tel|telefon|e-?mail|website|web|buyer|purchas|supplier|decision|contact|kontakt|note|remark|segment|focus|channel|type|hq|fax|description|range|sortiment)/i

function rotuloDaLinha(linha: Linha): { rotulo: string; valor: string } | null {
    const primeiro = linha.itens[0]?.texto.trim() ?? ""
    if (ROTULO_DE_FICHA.test(primeiro)) {
        return { rotulo: primeiro.replace(/:$/, "").toLowerCase(), valor: linha.itens.slice(1).map((i) => i.texto.trim()).join(" ") }
    }
    const curto = primeiro.length <= 45 && primeiro.split(/\s+/).length <= 7 && !/[.;,]$/.test(primeiro) && !/@|www\.|https?:/.test(primeiro)
    // Coluna de rótulos: primeiro item curto e o valor bem à direita dele.
    const segundo = linha.itens[1]
    if (curto && segundo && segundo.x - (linha.itens[0].x + linha.itens[0].largura) > 25 && PALAVRA_DE_ROTULO.test(primeiro)) {
        return { rotulo: primeiro.toLowerCase(), valor: linha.itens.slice(1).map((i) => i.texto.trim()).join(" ") }
    }
    // Rótulo sozinho na linha, com o valor na linha de baixo.
    if (curto && linha.itens.length === 1 && PALAVRA_DE_ROTULO.test(primeiro) && !/\d{3}/.test(primeiro)) {
        return { rotulo: primeiro.replace(/:$/, "").toLowerCase(), valor: "" }
    }
    // Rótulo e valor no mesmo item: "Website: www.x.nl".
    const m = primeiro.match(/^([^:]{2,30}):\s*(.*)$/)
    if (m && ROTULO_DE_FICHA.test(m[1])) {
        return { rotulo: m[1].toLowerCase(), valor: [m[2], ...linha.itens.slice(1).map((i) => i.texto.trim())].join(" ") }
    }
    return null
}

function fichaParaLead(nome: string, campos: Map<string, string[]>, secao: string | null): LeadDoDiretorio | null {
    // Cada rótulo é juntado à parte: colar o valor de "Website" com o de
    // "E-mail" fazia "x.comsales@x.com".
    const de = (re: RegExp) =>
        [...campos.entries()].filter(([r]) => re.test(r)).map(([, v]) => juntarCelula(v)).filter(Boolean).join("\n")
    const contato = de(/phone|tel|fax|switchboard|mail|web|internet|homepage|contact|kontakt|supplier|buyer/)
    const emails = [...new Set([...contato.matchAll(EMAIL)].map(([e]) => e.toLowerCase().replace(/\.$/, "")))]
    const { site, formulario } = primeiroSite(de(/web|internet|homepage|contact|kontakt|supplier|buyer/).replace(EMAIL, " "))
    const fones = telefones(de(/phone|tel|fax|switchboard/).replace(EMAIL, " ").replace(URL, " "))
    if (!site && emails.length === 0 && fones.length === 0) return null

    const perfil = de(/profil|perfil|description|about|type|product|range|sortiment|brand|focus|channel/) || null
    const notas = de(/note|remark|supplier route|best first contact/) || null
    return {
        companyName: nome,
        location: de(/address|adress|anschrift|direcci|indirizzo|morada|endere|location|headquarter|head office|base|hq/) || null,
        website: site,
        contactForm: formulario,
        emailGeneral: emails.find((e) => !COMPRAS.test(e.split("@")[0])) ?? emails[0] ?? null,
        emailPurchasing: emails.find((e) => COMPRAS.test(e.split("@")[0])) ?? null,
        phoneGeneral: fones[0] ?? null,
        companyType: perfil ? perfil.split(/\s+[–—-]\s+|[.;(]/)[0].trim().slice(0, 120) || null : null,
        productPortfolio: perfil,
        specialFocus: notas,
        secao,
    }
}

function leadsDeFichas(linhas: Linha[]): LeadDoDiretorio[] {
    const leads: LeadDoDiretorio[] = []
    let secao: string | null = null
    let nome: string | null = null
    let campos = new Map<string, string[]>()
    let rotuloAtual: string | null = null

    const fechar = () => {
        if (nome) {
            const lead = fichaParaLead(nome, campos, secao)
            if (lead) leads.push(lead)
        }
        nome = null
        campos = new Map()
        rotuloAtual = null
    }

    linhas.forEach((linha, i) => {
        const rotulo = rotuloDaLinha(linha)
        if (rotulo) {
            if (!nome) return
            rotuloAtual = rotulo.rotulo
            campos.set(rotuloAtual, [...(campos.get(rotuloAtual) ?? []), rotulo.valor])
            return
        }

        if (SUBSECAO.test(linha.texto)) {
            fechar()
            secao = linha.texto.replace(/\s+/g, " ").trim().slice(0, 200)
            return
        }

        // Nome de empresa: linha curta seguida (até 2 linhas) de um rótulo.
        // A ficha em curso só termina depois de ter trazido algum contato: sem
        // isso, a última linha de um parágrafo longo antes de "Phone" passava
        // por nome de empresa. O nome é o primeiro item da linha: o que vem à
        // direita ("Brand-maker") é classificação, não nome.
        const seguinte = linhas.slice(i + 1, i + 3).map(rotuloDaLinha).find(Boolean)
        const fichaCompleta = !nome || [...campos.keys()].some((r) => /web|mail|phone|tel|switchboard|fax|address|adress|headquarter|location/.test(r))
        const candidato = linha.itens[0].texto.replace(/\s+/g, " ").trim()
        const pareceNome =
            candidato.length >= 3 &&
            candidato.length <= 90 &&
            // Ponto final só vale se for de forma jurídica ("S.r.l.", "Inc.").
            !/[,;:]$/.test(candidato) &&
            (!/\.$/.test(candidato) || FORMA_JURIDICA.test(candidato)) &&
            !/:\s|@|www\./.test(candidato) &&
            /^[\p{Lu}\d"„(]/u.test(candidato) &&
            !PALAVRA_DE_ROTULO.test(candidato) &&
            seguinte != null &&
            fichaCompleta
        if (pareceNome) {
            fechar()
            nome = candidato.replace(/^\d{1,3}[.)]\s+/, "")
            return
        }

        // Continuação do valor do rótulo anterior.
        if (nome && rotuloAtual) {
            campos.get(rotuloAtual)!.push(linha.texto)
        }
    })
    fechar()
    return leads
}

/** Chave de duplicata: o domínio do site; sem site, o nome normalizado. */
function chave(lead: LeadDoDiretorio): string {
    if (lead.website) return lead.website.split(".").slice(0, -1).join(".")
    return lead.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function mesclar(a: LeadDoDiretorio, b: LeadDoDiretorio): LeadDoDiretorio {
    const r = { ...a }
    for (const campo of Object.keys(b) as (keyof LeadDoDiretorio)[]) {
        if (r[campo] == null && b[campo] != null) (r as Record<string, unknown>)[campo] = b[campo]
    }
    return r
}

/**
 * As empresas do diretório. `[]` quando o estudo não tem diretório ou a tabela
 * não tem cabeçalho reconhecível.
 */
export function extrairLeadsDoDiretorio(paginas: readonly (readonly ItemPosicionado[])[]): LeadDoDiretorio[] {
    const linhas = linhasComPosicao(paginas)
    const textos = montarLinhas(paginas).map((l) => l.texto)
    // As duas montagens agrupam pelos mesmos y; se divergirem, o índice do
    // diretório não vale para `linhas`.
    if (textos.length !== linhas.length) return []
    const intervalo = intervaloDoDiretorio(textos)
    if (!intervalo) return []
    // Linhas a até 2,5 pt uma da outra são a mesma linha da tabela: o "Web:"
    // da coluna de contato costuma ficar 1 pt acima do nome da empresa.
    const doDiretorio: Linha[] = []
    for (const linha of linhas.slice(intervalo.inicio, intervalo.fim)) {
        const anterior = doDiretorio.at(-1)
        if (anterior && anterior.pagina === linha.pagina && anterior.y - linha.y <= 2.5) {
            anterior.itens = [...anterior.itens, ...linha.itens].sort((a, b) => a.x - b.x)
            anterior.texto = anterior.itens.map((i) => i.texto.trim()).join(" ")
            anterior.y = linha.y
        } else {
            doDiretorio.push({ ...linha })
        }
    }

    // Texto repetido em 3+ páginas é cabeçalho/rodapé corrido do documento.
    const porTexto = new Map<string, Set<number>>()
    for (const l of linhas) porTexto.set(l.texto, (porTexto.get(l.texto) ?? new Set()).add(l.pagina))
    const corrido = (l: Linha) => (porTexto.get(l.texto)?.size ?? 0) >= 3 && !colunasDoCabecalho(l)

    const leads: LeadDoDiretorio[] = []
    let colunas: Coluna[] | null = null
    let secao: string | null = null
    let celulas: string[][] | null = null
    let alturaDaLinha = 10
    let ultimoYColuna0 = Infinity
    let paginaAtual = 0

    const fecharLinha = () => {
        if (colunas && celulas) {
            const lead = linhaParaLead(colunas, celulas, secao)
            if (lead) leads.push(lead)
        }
        celulas = null
    }

    for (const linha of doDiretorio) {
        if (RODAPE.test(linha.texto) || corrido(linha)) continue

        const cabecalho = colunasDoCabecalho(linha)
        if (cabecalho) {
            fecharLinha()
            colunas = cabecalho
            ultimoYColuna0 = Infinity
            continue
        }

        if (SUBSECAO.test(linha.texto) && linha.itens[0].x < (colunas?.[1]?.x ?? Infinity)) {
            fecharLinha()
            colunas = null // a próxima tabela traz o próprio cabeçalho
            secao = linha.texto.replace(/\s+/g, " ").trim().slice(0, 200)
            continue
        }
        if (!colunas) continue

        if (linha.pagina !== paginaAtual) {
            paginaAtual = linha.pagina
            ultimoYColuna0 = Infinity
        }

        // Texto que atravessa a grade (parágrafo depois da tabela) encerra a tabela.
        const primeiro = linha.itens[0]
        const larguraDaColuna0 = (colunas[1]?.x ?? Infinity) - colunas[0].x
        if (colunaDoItem(colunas, primeiro.x) === 0 && primeiro.largura > larguraDaColuna0 + 20) {
            fecharLinha()
            colunas = null
            continue
        }

        for (const item of linha.itens) {
            const c = colunaDoItem(colunas, item.x)
            if (c === 0) {
                const vao = ultimoYColuna0 - linha.y
                const novaLinha = !celulas || vao > alturaDaLinha * 1.75
                if (novaLinha) {
                    fecharLinha()
                    celulas = colunas.map(() => [])
                    alturaDaLinha = Math.max(item.altura, 6) * 1.2
                }
                ultimoYColuna0 = linha.y
            }
            if (!celulas) continue
            ;(celulas as string[][])[c].push(item.texto)
        }
    }
    fecharLinha()

    // Cada estudo segue um formato só. Rodar os dois e somar mistura as
    // leituras (a ficha lê uma linha de tabela inteira como nome); vale o
    // formato que achou mais empresas com site. No empate fica a ficha: a
    // leitura de tabela também "acha" fichas, só que com os rótulos colados
    // no nome ("Profile, Address, Website").
    const fichas = leadsDeFichas(doDiretorio.filter((l) => !RODAPE.test(l.texto) && !corrido(l)))
    const comSite = (lista: LeadDoDiretorio[]) => lista.filter((l) => l.website).length
    const escolhidos = comSite(fichas) > 0 && comSite(fichas) >= comSite(leads) ? fichas : leads

    // A mesma empresa pode aparecer na tabela-resumo e na detalhada.
    const unicos = new Map<string, LeadDoDiretorio>()
    for (const lead of escolhidos) {
        const k = chave(lead)
        unicos.set(k, unicos.has(k) ? mesclar(unicos.get(k)!, lead) : lead)
    }
    return [...unicos.values()]
}
