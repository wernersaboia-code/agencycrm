// lib/campaigns/reply-detection.ts

/**
 * Parsing puro dos cabeçalhos usados para casar uma resposta com o envio que a
 * originou. Uma resposta de verdade referencia o Message-ID original em
 * `In-Reply-To` e/ou `References` (RFC 5322).
 */

export function normalizeMessageId(raw: string): string {
    return raw.trim().replace(/^</, "").replace(/>$/, "").trim().toLowerCase()
}

/**
 * Converte um bloco cru de headers em mapa nome→valor, com as chaves em
 * minúsculas e as linhas dobradas (continuação iniciada por espaço/tab) já
 * concatenadas.
 */
export function parseHeaderBlock(raw: string): Record<string, string> {
    const headers: Record<string, string> = {}

    if (!raw) {
        return headers
    }

    let currentName: string | null = null

    for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) {
            continue
        }

        if (/^[ \t]/.test(line) && currentName) {
            headers[currentName] = `${headers[currentName]} ${line.trim()}`.trim()
            continue
        }

        const separator = line.indexOf(":")
        if (separator === -1) {
            continue
        }

        currentName = line.slice(0, separator).trim().toLowerCase()
        headers[currentName] = line.slice(separator + 1).trim()
    }

    return headers
}

export function extractReferencedMessageIds(headers: {
    inReplyTo?: string | null
    references?: string | null
}): string[] {
    const raw = [headers.inReplyTo, headers.references].filter(Boolean).join(" ")

    if (!raw) {
        return []
    }

    const found = raw.match(/<[^<>]+>|[^\s<>]+@[^\s<>]+/g) || []

    const normalized = found
        .map(normalizeMessageId)
        // Message-ID sempre tem domínio; sem arroba é ruído do parsing.
        .filter((id) => id.includes("@"))

    return Array.from(new Set(normalized))
}