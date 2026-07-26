// lib/imap.ts

import { ImapFlow } from "imapflow"
import { SMTP_PROVIDERS, type SmtpProvider } from "@/lib/constants/smtp.constants"
import {
    parseHeaderBlock,
    extractReferencedMessageIds,
} from "@/lib/campaigns/reply-detection"

export interface ImapConfig {
    host: string
    port: number
    user: string
    pass: string
    secure: boolean
}

export interface InboundReply {
    referencedMessageIds: string[]
    from: string | null
    date: Date | null
}

/**
 * Monta a configuração IMAP a partir do workspace. Host explícito vence; sem
 * ele, cai no host do provedor SMTP escolhido. Devolve null quando não dá para
 * montar uma conexão (sem host ou sem usuário).
 */
export function resolveImapConfig(
    workspace: {
        smtpProvider: string | null
        imapHost: string | null
        imapPort: number | null
        smtpUser: string | null
    },
    pass: string
): ImapConfig | null {
    const providerConfig = SMTP_PROVIDERS[workspace.smtpProvider as SmtpProvider]
    const host = workspace.imapHost || providerConfig?.imapHost || ""
    const port = workspace.imapPort || providerConfig?.imapPort || 993

    if (!host || !workspace.smtpUser || !pass) {
        return null
    }

    return { host, port, user: workspace.smtpUser, pass, secure: true }
}

/**
 * Lê a INBOX e devolve, para cada mensagem recebida desde `since`, os
 * Message-IDs que ela referencia. Não guarda assunto nem corpo — só o
 * necessário para casar a resposta com o envio.
 */
export async function fetchInboundReplies(
    config: ImapConfig,
    since: Date,
    limit = 200
): Promise<InboundReply[]> {
    const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        logger: false,
    })

    const replies: InboundReply[] = []

    await client.connect()

    try {
        const lock = await client.getMailboxLock("INBOX")

        try {
            for await (const message of client.fetch(
                { since },
                { envelope: true, headers: ["in-reply-to", "references"] }
            )) {
                // imapflow devolve `headers` como Buffer cru dos cabeçalhos
                // pedidos. O parser puro espera um bloco "name: value" por linha.
                const raw = message.headers?.toString("utf8") ?? ""
                const headers = parseHeaderBlock(raw)

                const referencedMessageIds = extractReferencedMessageIds({
                    inReplyTo: headers["in-reply-to"] ?? null,
                    references: headers["references"] ?? null,
                })

                if (referencedMessageIds.length === 0) {
                    continue
                }

                replies.push({
                    referencedMessageIds,
                    from: message.envelope?.from?.[0]?.address ?? null,
                    date: message.envelope?.date ?? null,
                })

                if (replies.length >= limit) {
                    break
                }
            }
        } finally {
            lock.release()
        }
    } finally {
        await client.logout().catch(() => undefined)
    }

    return replies
}