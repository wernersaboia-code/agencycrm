/**
 * Compara uma exportação do Google Search Console contra a linha de base de
 * 02.09.2026 — a última leitura ANTES das cinco correções de indexação que
 * foram ao ar em 04.09.2026.
 *
 * Por que existe: em 04.09 o Werner reexportou tudo e os números de indexação
 * vieram byte a byte iguais aos da semana anterior. Não era resultado nenhum,
 * era a janela do relatório que ainda terminava em 27.08 — oito dias antes das
 * correções. Olhar CSV a olho nu não pega isso: os números "parecem" uma
 * resposta. Este script recusa a leitura quando a janela não alcança a data
 * das correções, que é a única pergunta que precisa ser feita primeiro.
 *
 * Duas decisões de implementação que não são detalhe:
 *
 * 1. Os arquivos são identificados pelo CABEÇALHO, nunca pelo nome. O GSC
 *    exporta tudo como "Gráfico.csv", "Gráfico(1).csv", "Gráfico(5).csv", e a
 *    numeração depende da ordem em que a pessoa clicou em exportar — o mesmo
 *    relatório troca de nome entre uma exportação e outra.
 *
 * 2. O desempenho NÃO é comparado por total. O relatório é uma janela móvel de
 *    3 meses: somar tudo dos dois lados compara períodos diferentes e produz
 *    uma variação que não quer dizer nada. O script mostra os dias NOVOS, que
 *    é a informação que de fato chegou.
 *
 * Uso: node scripts/comparar-gsc.mjs "C:/Projetos/Easy Prospect/Google Search Console"
 */

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Linha de base conferida em 04.09.2026 sobre a exportação de 02.09.2026.
 * Não mexer: é o "antes" do experimento. Uma linha de base reescrita a cada
 * leitura não é linha de base nenhuma.
 */
const BASE = {
    rotulo: "02.09.2026",
    // Data em que as correções foram publicadas. Enquanto a janela do
    // relatório de indexação não passar daqui, não há o que comparar.
    correcoesEm: "2026-09-04",
    indexacaoAte: "2026-08-27",
    desempenhoAte: "2026-09-02",
    naoIndexadas: 331,
    indexadas: 158,
    motivos: {
        "Página com redirecionamento": 7,
        'Excluída pela tag "noindex"': 4,
        "Cópia sem página canônica selecionada pelo usuário": 4,
        "Página alternativa com tag canônica adequada": 2,
        "Detectada, mas não indexada no momento": 312,
        "Rastreada, mas não indexada no momento": 2,
    },
    // Do relatório de Desempenho, janela terminando em 02.09.2026.
    cliques: 0,
    impressoes: 170,
    paginasComImpressao: 36,
    fichasComImpressao: 15,
    urlsRedirecionamento: 7,
}

// ── CSV ──────────────────────────────────────────────────────────────────────
// Parser próprio, e não split(","): o relatório de motivos traz aspas escapadas
// dentro do campo (`"Excluída pela tag ""noindex"""`) e vírgula dentro de campo
// citado (`"Detectada, mas não indexada no momento"`).
function lerCsv(caminho) {
    const bruto = readFileSync(caminho, "utf8").replace(/^\uFEFF/, "")
    const linhas = []
    let campo = ""
    let linha = []
    let dentroDeAspas = false

    for (let i = 0; i < bruto.length; i++) {
        const c = bruto[i]

        if (dentroDeAspas) {
            if (c === '"') {
                if (bruto[i + 1] === '"') {
                    campo += '"'
                    i++
                } else {
                    dentroDeAspas = false
                }
            } else {
                campo += c
            }
            continue
        }

        if (c === '"') dentroDeAspas = true
        else if (c === ",") {
            linha.push(campo)
            campo = ""
        } else if (c === "\n") {
            linha.push(campo)
            linhas.push(linha)
            linha = []
            campo = ""
        } else if (c !== "\r") campo += c
    }

    if (campo !== "" || linha.length > 0) {
        linha.push(campo)
        linhas.push(linha)
    }

    return linhas.filter((l) => l.some((c) => c.trim() !== ""))
}

/** Que relatório é este, pelo cabeçalho. Ver decisão 1 no topo. */
function classificar(cabecalho) {
    const h = cabecalho.map((c) => c.trim()).join("|")

    if (h.startsWith("Motivo|Fonte|Validação|Páginas")) return "motivos"
    if (h.startsWith("Data|Não indexadas|Indexados")) return "cobertura"
    if (h.startsWith("Data|Cliques|Impressões")) return "desempenhoSerie"
    if (h.startsWith("Top consultas|")) return "consultas"
    if (h.startsWith("Páginas principais|")) return "paginas"
    if (h.startsWith("País|")) return "paises"
    if (h.startsWith("URL|Último rastreamento")) return "urlsDoProblema"
    if (h.startsWith("Data|Páginas afetadas")) return "serieDoProblema"
    if (h.startsWith("Aspecto da pesquisa|")) return "aspectos"

    return null
}

function carregar(pasta) {
    const encontrados = {}

    for (const nome of readdirSync(pasta).filter((n) => n.toLowerCase().endsWith(".csv"))) {
        const linhas = lerCsv(join(pasta, nome))
        if (linhas.length === 0) continue

        const tipo = classificar(linhas[0])
        if (!tipo) continue

        const corpo = linhas.slice(1)
        // Exportação vazia (relatório sem linhas) não substitui uma com dados:
        // o GSC exporta os dois formatos e o vazio costuma vir por último.
        if (corpo.length === 0 && encontrados[tipo]) continue

        encontrados[tipo] = { arquivo: nome, linhas: corpo }
    }

    return encontrados
}

// ── Relatório ────────────────────────────────────────────────────────────────
/**
 * O GSC exporta posição com ponto decimal ("13.4", "7.68") e contagem sem
 * separador. Tratar "." como milhar — o reflexo em pt-BR — transformava a
 * posição 13.4 em 134 e bagunçava toda ordenação por posição. Só assume
 * milhar quando existe vírgula decimal no fim, que é a marca do formato
 * pt-BR ("1.234,56").
 */
function num(v) {
    const s = String(v ?? "").trim().replace(/%/g, "")
    if (s === "") return 0
    if (/,\d{1,2}$/.test(s)) return Number(s.replace(/\./g, "").replace(",", ".")) || 0
    return Number(s.replace(/,/g, "")) || 0
}

const seta = (base, agora) => (agora === base ? "=" : agora < base ? `▼ ${base - agora}` : `▲ ${agora - base}`)

function comparar(pasta) {
    const d = carregar(pasta)
    const linhasSaida = []
    const diga = (s = "") => linhasSaida.push(s)

    diga(`Linha de base: ${BASE.rotulo}   |   Correções publicadas: ${BASE.correcoesEm}`)
    diga("=".repeat(74))

    // 1. A pergunta que vem antes de todas: a janela alcançou as correções?
    const cobertura = d.cobertura?.linhas ?? []
    const ultimaIndexacao = cobertura.at(-1)?.[0] ?? "(sem dados)"
    diga()
    diga(`INDEXAÇÃO — janela até ${ultimaIndexacao} (base: ${BASE.indexacaoAte})`)

    const alcancou = ultimaIndexacao >= BASE.correcoesEm
    if (!alcancou) {
        diga()
        diga("  ⚠  A janela termina ANTES das correções. Este export não testa nada.")
        diga("     Os números abaixo são o mesmo retrato de antes, não um resultado.")
        diga("     Reexportar só a Indexação de páginas quando a série passar de")
        diga(`     ${BASE.correcoesEm}.`)
    }

    diga()
    for (const [motivo, base] of Object.entries(BASE.motivos)) {
        const linha = (d.motivos?.linhas ?? []).find((l) => l[0].trim() === motivo)
        const agora = linha ? num(linha[3]) : 0
        diga(`  ${motivo.padEnd(52)} ${String(base).padStart(4)} → ${String(agora).padStart(4)}  ${seta(base, agora)}`)
    }

    const ultima = cobertura.at(-1)
    if (ultima) {
        diga()
        diga(`  ${"Não indexadas".padEnd(52)} ${String(BASE.naoIndexadas).padStart(4)} → ${String(num(ultima[1])).padStart(4)}  ${seta(BASE.naoIndexadas, num(ultima[1]))}`)
        diga(`  ${"Indexadas".padEnd(52)} ${String(BASE.indexadas).padStart(4)} → ${String(num(ultima[2])).padStart(4)}  ${seta(BASE.indexadas, num(ultima[2]))}`)
    }

    // 2. Hipótese sob teste: a paginação era o gargalo de descoberta?
    diga()
    diga("HIPÓTESE — paginação do catálogo (corrigida em 1a37420)")
    const paginas = d.paginas?.linhas ?? []
    const fichas = paginas.filter((l) => /\/list\//.test(l[0]))
    const paginadas = paginas.filter((l) => /[?&]page=/.test(l[0]))

    diga(`  Fichas de estudo com impressão            ${String(BASE.fichasComImpressao).padStart(4)} → ${String(fichas.length).padStart(4)}  ${seta(BASE.fichasComImpressao, fichas.length)}`)
    diga(`  Páginas distintas com impressão           ${String(BASE.paginasComImpressao).padStart(4)} → ${String(paginas.length).padStart(4)}  ${seta(BASE.paginasComImpressao, paginas.length)}`)
    diga(`  URLs ?page=N aparecendo                      -  → ${String(paginadas.length).padStart(4)}`)
    diga()
    diga("  Leitura: se as fichas subirem e a 'Detectada' cair, a hipótese se")
    diga("  confirma. Se as duas ficarem paradas, o gargalo é demanda de")
    diga("  rastreio (autoridade/backlinks), não descoberta — e aí não há")
    diga("  correção de código que resolva.")

    // 3. Desempenho: só os dias novos. Ver decisão 2 no topo.
    const serie = d.desempenhoSerie?.linhas ?? []
    const novos = serie.filter((l) => l[0] > BASE.desempenhoAte)
    diga()
    diga(`DESEMPENHO — ${novos.length} dia(s) novo(s) desde ${BASE.desempenhoAte}`)
    if (novos.length === 0) {
        diga("  (nenhum — a janela de desempenho também não avançou)")
    } else {
        const cliques = novos.reduce((s, l) => s + num(l[1]), 0)
        const impressoes = novos.reduce((s, l) => s + num(l[2]), 0)
        diga(`  Cliques nos dias novos: ${cliques}   |   Impressões: ${impressoes}`)
        diga()
        for (const l of novos) {
            diga(`    ${l[0]}   cliques ${String(num(l[1])).padStart(3)}   impressões ${String(num(l[2])).padStart(4)}   posição ${l[4] || "—"}`)
        }
    }

    // 4. Marca x produto: separa a busca pelo nome do resto.
    const consultas = d.consultas?.linhas ?? []
    if (consultas.length > 0) {
        const eMarca = (q) => /easy\s?prospect/i.test(q)
        const marca = consultas.filter((l) => eMarca(l[0]))
        const produto = consultas.filter((l) => !eMarca(l[0]))
        const somar = (ls, i) => ls.reduce((s, l) => s + num(l[i]), 0)
        const impMarca = somar(marca, 2)
        const impProduto = somar(produto, 2)
        const total = impMarca + impProduto

        diga()
        diga("CONSULTAS — marca x produto")
        diga(`  Marca ("easy prospect" e variações)   ${String(impMarca).padStart(4)} impressões  (${total ? Math.round((impMarca / total) * 100) : 0}%)  ${somar(marca, 1)} cliques`)
        diga(`  Produto (todo o resto)                ${String(impProduto).padStart(4)} impressões  (${total ? Math.round((impProduto / total) * 100) : 0}%)  ${somar(produto, 1)} cliques`)
        diga()
        diga("  Top consultas de produto por posição:")
        for (const l of produto.sort((a, b) => num(a[4]) - num(b[4])).slice(0, 8)) {
            diga(`    pos ${String(l[4]).padStart(6)}   ${String(num(l[2])).padStart(3)} impr   ${l[0]}`)
        }
    }

    // 5. As 7 URLs de redirecionamento: quais saíram.
    const urls = d.urlsDoProblema?.linhas ?? []
    if (urls.length > 0) {
        diga()
        diga(`REDIRECIONAMENTOS — ${BASE.urlsRedirecionamento} → ${urls.length}  ${seta(BASE.urlsRedirecionamento, urls.length)}`)
        for (const l of urls) diga(`    ${l[0]}   (rastreada em ${l[1]})`)
        diga()
        diga("  /my-purchases e /de/my-purchases devem sair (corrigidas).")
        diga("  /it/, /en/, apex, http e /$ são comportamento correto ou artefato:")
        diga("  saem sozinhas quando o Google recrawlear, ou com 'Validar correção'.")
    }

    diga()
    diga("=".repeat(74))
    diga(`Arquivos lidos: ${Object.entries(d).map(([t, v]) => `${t}=${v.arquivo}`).join(", ") || "nenhum reconhecido"}`)

    return linhasSaida.join("\n")
}

const pasta = process.argv[2]
if (!pasta) {
    console.error('Uso: node scripts/comparar-gsc.mjs "<pasta com os CSV do GSC>"')
    process.exit(1)
}

console.log(comparar(pasta))
