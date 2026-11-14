// scripts/resumos/formatar.mjs
//
// Converte os resumos dos estudos (texto puro colado do PDF) em HTML com
// estrutura e ênfase. NÃO grava no banco: lê o backup e escreve um JSON.
//
// Uso:
//   node scripts/resumos/formatar.mjs <backup.json> <anotacoes.json> <saida.json> [slug...]
//
// A estrutura (títulos, listas, sumário, FAQ, fichas de exemplo) sai de regras.
// A ênfase e as quebras de parágrafo são decisão editorial e vêm do arquivo de
// anotações, por slug:
//   { "b": ["trecho em negrito"], "i": ["trecho em itálico"],
//     "q": ["Início da frase que abre parágrafo novo"],
//     "t": ["Linha que é título"],
//     "x": ["lixo do PDF a remover"], "s": [["de", "para"]] }
// ou { "html": "<p>…</p>" } quando o resumo foi reescrito à mão.
//
// No fim, cada resumo é conferido: as palavras do HTML têm de ser as mesmas do
// texto original, descontado só o que foi removido de propósito.

import { readFileSync, writeFileSync } from "node:fs"
import sanitizeHtml from "sanitize-html"

const [, , arqBackup, arqAnotacoes, arqSaida, ...soEstes] = process.argv
const backup = JSON.parse(readFileSync(arqBackup, "utf8"))
const anotacoes = JSON.parse(readFileSync(arqAnotacoes, "utf8"))

// ---------------------------------------------------------------------------
// Vocabulário
// ---------------------------------------------------------------------------

const TITULOS = [
    "Table of Contents", "Contents", "Chapters",
    "Who this study is for", "What the study covers", "What the market analysis covers",
    "Market insights covered", "What the directory contains",
    "Sample entries from the directory", "Example entries from the directory",
    "Use of the contact data", "Market access requirements covered",
    "Frequently asked questions", "FAQ",
    "Key takeaways for foreign suppliers",
]
const EH_SUMARIO = /^(table of contents|contents|chapters)$/i
const EH_FAQ = /^(frequently asked questions|faq)$/i

const ROTULOS_DA_FICHA = [
    "Company", "Type", "Profile", "Description", "Website", "Address",
    "General e-mail", "Switchboard", "Supplier channel",
    "Decision-maker (public sources)", "Personal e-mails", "Best first contact",
]

const B0 = "\u0001", B1 = "\u0002", I0 = "\u0003", I1 = "\u0004", BR = "\u0005"

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const escaparHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// ---------------------------------------------------------------------------
// Etapa 1 — texto em blocos
// ---------------------------------------------------------------------------

function emBlocos(texto, nota, avisos) {
    // Travessão colado na palavra seguinte ("parents –the buyers"): erro de
    // extração do PDF. Só entra o espaço; nenhuma palavra muda.
    let t = texto.replace(/\r/g, "").replace(/(\s)–(?=[a-z])/g, "$1– ")

    for (const lixo of nota.x ?? []) {
        if (!t.includes(lixo)) avisos.push(`x não encontrado: ${lixo}`)
        t = t.replace(lixo, "")
    }
    for (const [de, para] of nota.s ?? []) {
        if (!t.includes(de)) avisos.push(`s não encontrado: ${de}`)
        t = t.replace(de, para)
    }
    for (const inicio of nota.q ?? []) {
        const alvo = " " + inicio
        if (!t.includes(alvo)) avisos.push(`q não encontrado: ${inicio}`)
        t = t.replace(alvo, "\n\n" + inicio)
    }

    let blocos = t.split(/\n{2,}/).map((b) => b.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean)

    // Título grudado no parágrafo ("What the directory contains 34 companies…").
    blocos = blocos.flatMap((b) => {
        for (const titulo of TITULOS) {
            const m = new RegExp(`^(${escaparRegex(titulo)})[:?]?\\s+(?:[-–]\\s+)?(?=\\S)`, "i").exec(b)
            if (m && b.length > m[0].length) {
                const resto = b.slice(m[0].length)
                // "Sample entries from the directory (data partly masked…)" é
                // uma frase só, não título + parágrafo.
                if (/^\(/.test(resto)) return [b]
                const comHifen = /[-–]\s+$/.test(m[0])
                return [m[1], (comHifen ? "- " : "") + resto]
            }
        }
        return [b]
    })

    // Texto de abertura grudado na primeira ficha de exemplo.
    blocos = blocos.flatMap((b) => {
        const i = b.indexOf(" Sample entry from ")
        return i > 0 ? [b.slice(0, i), b.slice(i + 1)] : [b]
    })

    // Marcadores achatados dentro do parágrafo.
    blocos = blocos.flatMap((b) => {
        // "…first contact: - Chains: 9 - Garden centres: 3"
        const comHifens = /^(.*?:)\s+-\s+(.+)$/.exec(b)
        if (comHifens && !b.includes("•")) {
            const itens = comHifens[2].split(/\s+-\s+(?=[A-Z0-9])/)
            if (itens.length >= 2) return [comHifens[1], ...itens.map((i) => "• " + i.trim())]
        }
        // "Chains: 8 Garden centres: 5 Online platforms: 3" (contagem por categoria)
        const contagens = b.split(/(?<=:\s\d{1,3})\s+(?=[A-Z])/)
        if (contagens.length >= 3 && contagens.every((c) => /:\s\d{1,3}$/.test(c) && c.length < 140)) {
            return contagens.map((c) => "• " + c.replace(/^[A-Z]\.\s+/, (l) => l))
        }
        // "A. … : 9 B. … : 5" fora de um sumário
        if (/^A\.\s/.test(b) && /\sB\.\s/.test(b) && /:\s\d/.test(b)) {
            return separarLetras(b).map((c) => "• " + c)
        }
        if (b.includes("•")) {
            const [antes, ...itens] = b.split(/\s*•\s+/)
            return [antes.trim(), ...itens.map((i) => "• " + i.trim())].filter(Boolean)
        }
        if (/^-\s+/.test(b)) {
            return b.slice(1).trim().split(/\s+-\s+(?=[A-Z0-9])/).map((i) => "• " + i.trim())
        }
        return [b]
    })

    return blocos
}

// ---------------------------------------------------------------------------
// Etapa 2 — sumário
// ---------------------------------------------------------------------------

const PONTILHADO = /\s*\.{4,}[.\s]*\d*\s*$/
const NUMERADA = /^(\d+\.|\d+(\.(\d+|[A-Z]))+\.?|[A-Z]\.|Annex|Appendix)\s+\S/

function linhaDeSumario(bloco) {
    const pontilhada = PONTILHADO.test(bloco)
    const texto = bloco.replace(PONTILHADO, "").trim()
    return { texto, pontilhada, numerada: NUMERADA.test(texto) && texto.length < 220 }
}

/** "A. … B. … C. …" numa linha só vira uma entrada por letra. */
function separarLetras(texto) {
    if (!/^A\.\s/.test(texto) || !/\sB\.\s/.test(texto)) return [texto]
    const partes = []
    let resto = texto
    for (let c = 66; c <= 90; c++) {
        const i = resto.indexOf(` ${String.fromCharCode(c)}. `)
        if (i < 0) break
        partes.push(resto.slice(0, i))
        resto = resto.slice(i + 1)
    }
    partes.push(resto)
    return partes
}

function htmlDoSumario(entradas) {
    const grupos = []
    for (const e of entradas) {
        const principal = /^\d+\.?\s/.test(e) || !NUMERADA.test(e)
        if (principal || grupos.length === 0) grupos.push([e])
        else grupos[grupos.length - 1].push(e)
    }
    return grupos
        .map(([cabeca, ...subs]) =>
            `<p><strong>${escaparHtml(cabeca)}</strong>${subs.map((s) => "<br>" + escaparHtml(s)).join("")}</p>`)
        .join("")
}

// ---------------------------------------------------------------------------
// Etapa 3 — ênfase dentro de um bloco
// ---------------------------------------------------------------------------

function comEnfase(texto, nota, usados) {
    let t = texto
    for (const [lista, a, f] of [[nota.b ?? [], B0, B1], [nota.i ?? [], I0, I1]]) {
        for (const trecho of lista) {
            const chave = a + trecho
            if (usados.has(chave)) continue
            const i = t.indexOf(trecho)
            if (i < 0) continue
            // Não abre ênfase dentro de outra já aberta.
            const antes = t.slice(0, i)
            const aberto = (c0, c1) => antes.lastIndexOf(c0) > antes.lastIndexOf(c1)
            if (aberto(a, f)) { usados.add(chave); continue }
            t = antes + a + trecho + f + t.slice(i + trecho.length)
            usados.add(chave)
        }
    }
    return t
}

function paraHtml(texto) {
    return escaparHtml(texto)
        .replaceAll(B0, "<strong>").replaceAll(B1, "</strong>")
        .replaceAll(I0, "<em>").replaceAll(I1, "</em>")
        .replaceAll(BR, "<br>")
}

/** "Market size: …" no começo do item ou do parágrafo. */
function rotuloInicial(texto) {
    const m = /^([A-Z0-9][^:.!?•]{1,88}):\s+(?=\S)/.exec(texto)
    if (!m) return texto
    if (/https?$|www/i.test(m[1])) return texto
    return `${B0}${m[1]}:${B1} ${texto.slice(m[0].length)}`
}

/** "Market volume. Based on…" — rótulo de até duas palavras fechado por ponto. */
const ROTULO_PONTO = /^([A-Z][a-z-]+(?: [a-z-]+)?)\.\s+(?=[A-Z])/

function fichaDeExemplo(texto) {
    const padrao = new RegExp(`\\s(${ROTULOS_DA_FICHA.map(escaparRegex).join("|")}):\\s`, "g")
    const primeiro = padrao.exec(texto)
    if (!primeiro) return null
    const cabeca = texto.slice(0, primeiro.index).trim()
    const corpo = texto.slice(primeiro.index).replace(padrao, (_, r) => `${BR}${B0}${r}:${B1} `)
    return (cabeca ? `${B0}${cabeca}${B1}` : "") + (cabeca ? corpo : corpo.slice(BR.length))
}

// ---------------------------------------------------------------------------
// Etapa 4 — montagem
// ---------------------------------------------------------------------------

function formatar(item) {
    const nota = anotacoes[item.slug] ?? {}
    const avisos = []

    // Resumo reescrito à mão (o texto do banco não era um resumo): entra como
    // está, só passa pelo mesmo sanitizador do site.
    if (nota.html) {
        const limpo = sanitizeHtml(nota.html, {
            allowedTags: ["a", "b", "br", "del", "em", "h2", "h3", "h4", "i", "li", "ol", "p", "s", "strong", "u", "ul"],
            allowedAttributes: { a: ["href", "title", "target"] },
        }).replace(/<br \/>/g, "<br>")
        if (limpo !== nota.html) avisos.push("o sanitizador do site alteraria o HTML reescrito")
        return { id: item.id, slug: item.slug, html: nota.html, avisos }
    }
    const usados = new Set()
    const blocos = emBlocos(item.introduction, nota, avisos)
    const titulosExtras = new Set(nota.t ?? [])

    const ehTitulo = (b) =>
        titulosExtras.has(b) ||
        TITULOS.some((t) => new RegExp(`^${escaparRegex(t)}[:?]?$`, "i").test(b))

    const rotulosComPonto = blocos.filter((b) => b.length > 150 && ROTULO_PONTO.test(b)).length >= 3

    /** Segmentos: { tipo: "corpo" | "sumario", html } */
    const segmentos = []
    let corpo = []
    let listaAberta = false
    let emFaq = false
    let emExemplos = false
    let removido = ""

    const fecharLista = () => { if (listaAberta) { corpo.push("</ul>"); listaAberta = false } }
    const fecharCorpo = () => {
        fecharLista()
        if (corpo.length) segmentos.push({ tipo: "corpo", html: corpo.join("") })
        corpo = []
    }
    const paragrafo = (t) => { fecharLista(); corpo.push(`<p>${paraHtml(comEnfase(t, nota, usados))}</p>`) }
    const titulo = (t) => { fecharLista(); corpo.push(`<h3>${escaparHtml(t.replace(/[:]$/, ""))}</h3>`) }

    for (let n = 0; n < blocos.length; n++) {
        const bloco = blocos[n]
        const proximo = blocos[n + 1]

        // --- sumário -------------------------------------------------------
        const linha = linhaDeSumario(bloco)
        const tituloDeSumario = ehTitulo(bloco) && EH_SUMARIO.test(bloco.replace(/[:?]$/, ""))
        if (tituloDeSumario || linha.pontilhada || (linha.numerada && !bloco.startsWith("•"))) {
            const entradas = []
            const cabeca = tituloDeSumario ? bloco.replace(/[:]$/, "") : null
            let m = tituloDeSumario ? n + 1 : n
            let temPontilhado = false
            for (; m < blocos.length; m++) {
                const l = linhaDeSumario(blocos[m])
                const seguinte = blocos[m + 1] ? linhaDeSumario(blocos[m + 1]) : null
                const seguinteEhSumario = !!seguinte && (seguinte.pontilhada || seguinte.numerada)
                if (l.pontilhada) { temPontilhado = true }
                else if (l.numerada) {
                    // Num sumário pontilhado, linha numerada SEM pontilhado e
                    // seguida de prosa é o título do capítulo, não o sumário.
                    if (temPontilhado && !seguinteEhSumario) break
                }
                else if (/^A\.\s/.test(l.texto) && /\sB\.\s/.test(l.texto)) { /* lista de letras */ }
                else if (/^Important legal notice/i.test(l.texto) && entradas.length) { /* entrada sem número */ }
                else break

                const anterior = entradas[entradas.length - 1]
                const continuacao = !l.numerada && l.pontilhada && anterior?.aberta
                if (continuacao) {
                    anterior.texto += " " + l.texto
                    anterior.aberta = false
                } else {
                    for (const parte of separarLetras(l.texto)) {
                        entradas.push({ texto: parte, aberta: temPontilhado && !l.pontilhada })
                    }
                }
            }

            const ehSumario = cabeca !== null || entradas.length >= 3
            if (ehSumario && entradas.length) {
                fecharCorpo()
                segmentos.push({
                    tipo: "sumario",
                    html: `<h3>${escaparHtml(cabeca ?? "Table of Contents")}</h3>` +
                        htmlDoSumario(entradas.map((e) => e.texto)),
                    inventado: cabeca === null,
                })
                n = m - 1
                emFaq = false
                continue
            }

            // Linha numerada solta seguida de prosa: título de capítulo.
            if (linha.numerada && /^\d/.test(linha.texto) && proximo && proximo.length > 150) {
                const semNumero = linha.texto.replace(/^\S+\s+/, "")
                removido += " " + linha.texto.slice(0, linha.texto.length - semNumero.length)
                // "Executive Summary" abrindo o resumo repete o título da seção.
                const abreOResumo = !segmentos.some((s) => s.tipo === "corpo") && corpo.length === 0
                if (abreOResumo && /^executive summary$/i.test(semNumero)) removido += " " + semNumero
                else titulo(semNumero)
                continue
            }
        }

        // --- títulos -------------------------------------------------------
        if (ehTitulo(bloco)) {
            emExemplos = /^(sample|example) entries/i.test(bloco)
            emFaq = EH_FAQ.test(bloco.replace(/[:?]$/, ""))
            titulo(bloco.replace(/\?$/, emFaq ? "?" : ""))
            continue
        }
        // "Key findings for foreign suppliers:" antes de uma lista.
        if (bloco.length <= 70 && bloco.endsWith(":") && proximo?.startsWith("•")) {
            titulo(bloco)
            continue
        }

        // --- lista ---------------------------------------------------------
        if (bloco.startsWith("•")) {
            if (!listaAberta) { corpo.push("<ul>"); listaAberta = true }
            const texto = rotuloInicial(bloco.replace(/^•\s*/, ""))
            corpo.push(`<li>${paraHtml(comEnfase(texto, nota, usados))}</li>`)
            continue
        }

        // --- FAQ -----------------------------------------------------------
        if (emFaq) {
            const frases = bloco.split(/(?<=[.?!])\s+(?=[A-Z])/)
            let atual = null
            const fechar = () => { if (atual) paragrafo(atual); atual = null }
            for (const frase of frases) {
                if (frase.endsWith("?")) { fechar(); atual = `${B0}${frase}${B1}` }
                else atual = atual ? `${atual} ${frase}` : frase
            }
            fechar()
            continue
        }

        // --- ficha de exemplo ------------------------------------------------
        if (/\sCompany:\s/.test(bloco)) {
            const ficha = fichaDeExemplo(bloco)
            if (ficha) { paragrafo(ficha); continue }
        }

        // --- parágrafo -------------------------------------------------------
        let texto = bloco
        const abreExemplos = /^((?:Sample|Example) entries[^(:.]*?)(\s*[(:])/.exec(texto)
        if (abreExemplos) {
            emExemplos = true
            paragrafo(`${B0}${abreExemplos[1]}${B1}${texto.slice(abreExemplos[1].length)}`)
            continue
        }
        if (emExemplos) {
            // "Empresa S.A. – tipo, cidade. Website: …": o nome abre a ficha.
            const inicio = texto.slice(0, 90)
            const corte = /\s[-–]\s/.exec(inicio)?.index ?? /,\s/.exec(inicio)?.index
            if (corte && /Website|www\./.test(texto)) {
                const numero = /^\d+\.\s+/.exec(texto)?.[0] ?? ""
                paragrafo(`${numero}${B0}${texto.slice(numero.length, corte)}${B1}${texto.slice(corte)}`)
                continue
            }
            emExemplos = false
        }
        if (rotulosComPonto) texto = texto.replace(ROTULO_PONTO, (_, r) => `${B0}${r}.${B1} `)
        else if (/^(Important|Please note|Note on scope|Overview|By profile)[^:]{0,20}:\s/.test(texto)) texto = rotuloInicial(texto)
        paragrafo(texto)
    }
    fecharCorpo()

    // Sumário que abria o resumo vai para o fim: primeiro o argumento, depois o índice.
    const primeiro = segmentos[0]
    if (primeiro?.tipo === "sumario" && segmentos.length > 1) {
        segmentos.push(segmentos.shift())
    }

    const html = segmentos.map((s) => s.html).join("")

    // --- conferências --------------------------------------------------------
    for (const [lista, a] of [[nota.b ?? [], B0], [nota.i ?? [], I0]]) {
        for (const trecho of lista) if (!usados.has(a + trecho)) avisos.push(`ênfase não aplicada: ${trecho}`)
    }

    const limpo = sanitizeHtml(html, {
        allowedTags: ["a", "b", "br", "del", "em", "h2", "h3", "h4", "i", "li", "ol", "p", "s", "strong", "u", "ul"],
        allowedAttributes: { a: ["href", "title", "target"] },
    })
    const igual = (h) => h.replace(/<br \/>/g, "<br>").replace(/&quot;/g, '"')
    if (igual(limpo) !== igual(html)) avisos.push("o sanitizador do site alteraria o HTML")

    const palavras = (s) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    const contagem = (lista) => lista.reduce((m, p) => m.set(p, (m.get(p) ?? 0) + 1), new Map())
    const visivel = sanitizeHtml(html.replace(/<(br|\/p|\/li|\/h3)>/g, " "), { allowedTags: [], allowedAttributes: {} })
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    const antes = contagem(palavras(item.introduction))
    const depois = contagem(palavras(visivel))
    const tirado = contagem(palavras([removido, ...(nota.x ?? []), ...(nota.s ?? []).map((p) => p[0])].join(" ")))
    const posto = contagem(palavras((nota.s ?? []).map((p) => p[1]).join(" ") +
        (segmentos.some((s) => s.inventado) ? " table of contents" : "")))
    const sumiu = [], surgiu = []
    for (const p of new Set([...antes.keys(), ...depois.keys()])) {
        const d = (depois.get(p) ?? 0) - (antes.get(p) ?? 0)
        const esperado = (posto.get(p) ?? 0) - (tirado.get(p) ?? 0)
        // Número de página do sumário pontilhado some de propósito.
        if (d < esperado && !/^\d{1,3}$/.test(p)) sumiu.push(p)
        if (d > esperado) surgiu.push(p)
    }
    if (sumiu.length) avisos.push(`palavras que sumiram: ${sumiu.join(", ")}`)
    if (surgiu.length) avisos.push(`palavras que surgiram: ${surgiu.join(", ")}`)

    return { id: item.id, slug: item.slug, html, avisos }
}

// ---------------------------------------------------------------------------

const alvo = soEstes.length ? backup.filter((i) => soEstes.some((s) => i.slug.startsWith(s))) : backup
const resultado = alvo.map(formatar)

writeFileSync(arqSaida, JSON.stringify(resultado, null, 2), "utf8")

const comAviso = resultado.filter((r) => r.avisos.length)
for (const r of comAviso) console.log(`\n${r.slug}\n  - ${r.avisos.join("\n  - ")}`)
console.log(`\n${resultado.length} resumos formatados, ${comAviso.length} com aviso → ${arqSaida}`)
