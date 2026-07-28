import sanitizeHtml from "sanitize-html"

/**
 * Sanitização do HTML do blog no SERVIDOR.
 *
 * Usa `sanitize-html` (parser puro, htmlparser2) e não DOMPurify + jsdom, que
 * era a implementação anterior. Motivo: o jsdom depende de
 * `html-encoding-sniffer` -> `@exodus/bytes`, que é ESM, e o runtime da Vercel
 * carrega esse módulo com `require()`. O resultado era `ERR_REQUIRE_ESM` e um
 * 500 em TODA rota que importasse este arquivo — o painel do blog inteiro ficou
 * fora do ar em produção enquanto localmente funcionava.
 *
 * A versão do cliente (`html-sanitizer.client.ts`) continua no DOMPurify: lá
 * existe DOM de verdade e nenhum jsdom envolvido.
 *
 * O contrato está fixado em `html-sanitizer.test.ts` — a troca de biblioteca
 * manteve os mesmos casos passando.
 */

const ALLOWED_TAGS = [
    "a", "abbr", "b", "blockquote", "br", "caption", "code",
    "col", "colgroup", "dd", "del", "div", "dl", "dt", "em",
    "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
    "li", "mark", "ol", "p", "pre", "q", "s", "small",
    "span", "strong", "sub", "sup", "table", "tbody", "td",
    "tfoot", "th", "thead", "tr", "u", "ul",
]

const ALLOWED_ATTRS = [
    "href", "src", "alt", "title", "width", "height",
    "style", "align", "valign", "border", "cellpadding",
    "cellspacing", "colspan", "rowspan", "target",
]

export function sanitizeHtmlForPreview(html: string): string {
    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        // Mesma lista para qualquer tag, como o ALLOWED_ATTR do DOMPurify.
        allowedAttributes: { "*": ALLOWED_ATTRS },
        // Protocolo fora desta lista derruba o atributo — é o que barra
        // `javascript:`, inclusive escrito com entidades HTML, que o parser
        // decodifica antes de avaliar.
        allowedSchemes: ["http", "https", "mailto", "tel"],
        allowedSchemesAppliedToAttributes: ["href", "src"],
        allowProtocolRelative: false,
        // Conteúdo de <script>/<style> é descartado junto com a tag, em vez de
        // sobrar como texto solto na página.
        nonTextTags: ["script", "style", "textarea", "option", "noscript"],
        // O editor grava `style` inline (cor, alinhamento). Não filtrar os
        // valores replica o comportamento anterior do DOMPurify.
        parseStyleAttributes: false,
    }).trim()
}
