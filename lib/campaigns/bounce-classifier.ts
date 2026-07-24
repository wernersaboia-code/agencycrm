// lib/campaigns/bounce-classifier.ts

/**
 * Classificação de bounce a partir da mensagem de erro do servidor SMTP.
 * Puro e conservador: só marca `hard` diante de sinal explícito de destinatário
 * inexistente/recusado, porque um `hard` alimenta a supressão permanente.
 */

export type BounceType = "hard" | "soft" | "unknown"

// Frases textuais: substring simples já é seguro, não há ambiguidade posicional.
const HARD_TEXT_PATTERNS = [
    "user unknown",
    "unknown user",
    "no such user",
    "no such recipient",
    "does not exist",
    "doesn't exist",
    "recipient rejected",
    "address rejected",
    "invalid recipient",
    "invalid address",
    "mailbox unavailable",
    "mailbox not found",
    "account disabled",
    "user not found",
]

const SOFT_TEXT_PATTERNS = [
    "mailbox full",
    "over quota",
    "quota exceeded",
    "insufficient storage",
    "try again",
    "retry",
    "temporarily",
    "temporary failure",
    "greylist",
    "timeout",
    "timed out",
    "connection",
    "rate limit",
    "too many",
]

// Códigos numéricos: um "550" pode aparecer dentro de qualquer número
// (ms, bytes, queue id, referência), então não bastam substring — precisam
// ocupar a posição estrutural de um código de status real.
const HARD_BASIC_CODES = ["550", "551", "553"]
const HARD_ENHANCED_CODES = ["5.1.1", "5.1.10", "5.4.1"]

const SOFT_BASIC_CODES = ["421", "450", "451", "452"]
const SOFT_ENHANCED_CODES = ["4.2.2"]

// Código básico de status SMTP (RFC 5321): três dígitos no início da
// mensagem OU no início de uma linha, seguidos de espaço, hífen ou fim
// de string. Espaços/tabs iniciais são tolerados antes do código.
function hasBasicCode(normalized: string, code: string): boolean {
    const pattern = new RegExp(`(^|\\n)[ \\t]*${code}(?:[ \\t\\-]|$)`, "m")
    return pattern.test(normalized)
}

// Código estendido de status SMTP (RFC 3463): formato pontuado (ex: 5.1.1).
// Usa fronteira de palavra para que "15.1.1" não case como "5.1.1".
function hasEnhancedCode(normalized: string, code: string): boolean {
    const escaped = code.replace(/\./g, "\\.")
    const pattern = new RegExp(`\\b${escaped}\\b`)
    return pattern.test(normalized)
}

function matchesAnyCode(normalized: string, basicCodes: string[], enhancedCodes: string[]): boolean {
    return (
        basicCodes.some((code) => hasBasicCode(normalized, code)) ||
        enhancedCodes.some((code) => hasEnhancedCode(normalized, code))
    )
}

export function classifyBounce(reason: string | null | undefined): BounceType {
    if (!reason) {
        return "unknown"
    }

    const normalized = reason.trim().toLowerCase()

    if (!normalized) {
        return "unknown"
    }

    // Hard vence: na dúvida entre os dois, o sinal mais grave manda.
    if (
        HARD_TEXT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
        matchesAnyCode(normalized, HARD_BASIC_CODES, HARD_ENHANCED_CODES)
    ) {
        return "hard"
    }

    if (
        SOFT_TEXT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
        matchesAnyCode(normalized, SOFT_BASIC_CODES, SOFT_ENHANCED_CODES)
    ) {
        return "soft"
    }

    return "unknown"
}
