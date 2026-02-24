// app/api/cron/process-sequences/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, replaceEmailVariables } from "@/lib/email"

// Vercel Cron - roda a cada hora
// Configurar em vercel.json

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutos máximo

export async function GET(request: Request) {
    try {
        // Verificar secret para segurança (opcional em dev)
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        console.log(`[Cron] Iniciando processamento de sequências: ${now.toISOString()}`)

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
        let errors = 0

        for (const enrollment of pendingEnrollments) {
            try {
                processed++
                const { campaign, lead } = enrollment

                // Verificar se deve parar a sequência
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
                    console.log(`[Cron] Lead ${lead.id} convertido - parando sequência`)
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
                    console.log(`[Cron] Lead ${lead.id} descadastrado - parando sequência`)
                    continue
                }

                // Buscar o step atual
                const currentStep = campaign.steps.find(
                    (s) => s.order === enrollment.currentStep
                )

                if (!currentStep) {
                    // Não tem mais steps - completar
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

                // Verificar condição do step
                const shouldSend = await checkStepCondition(
                    enrollment,
                    currentStep.condition
                )

                if (!shouldSend) {
                    // Condição não atendida - pular para próximo step
                    const nextStep = campaign.steps.find(
                        (s) => s.order === enrollment.currentStep + 1
                    )

                    if (nextStep) {
                        const nextSendAt = calculateNextSendAt(now, nextStep)
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                currentStep: nextStep.order,
                                nextSendAt,
                            },
                        })
                        console.log(`[Cron] Condição não atendida - pulando para step ${nextStep.order}`)
                    } else {
                        // Não tem próximo step - completar
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
                const smtpConfig =
                    campaign.workspace.smtpUser && campaign.workspace.smtpPass
                        ? {
                            provider: campaign.workspace.smtpProvider,
                            host: campaign.workspace.smtpHost,
                            port: campaign.workspace.smtpPort,
                            user: campaign.workspace.smtpUser,
                            pass: campaign.workspace.smtpPass,
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
                        },
                    })

                    // Atualizar métricas da campanha
                    await prisma.campaign.update({
                        where: { id: campaign.id },
                        data: {
                            totalSent: { increment: 1 },
                        },
                    })

                    // Calcular próximo envio
                    const nextStep = campaign.steps.find(
                        (s) => s.order === enrollment.currentStep + 1
                    )

                    if (nextStep) {
                        const nextSendAt = calculateNextSendAt(now, nextStep)
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                currentStep: nextStep.order,
                                nextSendAt,
                            },
                        })
                    } else {
                        // Último step - completar
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
                    console.log(
                        `[Cron] Email enviado: Lead ${lead.id}, Step ${currentStep.order}`
                    )
                } else {
                    // Erro no envio
                    await prisma.emailSend.update({
                        where: { id: emailSend.id },
                        data: {
                            status: "BOUNCED",
                            bouncedAt: now,
                            bounceReason: result.error,
                        },
                    })
                    errors++
                    console.error(`[Cron] Erro ao enviar para ${lead.email}: ${result.error}`)
                }

                // Delay entre envios para não sobrecarregar
                await new Promise((resolve) => setTimeout(resolve, 200))
            } catch (error) {
                errors++
                console.error(`[Cron] Erro no enrollment ${enrollment.id}:`, error)
            }
        }

        const summary = {
            timestamp: now.toISOString(),
            processed,
            sent,
            skipped,
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
// FUNÇÕES AUXILIARES
// ============================================================

async function checkStepCondition(
    enrollment: any,
    condition: string
): Promise<boolean> {
    if (condition === "always") {
        return true
    }

    // Buscar o último envio do step anterior
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
        return true // Se não encontrou envio anterior, envia
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

function calculateNextSendAt(fromDate: Date, step: any): Date {
    const nextDate = new Date(fromDate)
    nextDate.setDate(nextDate.getDate() + (step.delayDays || 0))
    nextDate.setHours(nextDate.getHours() + (step.delayHours || 0))
    return nextDate
}