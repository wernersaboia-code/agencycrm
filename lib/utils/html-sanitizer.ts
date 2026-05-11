const BLOCKED_ELEMENT_PATTERN =
    /<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi
const BLOCKED_TAG_PATTERN =
    /<\/?(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select)[^>]*>/gi
const EVENT_HANDLER_PATTERN = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi
const DANGEROUS_URL_PATTERN =
    /\s+(href|src|xlink:href|formaction|srcdoc)\s*=\s*("\s*(javascript:|data:|vbscript:)[^"]*"|'\s*(javascript:|data:|vbscript:)[^']*'|\s*(javascript:|data:|vbscript:)[^\s>]*)/gi

export function sanitizeHtmlForPreview(html: string): string {
    return html
        .replace(BLOCKED_ELEMENT_PATTERN, "")
        .replace(BLOCKED_TAG_PATTERN, "")
        .replace(EVENT_HANDLER_PATTERN, "")
        .replace(DANGEROUS_URL_PATTERN, "")
}
