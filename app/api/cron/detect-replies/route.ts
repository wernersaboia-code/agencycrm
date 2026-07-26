// app/api/cron/detect-replies/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decryptSecret } from "@/lib/secrets"
import { resolveImapConfig, fetchInboundReplies } from "@/lib/imap"

// Vercel Cron — roda antes do process-sequences para que uma resposta recebida
// interrompa a sequência antes do follow-up do mesmo dia sair.

export const dynamic = "force-dynamic"
export const maxDuration = 300

// Sem marca de última checagem, olha os últimos 3 dias.
const DEFAULT_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error("[Replies] CRON_SECRET nao configurado")
            return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 })
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()

        const workspaces = await prisma.workspace.findMany({
            where: {
                replyDetectionEnabled: true,
                smtpUser: { not: null },
                smtpPass: { not: null },
            },
            select: {
                id: true,
                smtpProvider: true,
                smtpUser: true,
                smtpPass: true,
                imapHost: true,
                imapPort: true,
                replyCheckedAt: true,
            },
        })

        let workspacesChecked = 0
        let repliesMatched = 0
        let errors = 0

        for (const workspace of workspaces) {
            try {
                const pass = decryptSecret(workspace.smtpPass)
                if (!pass) {
                    continue
                }

                const config = resolveImapConfig(workspace, pass)
                if (!config) {
                    console.warn(
                        `[Replies] Workspace ${workspace.id} sem host IMAP resolvivel`
                    )
                    continue
                }

                const since =
                    workspace.replyCheckedAt ??
                    new Date(now.getTime() - DEFAULT_LOOKBACK_MS)

                const inbound = await fetchInboundReplies(config, since)
                workspacesChecked++

                const referencedIds = Array.from(
                    new Set(inbound.flatMap((reply) => reply.referencedMessageIds))
                )

                if (referencedIds.length > 0) {
                    repliesMatched += await markReplies(workspace.id, referencedIds, now)
                }

                await prisma.workspace.update({
                    where: { id: workspace.id },
                    data: { replyCheckedAt: now },
                })
            } catch (error) {
                errors++
                console.error(
                    `[Replies] Falha ao checar workspace ${workspace.id}:`,
                    error
                )
            }
        }

        const summary = {
            timestamp: now.toISOString(),
            workspacesChecked,
            repliesMatched,
            errors,
        }

        console.log("[Replies] Finalizado:", summary)

        return NextResponse.json({ success: true, ...summary })
    } catch (error) {
        console.error("[Replies] Erro geral:", error)
        return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 })
    }
}

/**
 * Casa os Message-IDs referenciados com envios do workspace e para as
 * sequências correspondentes. Devolve quantos envios foram marcados.
 */
async function markReplies(
    workspaceId: string,
    referencedMessageIds: string[],
    now: Date
): Promise<number> {
    const sends = await prisma.emailSend.findMany({
        where: {
            messageId: { in: referencedMessageIds },
            repliedAt: null,
            campaign: { workspaceId },
        },
        select: { id: true, leadId: true, campaignId: true },
    })

    if (sends.length === 0) {
        return 0
    }

    for (const send of sends) {
        await prisma.emailSend.update({
            where: { id: send.id },
            data: { status: "REPLIED", repliedAt: now },
        })

        await prisma.lead.update({
            where: { id: send.leadId },
            data: { status: "REPLIED" },
        })

        await prisma.campaignEnrollment.updateMany({
            where: {
                campaignId: send.campaignId,
                leadId: send.leadId,
                status: "active",
            },
            data: {
                status: "stopped",
                stoppedAt: now,
                stopReason: "replied",
                nextSendAt: null,
            },
        })

        await prisma.campaign.update({
            where: { id: send.campaignId },
            data: { totalReplied: { increment: 1 } },
        })
    }

    return sends.length
}