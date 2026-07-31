import sanitizeHtml from "sanitize-html"

/**
 * Limpeza de HTML colado de Word, Google Docs e saídas de IA.
 *
 * Isto NÃO é sanitização de segurança — quem faz isso é
 * `lib/utils/html-sanitizer.ts`, que roda depois desta função no servidor e é
 * a última palavra. Aqui o assunto é consistência visual: o `style` passa
 * inteiro pelo sanitizador (`parseStyleAttributes: false`), então sem esta
 * limpeza um post colado carrega Calibri 11pt e azul #1F497D para dentro do
 * tema do site.
 *
 * Regra que não se quebra: nenhuma linha daqui altera texto visível. Só
 * marcação.
 */

/** O que sobrevive: só o que carrega intenção do autor, não aparência herdada. */
const PROPRIEDADES_MANTIDAS = ["text-align"]

function ehNegrito(style: string): boolean {
    return /font-weight\s*:\s*(bold|[6-9]00)/i.test(style)
}

function ehItalico(style: string): boolean {
    return /font-style\s*:\s*italic/i.test(style)
}

/** O Google Docs cola `font-weight:normal`/`font-style:normal` — ausência de ênfase, não presença. */
function ehPesoOuEstiloNormal(style: string): boolean {
    return /font-weight\s*:\s*normal/i.test(style) || /font-style\s*:\s*normal/i.test(style)
}

/** Reescreve o `style`, mantendo só as propriedades da lista branca. */
function filtrarStyle(style: string | undefined): string | undefined {
    if (!style) return undefined

    const mantidas = style
        .split(";")
        .map((decl) => decl.trim())
        .filter((decl) => decl.length > 0)
        .filter((decl) => {
            const propriedade = decl.split(":")[0]?.trim().toLowerCase() ?? ""
            return PROPRIEDADES_MANTIDAS.includes(propriedade)
        })

    return mantidas.length > 0 ? mantidas.join("; ") : undefined
}

function atributosLimpos(attribs: Record<string, string>): Record<string, string> {
    const limpos: Record<string, string> = {}

    for (const [nome, valor] of Object.entries(attribs)) {
        // `class` é por onde entram MsoNormal/MsoListParagraph.
        if (nome === "class" || nome === "id" || nome.startsWith("data-mce")) continue

        if (nome === "style") {
            const style = filtrarStyle(valor)
            if (style) limpos.style = style
            continue
        }

        limpos[nome] = valor
    }

    return limpos
}

export function limparHtmlDeColagem(
    html: string,
    opcoes: { descartarImagens?: boolean } = {}
): string {
    if (!html.trim()) return ""

    const { descartarImagens = false } = opcoes

    const limpo = sanitizeHtml(html, {
        // Mesma lista de tags do sanitizador de segurança, menos as de tabela
        // que o preset de artigo não produz. Tag fora da lista é descartada,
        // mas seu TEXTO permanece (comportamento padrão do sanitize-html).
        //
        // `img` só sai da lista quando `descartarImagens: true` — e isso é
        // decisão de quem CHAMA a função, não da função em si. Esta mesma
        // limpeza roda em dois lugares: no editor, sobre HTML recém-colado
        // (aí faz sentido descartar: imagem colada de Word/Docs já chega
        // quebrada, com `src="file:///..."` ou `data:`, esquemas fora de
        // `allowedSchemes` abaixo, e mesmo quando o src sobrevivesse, deixar
        // passar imagem colada sem alt tornaria decorativa a garantia de
        // acessibilidade que o botão de imagem do editor existe para dar —
        // ele exige texto alternativo); e no servidor, sobre o `contentHtml`
        // inteiro do post ao salvar, onde a mesma imagem inserida pelo botão
        // (com alt) precisa sobreviver. O default é `false` — manter a
        // imagem — de propósito: quem esquecer de passar a opção preserva
        // conteúdo em vez de apagar o que o autor colocou.
        allowedTags: descartarImagens
            ? [
                  "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5", "h6",
                  "hr", "li", "ol", "p", "pre", "s", "strong", "sub", "sup", "u", "ul",
                  "table", "thead", "tbody", "tr", "th", "td",
              ]
            : [
                  "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5", "h6",
                  "hr", "img", "li", "ol", "p", "pre", "s", "strong", "sub", "sup", "u", "ul",
                  "table", "thead", "tbody", "tr", "th", "td",
              ],
        allowedAttributes: {
            "*": ["style", "align"],
            a: ["href", "title", "target", "style"],
            ...(descartarImagens ? {} : { img: ["src", "alt", "title", "width", "height"] }),
            td: ["colspan", "rowspan", "style"],
            th: ["colspan", "rowspan", "style"],
        },
        allowedSchemes: ["http", "https", "mailto", "tel"],
        // Descarta o conteúdo destas, em vez de deixar o texto solto na página.
        nonTextTags: ["script", "style", "textarea", "option", "noscript", "xml"],
        parseStyleAttributes: false,
        transformTags: {
            // O Google Docs envolve TODO o conteúdo copiado num
            // <b style="font-weight:normal" id="docs-internal-guid-...">
            // — não é ênfase, é wrapper do clipboard. Convertê-lo para
            // <strong> incondicionalmente colocaria o post inteiro em
            // negrito. `font-weight:normal`/`font-style:normal` denuncia o
            // wrapper: vira `span` sem atributos, que a limpeza final abaixo
            // desembrulha, mantendo o conteúdo.
            b: (tagName, attribs) => {
                const style = attribs.style ?? ""
                if (ehPesoOuEstiloNormal(style)) return { tagName: "span", attribs: {} }
                return { tagName: "strong", attribs: {} }
            },
            i: (tagName, attribs) => {
                const style = attribs.style ?? ""
                if (ehPesoOuEstiloNormal(style)) return { tagName: "span", attribs: {} }
                return { tagName: "em", attribs: {} }
            },
            // O Google Docs cola negrito/itálico como <span style=...>. Vira
            // marcação semântica; span sem nada a dizer é desembrulhado na
            // limpeza final abaixo.
            span: (tagName, attribs) => {
                const style = attribs.style ?? ""
                if (ehNegrito(style)) return { tagName: "strong", attribs: {} }
                if (ehItalico(style)) return { tagName: "em", attribs: {} }
                return { tagName: "span", attribs: atributosLimpos(attribs) }
            },
            "*": (tagName, attribs) => ({ tagName, attribs: atributosLimpos(attribs) }),
        },
    })

    return (
        limpo
            // <span> que sobrou sem atributo nenhum não diz nada: some, o texto fica.
            .replace(/<span>([\s\S]*?)<\/span>/g, "$1")
            // Parágrafo vazio (inclusive só com &nbsp;) é ruído do Word.
            .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, "")
            .trim()
    )
}
