import crypto from "crypto"

const ENCRYPTED_PREFIX = "enc:v1"

function getEncryptionKey(): Buffer {
    const secret = process.env.SECRETS_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY

    if (!secret) {
        throw new Error("SECRETS_ENCRYPTION_KEY nao configurada")
    }

    return crypto.createHash("sha256").update(secret).digest()
}

export function encryptSecret(value: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()

    return [
        ENCRYPTED_PREFIX,
        iv.toString("base64url"),
        tag.toString("base64url"),
        encrypted.toString("base64url"),
    ].join(":")
}

export function decryptSecret(value: string | null | undefined): string | null {
    if (!value) return null

    if (!value.startsWith(`${ENCRYPTED_PREFIX}:`)) {
        return value
    }

    const [, , iv, tag, encrypted] = value.split(":")

    if (!iv || !tag || !encrypted) {
        throw new Error("Formato de segredo criptografado invalido")
    }

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        Buffer.from(iv, "base64url")
    )
    decipher.setAuthTag(Buffer.from(tag, "base64url"))

    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64url")),
        decipher.final(),
    ]).toString("utf8")
}

export function maskSecret(value: string | null | undefined): string | null {
    return value ? null : null
}
