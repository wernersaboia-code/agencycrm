// lib/email/list-unsubscribe.ts

/**
 * Headers de descadastro one-click (RFC 8058). Gmail e Yahoo exigem esses
 * headers de remetentes de volume; o footer HTML continua existindo, mas não
 * substitui o header.
 *
 * `List-Unsubscribe-Post` só pode ser enviado junto de uma URL https — quando
 * o provedor aciona o one-click, ele faz um POST para essa URL.
 */

export function buildUnsubscribeUrl(
    baseUrl: string,
    emailSendId: string,
    signature: string
): string {
    const normalizedBase = baseUrl.replace(/\/+$/, "")
    const params = new URLSearchParams({ sid: emailSendId, sig: signature })
    // URLSearchParams codifica espaço como "+", que é válido em query string mas
    // costuma confundir clientes de e-mail — %20 é mais seguro aqui.
    return `${normalizedBase}/unsubscribe?${params.toString().replace(/\+/g, "%20")}`
}

export function buildListUnsubscribeHeaders(
    unsubscribeUrl: string,
    mailto?: string | null
): Record<string, string> {
    const entries: string[] = []

    if (mailto && mailto.trim()) {
        entries.push(`<mailto:${mailto.trim()}>`)
    }

    entries.push(`<${unsubscribeUrl}>`)

    return {
        "List-Unsubscribe": entries.join(", "),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
}