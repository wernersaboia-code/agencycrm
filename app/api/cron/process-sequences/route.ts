// app/api/cron/process-sequences/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, replaceEmailVariables } from "@/lib/email"
import { decryptSecret } from "@/lib/secrets"
import { isSuppressed, addSuppression } from "@/lib/campaigns/suppression"
import { classifyBounce } from "@/lib/campaigns/bounce-classifier"
import { normalizeMessageId } from "@/lib/campaigns/reply-detection"
import {
    resolveSendWindow,
    isWithinSendWindow,
    nextWindowStart,
    calculateNextSendAt,
    windowCoversCronRun,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"
import type { CampaignEnrollment, StepCondition } from "@prisma/client"

// Vercel Cron - roda a cada hora
// Configurar em vercel.json

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutos m├íximo

export async function GET(request: Request) {
    try {
        // Verificar secret para seguran├ºa (opcional em dev)
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET nao configurado")
            return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 })
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        console.log(`[Cron] Iniciando processamento de sequ├¬ncias: ${now.toISOString()}`)

        // In├¡cio do dia (para o limite di├írio de envios por workspace).
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        // Contagem de envios de hoje por workspace, resolvida sob demanda e
        // incrementada a cada envio dentro desta execu├º├úo, para n├úo consultar
        // o banco a cada enrollment.
        const workspaceSentToday = new Map<string, number>()

        async function getWorkspaceSentToday(workspaceId: string): Promise<number> {
            const cached = workspaceSentToday.get(workspaceId)
            if (cached !== undefined) {
                return cached
            }
            const count = await prisma.emailSend.count({
                where: {
                    sentAt: { gte: startOfToday },
                    campaign: { workspaceId },
                },
            })
            workspaceSentToday.set(workspaceId, count)
            return count
        }

        // Buscar enrollments que precisam de envio
        const pendingEnrollments = await prisma.campaignEnrollment.findMany({
            where: {
                status: "active",
                nextSendAt: {
                    lte: now,
                },
            },
            include: {
                campaign: {
                    include: {
                        steps: true,
                        workspace: true,
                    },
                },
                lead: true,
            },
            take: 100, // Processar em lotes
        })

        console.log(`[Cron] Encontrados ${pendingEnrollments.length} envios pendentes`)

        let processed = 0
        let sent = 0
        let skipped = 0
        let throttled = 0
        let deferred = 0
        let errors = 0

        // Workspaces j├í alertados sobre janela inalcan├º├ível nesta execu├º├úo.
        const unreachableWindowWarned = new Set<string>()

        for (const enrollment of pendingEnrollments) {
            try {
                processed++
                const { campaign, lead } = enrollment

                const sendWindow = resolveSendWindow(campaign.workspace, campaign)

                // Verificar se deve parar a sequ├¬ncia
                if (campaign.stopOnConverted && lead.status === "CONVERTED") {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "lead_converted",
                        },
                    })
                    skipped++
                    console.log(`[Cron] Lead ${lead.id} convertido - parando sequ├¬ncia`)
                    continue
                }

                if (lead.status === "UNSUBSCRIBED") {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "unsubscribed",
                        },
                    })
                    skipped++
                    console.log(`[Cron] Lead ${lead.id} descadastrado - parando sequ├¬ncia`)
                    continue
                }

                if (lead.status === "REPLIED") {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "replied",
                        },
                    })
                    skipped++
                    console.log(`[Cron] Lead ${lead.id} respondeu - parando sequ├¬ncia`)
                    continue
                }

                // Buscar o step atual
                const currentStep = campaign.steps.find(
                    (s) => s.order === enrollment.currentStep
                )

                if (!currentStep) {
                    // N├úo tem mais steps - completar
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "completed",
                            completedAt: now,
                        },
                    })
                    skipped++
                    console.log(`[Cron] Enrollment ${enrollment.id} completado`)
                    continue
                }

                // Verificar condi├º├úo do step
                const shouldSend = await checkStepCondition(
                    enrollment,
                    currentStep.condition
                )

                if (!shouldSend) {
                    // Condi├º├úo n├úo atendida - pular para pr├│ximo step
                    const nextStep = campaign.steps.find(
                        (s) => s.order === enrollment.currentStep + 1
                    )

                    if (nextStep) {
                        const nextSendAt = calculateNextSendAt(now, nextStep, sendWindow)
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                currentStep: nextStep.order,
                                nextSendAt,
                            },
                        })
                        console.log(`[Cron] Condi├º├úo n├úo atendida - pulando para step ${nextStep.order}`)
                    } else {
                        // N├úo tem pr├│ximo step - completar
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                status: "completed",
                                completedAt: now,
                            },
                        })
                    }
                    skipped++
                    continue
                }

                // A janela s├│ restringe o envio em si, n├úo a limpeza de estado do
                // enrollment: os ramos acima (convertido, descadastrado, sem step,
                // condi├º├úo n├úo atendida) encerram ou avan├ºam o enrollment sem
                // enviar e-mail. Se a checagem de janela viesse antes deles, um
                // lead convertido/descadastrado cujo workspace tenha janela que
                // n├úo cobre o instante do cron ficaria "active" para sempre, sendo
                // reselecionado a cada execu├º├úo. Por isso ela s├│ entra aqui,
                // imediatamente antes do envio de fato.
                //
                // Fora da janela: n├úo envia e n├úo avan├ºa o step ÔÇö apenas reagenda
                // para o pr├│ximo hor├írio v├ílido. O enrollment segue ativo.
                if (!isWithinSendWindow(now, sendWindow)) {
                    const deferredTo = nextWindowStart(now, sendWindow)
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: { nextSendAt: deferredTo },
                    })
                    deferred++

                    // Este cron roda uma vez por dia, sempre no mesmo hor├írio.
                    // Se a janela n├úo cobre esse instante, o adiamento acima vai
                    // se repetir todo dia e o enrollment NUNCA envia. A UI
                    // valida isso na hora de salvar (Task 4); aqui ├® a rede de
                    // seguran├ºa para configura├º├úo que escapou por outro caminho.
                    if (
                        !windowCoversCronRun(sendWindow) &&
                        !unreachableWindowWarned.has(campaign.workspaceId)
                    ) {
                        unreachableWindowWarned.add(campaign.workspaceId)
                        console.error(
                            `[Cron] JANELA INALCAN├ç├üVEL: o workspace ${campaign.workspaceId} tem janela ` +
                            `${sendWindow.startHour}h-${sendWindow.endHour}h em ${sendWindow.timezone}, que nunca ` +
                            `cont├®m a execu├º├úo di├íria das ${CRON_SEND_HOUR_UTC}h UTC. O enrollment ${enrollment.id} ` +
                            `n├úo ser├í enviado enquanto a janela n├úo for corrigida.`
                        )
                    } else {
                        console.log(
                            `[Cron] Fora da janela de envio - enrollment ${enrollment.id} adiado para ${deferredTo.toISOString()}`
                        )
                    }
                    continue
                }

                // Respeitar o limite di├írio de envios do workspace.
                // maxEmailsPerDay === 0 significa ilimitado.
                const maxEmailsPerDay = campaign.workspace.maxEmailsPerDay
                if (maxEmailsPerDay > 0) {
                    const sentToday = await getWorkspaceSentToday(campaign.workspaceId)
                    if (sentToday >= maxEmailsPerDay) {
                        // N├úo avan├ºa o step: o enrollment segue ativo e ser├í
                        // reprocessado na pr├│xima execu├º├úo, quando a cota resetar.
                        throttled++
                        console.log(
                            `[Cron] Limite di├írio atingido (workspace ${campaign.workspaceId}: ${sentToday}/${maxEmailsPerDay}) - adiando enrollment ${enrollment.id}`
                        )
                        continue
                    }
                }

                // Supress├úo vence qualquer configura├º├úo de campanha.
                if (await isSuppressed(prisma, lead.email, campaign.workspaceId)) {
                    await prisma.campaignEnrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: "stopped",
                            stoppedAt: now,
                            stopReason: "suppressed",
                        },
                    })
                    skipped++
                    console.log(
                        `[Cron] Lead ${lead.id} est├í na lista de supress├úo - parando sequ├¬ncia`
                    )
                    continue
                }

                // Preparar dados do lead
                const leadData = {
                    // Dados do Lead
                    firstName: lead.firstName,
                    lastName: lead.lastName || "",
                    fullName: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
                    email: lead.email,
                    phone: lead.phone || "",
                    company: lead.company || "",
                    jobTitle: lead.jobTitle || "",
                    industry: lead.industry || "",
                    website: lead.website || "",
                    city: lead.city || "",
                    state: lead.state || "",
                    country: lead.country || "",
                    // Dados do Remetente/Workspace
                    meuNome: campaign.workspace.senderName || "",
                    minhaEmpresa: campaign.workspace.name || "",
                    meuEmail: campaign.workspace.senderEmail || campaign.workspace.smtpUser || "",
                }

                const personalizedSubject = replaceEmailVariables(
                    currentStep.subject,
                    leadData
                )
                const personalizedBody = replaceEmailVariables(
                    currentStep.content,
                    leadData
                )

                // Criar registro de envio
                const emailSend = await prisma.emailSend.create({
                    data: {
                        campaignId: campaign.id,
                        leadId: lead.id,
                        stepId: currentStep.id,
                        stepNumber: currentStep.order,
                        status: "PENDING",
                    },
                })

                // Configurar SMTP
                const smtpPass = decryptSecret(campaign.workspace.smtpPass)
                const smtpConfig =
                    campaign.workspace.smtpUser && smtpPass
                        ? {
                            provider: campaign.workspace.smtpProvider,
                            host: campaign.workspace.smtpHost,
                            port: campaign.workspace.smtpPort,
                            user: campaign.workspace.smtpUser,
                            pass: smtpPass,
                            secure: campaign.workspace.smtpSecure,
                            senderName: campaign.workspace.senderName,
                            senderEmail: campaign.workspace.senderEmail,
                        }
                        : null

                // Enviar email
                const result = await sendEmail(
                    {
                        to: lead.email,
                        subject: personalizedSubject,
                        html: personalizedBody,
                        tags: [
                            { name: "campaign_id", value: campaign.id },
                            { name: "lead_id", value: lead.id },
                            { name: "step_id", value: currentStep.id },
                        ],
                        emailSendId: emailSend.id,
                    },
                    smtpConfig
                )

                if (result.success) {
                    // Atualizar envio
                    await prisma.emailSend.update({
                        where: { id: emailSend.id },
                        data: {
                            status: "SENT",
                            sentAt: now,
                            resendId: result.id,
                            messageId: result.messageId
                                ? normalizeMessageId(result.messageId)
                                : null,
                        },
                    })

                    // Atualizar m├®tricas da campanha
                    await prisma.campaign.update({
                        where: { id: campaign.id },
                        data: {
                            totalSent: { increment: 1 },
                        },
                    })

                    // Calcular pr├│ximo envio
                    const nextStep = campaign.steps.find(
                        (s) => s.order === enrollment.currentStep + 1
                    )

                    if (nextStep) {
                        const nextSendAt = calculateNextSendAt(now, nextStep, sendWindow)
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                currentStep: nextStep.order,
                                nextSendAt,
                            },
                        })
                    } else {
                        // ├Ültimo step - completar
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                status: "completed",
                                completedAt: now,
                                nextSendAt: null,
                            },
                        })
                    }

                    sent++
                    // Contabiliza no limite di├írio do workspace nesta execu├º├úo.
                    workspaceSentToday.set(
                        campaign.workspaceId,
                        (workspaceSentToday.get(campaign.workspaceId) ?? 0) + 1
                    )
                    console.log(
                        `[Cron] Email enviado: Lead ${lead.id}, Step ${currentStep.order}`
                    )
                } else {
                    // Erro no envio
                    const bounceType = classifyBounce(result.error)

                    await prisma.emailSend.update({
                        where: { id: emailSend.id },
                        data: {
                            status: "BOUNCED",
                            bouncedAt: now,
                            bounceReason: result.error,
                            bounceType,
                        },
                    })

                    if (bounceType === "hard") {
                        // Supress├úo primeiro: ela nunca lan├ºa. Se as atualiza├º├Áes
                        // de lead/enrollment abaixo falharem, a supress├úo j├í
                        // ficou gravada e a checagem de isSuppressed no topo do
                        // loop encerra o enrollment na pr├│xima execu├º├úo do cron.
                        await addSuppression(prisma, {
                            email: lead.email,
                            workspaceId: campaign.workspaceId,
                            reason: "hard_bounce",
                            detail: result.error ?? null,
                        })
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { status: "BOUNCED" },
                        })
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                status: "stopped",
                                stoppedAt: now,
                                stopReason: "hard_bounce",
                            },
                        })
                    }

                    errors++
                    console.error(`[Cron] Erro ao enviar para ${lead.email}: ${result.error}`)
                }

                // Delay entre envios para n├úo sobrecarregar
                await new Promise((resolve) => setTimeout(resolve, 200))
            } catch (error) {
                errors++
                console.error(`[Cron] Erro no enrollment ${enrollment.id}:`, error)
            }
        }

        // Limpeza oportunista das janelas de rate limit j├í expiradas (> 1h),
        // para o cron n├úo deixar a tabela crescer indefinidamente.
        try {
            await prisma.rateLimit.deleteMany({
                where: { windowStart: { lt: new Date(now.getTime() - 60 * 60 * 1000) } },
            })
        } catch (error) {
            console.error("[Cron] Falha ao limpar rate_limits antigos:", error)
        }

        const summary = {
            timestamp: now.toISOString(),
            processed,
            sent,
            skipped,
            throttled,
            deferred,
            errors,
        }

        console.log(`[Cron] Finalizado:`, summary)

        return NextResponse.json({
            success: true,
            ...summary,
        })
    } catch (error) {
        console.error("[Cron] Erro geral:", error)
        return NextResponse.json(
            { success: false, error: "Erro interno" },
            { status: 500 }
        )
    }
}

// ============================================================
// FUN├ç├òES AUXILIARES
// ============================================================

async function checkStepCondition(
    enrollment: Pick<CampaignEnrollment, "campaignId" | "leadId" | "currentStep">,
    condition: StepCondition
): Promise<boolean> {
    if (condition === "always") {
        return true
    }

    // Buscar o ├║ltimo envio do step anterior
    const previousStepNumber = enrollment.currentStep - 1

    if (previousStepNumber < 1) {
        return true // Primeiro step sempre envia
    }

    const previousSend = await prisma.emailSend.findFirst({
        where: {
            campaignId: enrollment.campaignId,
            leadId: enrollment.leadId,
            stepNumber: previousStepNumber,
        },
        orderBy: { createdAt: "desc" },
    })

    if (!previousSend) {
        return true // Se n├úo encontrou envio anterior, envia
    }

    switch (condition) {
        case "not_opened":
            return !previousSend.openedAt
        case "opened":
            return !!previousSend.openedAt
        case "not_clicked":
            return !previousSend.clickedAt
        case "clicked":
            return !!previousSend.clickedAt
        default:
            return true
    }
}
