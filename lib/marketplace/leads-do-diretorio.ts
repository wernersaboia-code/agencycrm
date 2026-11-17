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
// Só o rótulo, ou o rótulo seguido de separador ("Company / location"): a
// célula "importer; full range" de uma linha da tabela não é cabeçalho.
const ROTULO_EMPRESA =
    /^(company|companies|name|firma|unternehmen|empresa|entreprise|soci[eé]t[eé]|azienda|bedrijf)s?\s*(?:$|[/&|–(,-]|\band\b|\bname\b|\bund\b)|^(importer|distributor)s?\s*(?:[/&]\s*(importer|distributor|wholesaler)s?)?$/i

const SUBSECAO = /^\d{1,2}(\.\d{1,2})+\.?\s+\S/
// "… | Page 9", "Market Entry Study FMCG South Africa · Page 9", "Page 7 of 12".
// O número da página pode vir numa linha só dele, 1 pt fora da linha do texto.
const RODAPE = /(^|[|·•–—]\s*)(page|seite|página|pagina|p\.)\s*\d*\s*$|^\d{1,3}$|\b(page|seite|página|pagina)\s+\d+\s+(of|von|de|di|sur)\s+\d+\b/i

const FORMA_JURIDICA =
    /\b(inc|ltd|llc|corp|co|gmbh|ag|kg|se|sa|s\.a|sas|sarl|srl|s\.r\.l|spa|s\.p\.a|bv|b\.v|nv|n\.v|ab|as|a\/s|oy|plc|pty|limited|lda|sl|s\.l|sp\.\s*z\s*o\.o|kft|d\.o\.o|ehf|aps|s\.r\.o|a\.s|spol|k\.s|v\.o\.s|e\.u|ges\.m\.b\.h)\b\.?/i

const EMAIL = /[a-z0-9][a-z0-9._%+-]*@(?:[a-z0-9-]+\.)+[a-z]{2,6}/gi
const URL = /(?<![@\w.-])(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,6}(?:\/[^\s,;)]*)?/gi
// Sem \s: telefone não atravessa quebra de linha.
const TELEFONE = /(?:\+|00)?\(?\d[\d \t().\/–-]{5,}\d/g
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
    // Cabeçalho só tem rótulos: "E-mail:", um site ou um telefone na mesma
    // linha mostram que é uma linha de dados ("Importer / distributor (baby &"
    // ao lado de "E-mail:" na tabela da Finlândia).
    if (itens.some((i) => /:\s*$|@|www\.|https?:|\d{3}/.test(i.texto))) return null
    if ((itens[0].texto.match(/\(/g)?.length ?? 0) !== (itens[0].texto.match(/\)/g)?.length ?? 0)) return null
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
            !/:/.test(primeiroToken) &&
            !/^(www\.|https?:)/i.test(primeiroToken)
        // "commande@babilol.co" / "m": o resto do TLD sozinho na linha.
        const restoDeDominio =
            (/@\S+\.[a-z]{2,5}$/i.test(ultimoToken) && /^[a-z]{1,3}$/.test(parte)) ||
            // "larmoiredebebe.co" / "m" na coluna do site.
            (/^(www\.)?[\w-]+\.[a-z]{2}$/i.test(ultimoToken) && /^[a-z]{1,2}$/.test(parte))
        const telefonePartido = /\d-$/.test(texto) && /^\d/.test(parte)
        // Fora isso, quebra de linha de verdade: sem ela o telefone de uma
        // linha emendava no número da rua da linha de baixo.
        texto += pedacoDeEndereco || restoDeDominio || telefonePartido ? parte : "\n" + parte
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

/** "profarma" para portal.profarma.com.br, ri.profarma.com.br e profarma.com.br. */
function baseDoDominio(dominio: string): string {
    const partes = dominio.toLowerCase().split(".")
    const segundoNivel = partes.length >= 3 && /^(co|com|org|net|gov|ac|or|ne|gob)$/.test(partes.at(-2)!)
    return (segundoNivel ? partes.at(-3) : partes.at(-2)) ?? dominio
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
function nomeELocal(
    partes: string[],
    rotulo: string
): { nome: string; local: string | null; tipo: string | null } {
    const linhas = partes.map((p) => p.trim()).filter(Boolean)
    if (linhas.length === 0) return { nome: "", local: null, tipo: null }

    // Coluna só de nome ("Company", sem "/ location"): tudo nela é o nome,
    // que quebra em várias linhas ("Autour de Bébé / New" / "Baby (Sagam group)").
    // Para no endereço, quando há um: linha com número de rua ou CEP
    // ("26 quai Marcel Boyer", "92290 Châtenay-Malabry") é local, não nome.
    // Para também no tipo, quando a coluna o traz embaixo do nome sem dizer
    // no cabeçalho ("Pound Wholesale" / "Online wholesaler – value baby
    // essentials"): o resto vira tipo.
    if (!/\/|&|\band\b|location|city|ort|sede|type|typ|tipo/i.test(rotulo)) {
        const ehTipo = (l: string) =>
            /\s[–—]\s/.test(l) ||
            /^(online |national |regional |specialist |full-range |discount )?(wholesaler|retailer|importer|distributor|buying group|superstore|manufacturer|brand owner|toy|department store|chain)\b/i.test(l)
        let fim = linhas.findIndex((l, j) => j > 0 && (/\d{2,}/.test(l) || ehTipo(l)))
        if (fim === -1) fim = linhas.length
        const nomeCompleto = linhas.slice(0, fim).join(" ").replace(/-\s/g, "-").replace(/\s+/g, " ").trim()
        const resto = linhas.slice(fim)
        const tipo = resto.length > 0 && ehTipo(resto[0]) ? resto.join(" ").replace(/\s+/g, " ") : null
        return { nome: nomeCompleto.replace(/^\d{1,3}\.\s+/, ""), local: tipo ? null : resto.join(", ") || null, tipo }
    }
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
    const resto = linhas.slice(i)
    // Forma jurídica que quebrou para a linha do endereço ("EDEKA ZENTRALE
    // Stiftung & Co." / "KG, New-York-Ring 6", "Kompernaß Handelsgesellschaft"
    // / "mbH, Burgstraße 21"): volta para o nome.
    const sufixo = resto[0]?.match(/^(KGaA|KG|mbH|GmbH|GesmbH|GmbH & Co\.? KG|oHG|OHG|AG|SE|Ltd\.?|S\.A\.|B\.V\.|N\.V\.)(?=,|\s|$)[,]?\s*(.*)$/)
    if (sufixo) {
        nome = `${nome} ${sufixo[1]}`
        resto[0] = sufixo[2]
        if (!resto[0]) resto.shift()
    }
    // Diretório numerado ("1. OBI (OBI Home and Garden GmbH …)").
    nome = nome.replace(/\s+/g, " ").trim().replace(/^\d{1,3}\.\s+/, "")
    // "Company / type": as linhas do meio são o tipo e a última é a cidade
    // (Finlândia: "Importer / distributor (baby &" / "kids specialist)" / "Helsinki").
    // "Company / profile" (DIY Espanha): o que vem depois do nome é o perfil.
    if (/profil|perfil/i.test(rotulo) && resto.length > 0) {
        return { nome, tipo: resto.join(" ").replace(/\s+/g, " "), local: null }
    }
    if (/type|typ|tipo/i.test(rotulo) && resto.length >= 2) {
        return { nome, tipo: resto.slice(0, -1).join(" ").replace(/\s+/g, " "), local: resto.at(-1)! }
    }
    return { nome, local: resto.join(", ") || null, tipo: null }
}

function semRotulo(texto: string): string {
    return texto.replace(/\b(web(site)?|e-?mail|tel(efon|ephone|\.)?|phone|fax|contact form)\s*:\s*/gi, "").trim()
}

function linhaParaLead(colunas: Coluna[], celulas: string[][], secao: string | null): LeadDoDiretorio | null {
    // Coluna "Company & contact" (plant-based Alemanha): as linhas de
    // contato da primeira coluna vão para o contato, não para nome ou local.
    const ehContato = (l: string) =>
        /@|www\.|https?:|^(e-?mail|web(site)?|tel(ephone)?|phone|fax)\b/i.test(l.trim()) ||
        // Domínio sozinho na linha ("transgourmet.de"), mas não "Co. OHG".
        /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,6}(\/\S*)?$/.test(l.trim())
    const coluna0 = celulas[0] ?? []
    const { nome, local, tipo } = nomeELocal(coluna0.filter((l) => !ehContato(l)), colunas[0].rotulo)
    if (nome.length < 2) return null

    const textos = celulas.map((c) => juntarCelula(c))
    const resto = [juntarCelula(coluna0.filter(ehContato)), ...textos.slice(1)].join("\n")

    const emails = [...new Set([...resto.matchAll(EMAIL)].map(([e]) => e.toLowerCase().replace(/\.$/, "")))]
    // O site só conta fora dos e-mails: "info@x.de" não é o site "x.de" por si.
    const { site, formulario } = primeiroSite(resto.replace(EMAIL, " "))
    const fones = telefones(resto.replace(EMAIL, " ").replace(URL, " "))

    // Sem site, e-mail nem telefone não é linha de diretório: é tabela-resumo
    // ou texto que caiu na grade.
    if (!site && emails.length === 0 && fones.length === 0) return null

    let companyType: string | null = tipo ? tipo.split(/\s+[–—-]\s+|[.;]/)[0].trim().slice(0, 120) || null : null
    let productPortfolio: string | null = tipo && tipo.length > 120 ? tipo : null
    let specialFocus: string | null = null
    colunas.forEach((coluna, i) => {
        if (i === 0) return
        const texto = semRotulo(textos[i] ?? "")
        if (!texto) return
        if (/type|channel|profile|focus|categor|tipo|typ|art|perfil|profil|segment/i.test(coluna.rotulo)) {
            productPortfolio = productPortfolio ? `${productPortfolio}\n${texto}` : texto
            companyType ??= texto.replace(/\s+/g, " ").split(/\s+[–—-]\s+|[.;(]/)[0].trim().slice(0, 120) || null
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
    // Nome numerado ou com forma jurídica ("14. Brand Warehouse (British Food
    // s.r.o.)") nunca é rótulo, mesmo tendo palavra de rótulo.
    const curto =
        primeiro.length <= 45 &&
        primeiro.split(/\s+/).length <= 7 &&
        !/[.;,]$/.test(primeiro) &&
        !/@|www\.|https?:/.test(primeiro) &&
        !/^([A-Z]{1,2}\d{1,3}|\d{1,3})[.)]\s/.test(primeiro) &&
        !FORMA_JURIDICA.test(primeiro)
    // Coluna de rótulos: primeiro item curto e o valor bem à direita dele.
    const segundo = linha.itens[1]
    // Vão de 8 pt: na África do Sul a coluna de rótulos é justa e
    // "Switchboard / head office" fica a ~15 pt do valor.
    if (curto && segundo && segundo.x - (linha.itens[0].x + linha.itens[0].largura) > 8 && PALAVRA_DE_ROTULO.test(primeiro)) {
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
    // "Switchboard / head office" é telefone, não endereço.
    let local = de(/^(?!.*(phone|tel|switchboard|fax|mail)).*(address|adress|anschrift|direcci|indirizzo|morada|endere|location|headquarter|head office|base|hq)/) || null
    // Sem campo de endereço, a cidade costuma vir no próprio nome da ficha:
    // "Brands2Africa (B2A) – Johannesburg (Bryanston)".
    let companyName = nome
    const traco = nome.match(/^(.{3,}?)\s+[–—]\s+(.+)$/)
    if (!local && traco) {
        companyName = traco[1].trim()
        local = traco[2].trim()
    }
    return {
        companyName,
        location: local,
        website: site,
        contactForm: formulario,
        emailGeneral: emails.find((e) => !COMPRAS.test(e.split("@")[0])) ?? emails[0] ?? null,
        emailPurchasing: emails.find((e) => COMPRAS.test(e.split("@")[0])) ?? null,
        phoneGeneral: fones[0] ?? null,
        // Só a primeira linha: o tipo não emenda no parágrafo do perfil.
        companyType: perfil ? perfil.split("\n")[0].split(/\s+[–—-]\s+|[.;(]/)[0].trim().slice(0, 120) || null : null,
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

    const CODIGO = /^([A-Z]{1,2}\d{1,3}|\d{1,3})[.)]\s/
    let pular = -1

    linhas.forEach((linha, i) => {
        if (i === pular) return
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
            // Ficha com código ("A2. Bounty Foods & Care (Bounty Brands; incl.
            // …) – Centurion, Cape") pode ter nome longo.
            candidato.length <= (CODIGO.test(candidato) ? 140 : 90) &&
            // Ponto final só vale se for de forma jurídica ("S.r.l.", "Inc.").
            !/[,;:]$/.test(candidato) &&
            (!/\.$/.test(candidato) || FORMA_JURIDICA.test(candidato)) &&
            !/:\s|@|www\./.test(candidato) &&
            /^[\p{Lu}\d"„(]/u.test(candidato) &&
            // Rótulo curto ("Food / Non-Food") não é nome; nome longo com
            // palavra de rótulo é ("Brands2Africa (B2A) – Johannesburg").
            !(PALAVRA_DE_ROTULO.test(candidato) && candidato.split(/\s+/).length <= 3 && !CODIGO.test(candidato)) &&
            !/\bpage\b|\bseite\b|\bpágina\b/i.test(candidato) &&
            // Resto de telefone ("Durban: +27" / "32 944 1284") ou linha que
            // continua a anterior pendurada não abre ficha.
            (candidato.match(/\d/g)?.length ?? 0) < 6 &&
            // Linha de tabela ("Retail group | Focus | Switchboard | Supplier
            // page") não é ficha: nome de ficha tem no máximo dois itens.
            // Exceção: nome ao lado de um rótulo com valor ("Screwfix Direct
            // Ltd | Product groups: | Power and hand tools…", DIY Reino Unido).
            (linha.itens.filter((it, j) => j === 0 || it.x - linha.itens[j - 1].x > 40).length <= 2 ||
                linha.itens.slice(1).some((it) => /:\s*$/.test(it.texto.trim()))) &&
            // (endereço terminado em "/" está completo: "…/team/").
            // Só vale para linha de texto corrido: depois de "Product groups:
            // …, PPE," pode vir o nome da próxima empresa em outra coluna.
            !(i > 0 && !rotuloDaLinha(linhas[i - 1]) && /[,:+&(–-]$|\+\d{1,3}$|(^|\s)[^\s.]+\/$/.test(linhas[i - 1].texto.trim())) &&
            // Se a linha de baixo é a que traz o código da ficha ("A3. Rialto
            // Foods"), o nome é ela: esta é o fim da ficha anterior.
            !(linhas[i + 1] && !rotuloDaLinha(linhas[i + 1]) && CODIGO.test(linhas[i + 1].texto)) &&
            // A primeira linha é o título do capítulo ("9. Directory of …").
            i > 0 &&
            seguinte != null &&
            fichaCompleta
        if (pareceNome) {
            fechar()
            // Código da ficha: "2. Maxi Zoo", "A1. Brands2Africa".
            nome = candidato.replace(CODIGO, "").trim()
            // Nome que quebrou antes do rótulo ("… – Centurion, Cape" /
            // "Town, Durban") continua na linha de baixo.
            // Só quando o nome ficou visivelmente incompleto: termina pendurado,
            // tem parêntese aberto ou é uma lista de cidades depois do traço.
            const proxima = linhas[i + 1]
            const incompleto =
                /[,&/(–-]$/.test(nome) ||
                (nome.match(/\(/g)?.length ?? 0) > (nome.match(/\)/g)?.length ?? 0) ||
                /\s[–—]\s[^–—]*,[^–—]*$/.test(nome)
            if (incompleto && proxima && !rotuloDaLinha(proxima) && linhas[i + 2] && rotuloDaLinha(linhas[i + 2]) && proxima.texto.length <= 60 && !CODIGO.test(proxima.texto)) {
                nome = `${nome} ${proxima.texto.trim()}`
                pular = i + 1
            } else if (proxima && !rotuloDaLinha(proxima) && linhas[i + 2] && rotuloDaLinha(linhas[i + 2]) && /\s·\s/.test(proxima.texto)) {
                // Linha-resumo embaixo do nome ("Cash & carry · full range ·
                // food & non-food · retail + HoReCa"): é o tipo da empresa.
                rotuloAtual = "type"
                campos.set("type", [proxima.texto.trim()])
                pular = i + 1
            }
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

// ==================== FICHA LATERAL ====================
//
// DIY Reino Unido: sem cabeçalho de tabela. Cada empresa ocupa uma faixa da
// página com o nome e o perfil numa coluna à esquerda e os rótulos com
// dois-pontos ("Product groups:", "Website:", "Switchboard:") numa coluna à
// direita. A empresa começa na altura do rótulo que fica alinhado ao nome.

const ROTULO_COM_DOIS_PONTOS = /^[A-Z][\w /&()'’-]{1,40}:$/

function leadsDeFichasLaterais(linhas: Linha[]): LeadDoDiretorio[] {
    // A coluna dos rótulos: o x onde mais aparecem itens "Rótulo:".
    const porX = new Map<number, number>()
    for (const l of linhas) {
        for (const it of l.itens) {
            if (ROTULO_COM_DOIS_PONTOS.test(it.texto.trim())) {
                const x = Math.round(it.x / 4) * 4
                porX.set(x, (porX.get(x) ?? 0) + 1)
            }
        }
    }
    const [xRotulo, vezes] = [...porX.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0]
    if (vezes < 8) return []
    const naColunaDeRotulo = (it: ItemPosicionado) => it.x >= xRotulo - 6
    const naColunaDoNome = (it: ItemPosicionado) => it.x < xRotulo - 30

    // O rótulo que abre cada empresa: o que mais vezes divide a linha com um
    // item da coluna do nome ("Product groups:" ao lado de "Screwfix Direct Ltd").
    const abertura = new Map<string, number>()
    for (const l of linhas) {
        const rotulo = l.itens.find((it) => naColunaDeRotulo(it) && ROTULO_COM_DOIS_PONTOS.test(it.texto.trim()))
        if (rotulo && l.itens.some(naColunaDoNome)) {
            const t = rotulo.texto.trim().toLowerCase()
            abertura.set(t, (abertura.get(t) ?? 0) + 1)
        }
    }
    const [rotuloDeAbertura, quantas] = [...abertura.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0]
    if (quantas < 5) return []

    const leads: LeadDoDiretorio[] = []
    let secao: string | null = null
    let esquerda: string[] = []
    let direita: Linha[] = []
    let aberta = false

    const fechar = () => {
        if (aberta) {
            const lead = fichaLateralParaLead(esquerda, direita, secao)
            if (lead) leads.push(lead)
        }
        esquerda = []
        direita = []
        aberta = false
    }

    for (const linha of linhas) {
        const abre = linha.itens.some(
            (it) => naColunaDeRotulo(it) && it.texto.trim().toLowerCase() === rotuloDeAbertura
        )
        const largura = linha.itens.reduce((m, it) => Math.max(m, it.x + it.largura), 0) - linha.itens[0].x
        // Subseção ("A. DIY and home-improvement retail chains") ou parágrafo
        // corrido que atravessa as duas colunas encerra a empresa em curso.
        if (!abre && linha.itens.length === 1 && naColunaDoNome(linha.itens[0]) && largura > xRotulo) {
            fechar()
            if (/^[A-Z0-9]{1,2}[.)]\s/.test(linha.texto)) secao = linha.texto.trim().slice(0, 200)
            continue
        }
        if (abre) fechar()
        if (abre) aberta = true
        if (!aberta) continue

        const daEsquerda = linha.itens.filter(naColunaDoNome)
        const daDireita = linha.itens.filter((it) => !naColunaDoNome(it))
        if (daEsquerda.length) esquerda.push(daEsquerda.map((i) => i.texto.trim()).join(" "))
        if (daDireita.length) direita.push({ ...linha, itens: daDireita, texto: daDireita.map((i) => i.texto.trim()).join(" ") })
    }
    fechar()
    return leads
}

function fichaLateralParaLead(esquerda: string[], direita: Linha[], secao: string | null): LeadDoDiretorio | null {
    // Nome: as primeiras linhas da esquerda, enquanto continuam o nome
    // ("Screwfix Direct Ltd" / "(Kingfisher plc)", "Wickes Building
    // Supplies" / "Ltd"). O resto é o perfil.
    let fim = 1
    while (fim < esquerda.length) {
        const anterior = esquerda.slice(0, fim).join(" ")
        const proxima = esquerda[fim]
        const continua =
            /^\(/.test(proxima) ||
            (anterior.match(/\(/g)?.length ?? 0) > (anterior.match(/\)/g)?.length ?? 0) ||
            /[&,/–-]$/.test(anterior) ||
            (FORMA_JURIDICA.test(proxima) && proxima.split(/\s+/).length <= 3)
        if (!continua) break
        fim++
    }
    // Diretório numerado ("1. Castorama Polska Sp. z o.o.", DIY Polônia).
    const nome = esquerda.slice(0, fim).join(" ").replace(/\s+/g, " ").trim().replace(/^([A-Z]{1,2}\d{1,3}|\d{1,3})[.)]\s+/, "")
    if (nome.length < 2) return null
    const perfil = esquerda.slice(fim).join(" ").replace(/\s+/g, " ").trim() || null

    const campos = new Map<string, string[]>()
    let atual: string | null = null
    for (const l of direita) {
        const primeiro = l.itens[0].texto.trim()
        if (ROTULO_COM_DOIS_PONTOS.test(primeiro)) {
            atual = primeiro.replace(/:$/, "").toLowerCase()
            campos.set(atual, [...(campos.get(atual) ?? []), l.itens.slice(1).map((i) => i.texto.trim()).join(" ")])
        } else if (atual) {
            campos.get(atual)!.push(l.texto)
        }
    }
    const lead = fichaParaLead(nome, campos, secao)
    if (!lead) return null
    return {
        ...lead,
        // Linha em minúscula no fim do endereço é resto do campo seguinte
        // ("…Yeovil" / "BA22 8RT" / "the commercial/category buying team.").
        location: lead.location?.split("\n").filter((l) => !/^[a-z]/.test(l.trim())).join(", ") || null,
        // "Product groups:" é o que a empresa vende; o perfil da esquerda diz
        // o tipo ("Generalist for trade and serious DIY").
        companyType: perfil ? perfil.split(/\s+[–—-]\s+|[.;]/)[0].trim().slice(0, 120) || lead.companyType : lead.companyType,
        productPortfolio: [perfil, lead.productPortfolio].filter(Boolean).join("\n") || null,
    }
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

        // Com uma tabela aberta, cabeçalho novo tem de começar na mesma margem
        // da primeira coluna: texto da 2ª coluna nunca reabre a tabela.
        const cabecalho = colunasDoCabecalho(linha)
        if (cabecalho && (!colunas || Math.abs(cabecalho[0].x - colunas[0].x) <= 12)) {
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

        // Cada empresa tem um site só, na altura do nome. Um segundo site na
        // coluna de site, com nome na primeira coluna da mesma linha, abre
        // empresa nova mesmo sem vão: em tabelas sem respiro entre as linhas
        // (DIY Espanha) Leroy Merlin, Obramat e Bauhaus saíam numa linha só.
        // O segundo site tem de ser de OUTRA empresa (portal.profarma.com.br
        // e ri.profarma.com.br são da mesma), e o texto da primeira coluna
        // tem cara de nome: curto, sem "Type:", sem ponto final, e o nome
        // anterior não ficou com parêntese aberto.
        const colunaDoSite = colunas.findIndex((c) => /web|site|internet|contact|kontakt/i.test(c.rotulo))
        const coluna0 = (celulas as string[][] | null)?.[0].join(" ") ?? ""
        const nomeAberto = (coluna0.match(/\(/g)?.length ?? 0) > (coluna0.match(/\)/g)?.length ?? 0)
        const temNome =
            !nomeAberto &&
            linha.itens.some((i) => {
                const t = i.texto.trim()
                return colunaDoItem(colunas!, i.x) === 0 && /^[\p{Lu}\d"„]/u.test(t) && t.length <= 60 && !/:|\.$/.test(t)
            })
        const sitesAtuais = ((celulas as string[][] | null)?.[colunaDoSite] ?? [])
            .map((t) => primeiroSite(t).site)
            .filter((s): s is string => Boolean(s))
            .map(baseDoDominio)
        const siteNovo =
            colunaDoSite > 0 &&
            temNome &&
            sitesAtuais.length > 0 &&
            linha.itens.some((i) => {
                if (colunaDoItem(colunas!, i.x) !== colunaDoSite) return false
                const site = primeiroSite(i.texto).site
                return site != null && !sitesAtuais.includes(baseDoDominio(site))
            })

        for (const item of linha.itens) {
            const c = colunaDoItem(colunas, item.x)
            if (c === 0) {
                const vao = ultimoYColuna0 - linha.y
                const novaLinha = !celulas || vao > alturaDaLinha * 1.75 || (siteNovo && !((celulas as string[][])[0].length === 0))
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
    // Só conta empresa com site E nome com cara de nome: a leitura de tabela
    // que segue lendo fichas depois de uma tabela-resumo "acha" sites com
    // nomes como "Pernigotti and Vergani chocolates, Italian wines (…".
    const plausivel = (l: LeadDoDiretorio) =>
        Boolean(l.website) &&
        l.companyName.length <= 70 &&
        (l.companyName.match(/,/g)?.length ?? 0) <= 2 &&
        // Pedaço de nome ("Sixty60)") tem parêntese desequilibrado.
        (l.companyName.match(/\(/g)?.length ?? 0) === (l.companyName.match(/\)/g)?.length ?? 0) &&
        // Rótulo de ficha lido como nome ("Switchboard / head office").
        !(PALAVRA_DE_ROTULO.test(l.companyName) && l.companyName.split(/\s+/).length <= 5)
    const comSite = (lista: LeadDoDiretorio[]) => lista.filter(plausivel).length
    const usarFichas = comSite(fichas) > 0 && comSite(fichas) >= comSite(leads)
    // Estudo de fichas que fecha com uma tabela (África do Sul: "Retail group
    // | Focus | Switchboard | Supplier page"): as linhas plausíveis da tabela
    // que as fichas não têm entram também.
    const dasFichas = new Set(fichas.map(chave))
    const melhorDosDois = usarFichas
        ? [...fichas, ...leads.filter((l) => plausivel(l) && !dasFichas.has(chave(l)))]
        : leads
    // Terceiro formato: nome à esquerda, rótulos à direita (DIY Reino Unido).
    // Só entra quando acha claramente mais empresas que os outros dois.
    const laterais = leadsDeFichasLaterais(doDiretorio.filter((l) => !RODAPE.test(l.texto) && !corrido(l)))
    const escolhidos = comSite(laterais) > comSite(melhorDosDois) * 1.2 + 2 ? laterais : melhorDosDois

    // A mesma empresa pode aparecer na tabela-resumo e na detalhada.
    const unicos = new Map<string, LeadDoDiretorio>()
    for (const lead of escolhidos) {
        const k = chave(lead)
        unicos.set(k, unicos.has(k) ? mesclar(unicos.get(k)!, lead) : lead)
    }
    return [...unicos.values()]
}
