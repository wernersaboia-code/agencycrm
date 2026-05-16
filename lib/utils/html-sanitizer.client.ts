import DOMPurify from "dompurify"

const DOMPURIFY_CONFIG = {
    ALLOWED_TAGS: [
        "a", "abbr", "b", "blockquote", "br", "caption", "code",
        "col", "colgroup", "dd", "del", "div", "dl", "dt", "em",
        "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
        "li", "mark", "ol", "p", "pre", "q", "s", "small",
        "span", "strong", "sub", "sup", "table", "tbody", "td",
        "tfoot", "th", "thead", "tr", "u", "ul",
    ] as string[],
    ALLOWED_ATTR: [
        "href", "src", "alt", "title", "width", "height",
        "style", "align", "valign", "border", "cellpadding",
        "cellspacing", "colspan", "rowspan", "target",
    ] as string[],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
}

export function sanitizeHtmlForPreview(html: string): string {
    const purify = DOMPurify(window)
    const sanitized = purify.sanitize(html, DOMPURIFY_CONFIG)
    return sanitized.trim()
}
