// lib/campaigns/bounce-classifier.ts

/**
 * Classificação de bounce a partir da mensagem de erro do servidor SMTP.
 * Puro e conservador: só marca `hard` diante de sinal explícito de destinatário
 * inexistente/recusado, porque um `hard` alimenta a supressão permanente.
 */

export type BounceType = "hard" | "soft" | "unknown"

const HARD_PATTERNS = [
    "5.1.1",
    "5.1.10",
    "5.4.1",
    "550",
    "551",
    "553",
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

const SOFT_PATTERNS = [
    "4.2.2",
    "421",
    "450",
    "451",
    "452",
    "mailbox full",
    "over quota",
    "quota exceeded",
    "insufficient storage",
    "try again",
    "temporarily",
    "temporary failure",
    "greylist",
    "timeout",
    "timed out",
    "connection",
    "rate limit",
    "too many",
]

export function classifyBounce(reason: string | null | undefined): BounceType {
    if (!reason) {
        return "unknown"
    }

    const normalized = reason.trim().toLowerCase()

    if (!normalized) {
        return "unknown"
    }

    // Hard vence: na dúvida entre os dois, o sinal mais grave manda.
    if (HARD_PATTERNS.some((pattern) => normalized.includes(pattern))) {
        return "hard"
    }

    if (SOFT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
        return "soft"
    }

    return "unknown"
}
