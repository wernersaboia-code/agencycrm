// lib/free-sample/token.ts

import { randomBytes } from "node:crypto"

/**
 * Sete dias. O link vai por e-mail e precisa sobreviver a quem só abre a caixa
 * na segunda-feira — a URL assinada do bucket, que dura 120 s, morreria antes.
 */
export const VALIDADE_TOKEN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * `base64url` e não `hex`: mesma entropia em menos caracteres, e sem `+`, `/`
 * nem `=`, que alguns clientes de e-mail escapam ao reescrever o link.
 */
export function gerarToken(): string {
    return randomBytes(32).toString("base64url")
}

export function calcularExpiracao(agora: Date): Date {
    return new Date(agora.getTime() + VALIDADE_TOKEN_MS)
}

export function tokenValido(expiresAt: Date, agora: Date): boolean {
    return expiresAt.getTime() > agora.getTime()
}
