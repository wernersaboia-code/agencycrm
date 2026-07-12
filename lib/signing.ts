import crypto from "crypto"

/**
 * Assinatura HMAC para tokens stateless (links de e-mail, redirects de tracking).
 *
 * Reutiliza SECRETS_ENCRYPTION_KEY como chave do servidor — o mesmo segredo já
 * exigido para criptografar credenciais SMTP. Não há expiração embutida: quem
 * precisar dela deve incluir um timestamp no valor assinado.
 */
function getSigningKey(): Buffer {
    const secret =
        process.env.SIGNING_SECRET ||
        process.env.SECRETS_ENCRYPTION_KEY ||
        process.env.ENCRYPTION_KEY

    if (!secret) {
        throw new Error("SIGNING_SECRET/SECRETS_ENCRYPTION_KEY nao configurada")
    }

    return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Gera a assinatura (hex) de um valor.
 */
export function sign(value: string): string {
    return crypto.createHmac("sha256", getSigningKey()).update(value).digest("hex")
}

/**
 * Verifica a assinatura de um valor em tempo constante.
 */
export function verifySignature(value: string, signature: string | null | undefined): boolean {
    if (!signature) {
        return false
    }

    let expected: string
    try {
        expected = sign(value)
    } catch {
        return false
    }

    const expectedBuffer = Buffer.from(expected, "hex")
    const providedBuffer = Buffer.from(signature, "hex")

    if (expectedBuffer.length !== providedBuffer.length) {
        return false
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}
