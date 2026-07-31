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

export function limparHtmlDeColagem(html: string): string {
    if (!html.trim()) return ""

    const limpo = sanitizeHtml(html, {
        // Mesma lista de tags do sanitizador de segurança, menos as de tabela
        // que o preset de artigo não produz. Tag fora da lista é descartada,
        // mas seu TEXTO permanece (comportamento padrão do sanitize-html).
        // `img` fica de fora de propósito: imagem colada de Word/Docs já chega
        // quebrada (vem com `src="file:///..."` ou `data:`, esquemas fora de
        // `allowedSchemes` abaixo, então sobraria um <img> sem src) e, mesmo
        // quando o src sobrevivesse, deixar passar imagem colada sem alt
        // tornaria decorativa a garantia de acessibilidade que o botão de
        // imagem do editor existe para dar (ele exige texto alternativo).
        // Quem quiser imagem no post usa o botão.
        allowedTags: [
            "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5", "h6",
            "hr", "li", "ol", "p", "pre", "s", "strong", "sub", "sup", "u", "ul",
            "table", "thead", "tbody", "tr", "th", "td",
        ],
        allowedAttributes: {
            "*": ["style", "align"],
            a: ["href", "title", "target", "style"],
            td: ["colspan", "rowspan", "style"],
            th: ["colspan", "rowspan", "style"],
        },
        allowedSchemes: ["http", "https", "mailto", "tel"],
        // Descarta o conteúdo destas, em vez de deixar o texto solto na página.
        nonTextTags: ["script", "style", "textarea", "option", "noscript", "xml"],
        parseStyleAttributes: false,
        transformTags: {
            b: "strong",
            i: "em",
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
