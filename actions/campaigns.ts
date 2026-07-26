// actions/campaigns.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser, requireWorkspaceAccess } from "@/lib/auth"
import { checkCrmRateLimit } from "@/lib/rate-limit"
import {
    createCampaignSchema,
    updateCampaignSchema,
    type CreateCampaignData,
    type UpdateCampaignData,
} from "@/lib/validations/campaign.validations"
import { CampaignStatus, LeadStatus, type Prisma } from "@prisma/client"

import {
    sendSingleCampaign,
    sendSequenceFirstStep,
} from "@/lib/services/campaigns.service"
import {
    resolveSendWindow,
    windowCoversCronRun,
    describeCronHourIn,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"

// ============================================================
// TIPOS
// ============================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface CampaignWithRelations {
    id: string
    name: string
    description: string | null
    status: CampaignStatus
    type: "single" | "sequence"
    templateId: string | null
    template: {
        id: string
        name: string
        subject: string
    } | null
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
    scheduledAt: Date | null
    sentAt: Date | null
    createdAt: Date
    updatedAt: Date
    workspaceId: string
    _count: {
        emailSends: number
        steps: number
    }
}

type CampaignEmailSendWithLead = Prisma.EmailSendGetPayload<{
    include: {
        lead: {
            select: {
                id: true
                firstName: true
                lastName: true
                email: true
                company: true
            }
        }
    }
}>

// ============================================================
// QUERIES
// ============================================================

export async function getCampaigns(
    workspaceId: string,
    options?: {
        status?: CampaignStatus
        search?: string
    }
): Promise<ActionResult<CampaignWithRelations[]>> {
    try {
        try {
            await requireWorkspaceAccess(workspaceId)
        } catch {
            return { success: false, error: "Workspace não encontrado" }
        }

        const where: Prisma.CampaignWhereInput = { workspaceId }

        if (options?.status) {
            where.status = options.status
        }

        if (options?.search) {
            where.OR = [
                { name: { contains: options.search, mode: "insensitive" } },
                { description: { contains: options.search, mode: "insensitive" } },
            ]
        }

        const campaigns = await prisma.campaign.findMany({
            where,
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
                _count: {
                    select: {
                        emailSends: true,
                        steps: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        })

        return { success: true, data: campaigns }
    } catch (error) {
        console.error("Erro ao buscar campanhas:", error)
        return { success: false, error: "Erro ao buscar campanhas" }
    }
}

export async function getCampaignById(
    id: string
): Promise<ActionResult<CampaignWithRelations & { emailSends: CampaignEmailSendWithLead[] }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
                emailSends: {
                    include: {
                        lead: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                company: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 100,
                },
                _count: {
                    select: {
                        emailSends: true,
                        steps: true,
                    },
                },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        return { success: true, data: campaign }
    } catch (error) {
        console.error("Erro ao buscar campanha:", error)
        return { success: false, error: "Erro ao buscar campanha" }
    }
}

// ============================================================
// MUTATIONS
// ============================================================

interface CampaignSendWindowOverrideInput {
    sendWindowEnabled?: boolean | null
    sendTimezone?: string | null
    sendDays?: number[]
    sendStartHour?: number | null
    sendEndHour?: number | null
    sendJitterMinutes?: number | null
}

/**
 * Recusa um override de janela por campanha que, combinado com os defaults do
 * workspace, seja inalcançável pelo cron diário — a mesma armadilha que a
 * Task 4 fechou na escrita do workspace (ver lib/campaigns/send-window.ts).
 * Sem override (sendWindowEnabled null/undefined) a campanha herda a janela
 * do workspace, já validada naquela escrita, então não há o que checar aqui.
 * Compartilhada entre createCampaign e updateCampaign para não duplicar a
 * checagem.
 */
async function validateCampaignSendWindow(
    workspaceId: string,
    override: CampaignSendWindowOverrideInput
): Promise<string | null> {
    const hasWindowOverride =
        override.sendWindowEnabled !== null && override.sendWindowEnabled !== undefined

    if (!hasWindowOverride) {
        return null
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
            sendWindowEnabled: true,
            sendTimezone: true,
            sendDays: true,
            sendStartHour: true,
            sendEndHour: true,
            sendJitterMinutes: true,
        },
    })

    if (!workspace) {
        return "Workspace não encontrado"
    }

    const effectiveWindow = resolveSendWindow(workspace, {
        sendWindowEnabled: override.sendWindowEnabled ?? null,
        sendTimezone: override.sendTimezone ?? null,
        sendDays: override.sendDays ?? [],
        sendStartHour: override.sendStartHour ?? null,
        sendEndHour: override.sendEndHour ?? null,
        sendJitterMinutes: override.sendJitterMinutes ?? null,
    })

    if (!windowCoversCronRun(effectiveWindow)) {
        return `Os envios saem uma vez por dia, às ${CRON_SEND_HOUR_UTC}h UTC (${describeCronHourIn(
            effectiveWindow.timezone
        )} no fuso do workspace). A janela desta campanha precisa incluir esse horário, senão nenhum e-mail é enviado.`
    }

    return null
}

export async function createCampaign(
    data: CreateCampaignData
): Promise<ActionResult<{ id: string }>> {
    try {
        const validated = createCampaignSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        try {
            await requireWorkspaceAccess(validated.data.workspaceId)
        } catch {
            return { success: false, error: "Workspace não encontrado" }
        }

        // Validar leads
        const leads = await prisma.lead.findMany({
            where: {
                id: { in: validated.data.selectedLeadIds },
                workspaceId: validated.data.workspaceId,
            },
            select: { id: true },
        })

        if (leads.length === 0) {
            return { success: false, error: "Nenhum lead válido selecionado" }
        }

        const campaignType = validated.data.type || "single"

        // ============================================================
        // CAMPANHA SINGLE
        // ============================================================
        if (campaignType === "single") {
            const template = await prisma.emailTemplate.findFirst({
                where: {
                    id: validated.data.templateId!,
                    workspaceId: validated.data.workspaceId,
                },
            })

            if (!template) {
                return { success: false, error: "Template não encontrado" }
            }

            const campaign = await prisma.campaign.create({
                data: {
                    name: validated.data.name,
                    description: validated.data.description,
                    type: "single",
                    templateId: validated.data.templateId,
                    subject: template.subject,
                    body: template.body,
                    status: "DRAFT",
                    totalRecipients: leads.length,
                    workspaceId: validated.data.workspaceId,
                    emailSends: {
                        create: leads.map((lead) => ({
                            leadId: lead.id,
                            status: "PENDING",
                        })),
                    },
                },
            })

            revalidatePath("/campaigns")
            return { success: true, data: { id: campaign.id } }
        }

        // ============================================================
        // CAMPANHA SEQUENCE - Salva como DRAFT (não envia automaticamente)
        // ============================================================
        const steps = validated.data.steps || []

        if (steps.length === 0) {
            return { success: false, error: "Sequência precisa de pelo menos 1 step" }
        }

        // Só sequências usam janela de envio (ver cron de process-sequences) —
        // por isso a checagem entra aqui, e não antes de saber o tipo.
        const sendWindowError = await validateCampaignSendWindow(validated.data.workspaceId, validated.data)
        if (sendWindowError) {
            return { success: false, error: sendWindowError }
        }

        const campaign = await prisma.campaign.create({
            data: {
                name: validated.data.name,
                description: validated.data.description,
                type: "sequence",
                status: "DRAFT",
                stopOnUnsubscribe: validated.data.stopOnUnsubscribe,
                stopOnConverted: validated.data.stopOnConverted,
                sendWindowEnabled: validated.data.sendWindowEnabled ?? null,
                sendTimezone: validated.data.sendTimezone ?? null,
                sendDays: validated.data.sendDays ?? [],
                sendStartHour: validated.data.sendStartHour ?? null,
                sendEndHour: validated.data.sendEndHour ?? null,
                sendJitterMinutes: validated.data.sendJitterMinutes ?? null,
                totalRecipients: leads.length,
                workspaceId: validated.data.workspaceId,
                // Criar steps
                steps: {
                    create: steps.map((step, index) => ({
                        order: index + 1,
                        templateId: step.templateId,
                        subject: step.subject,
                        content: step.content,
                        delayDays: step.delayDays,
                        delayHours: step.delayHours,
                        condition: step.condition,
                    })),
                },
                // Criar enrollments para cada lead (status paused até clicar em Enviar)
                enrollments: {
                    create: leads.map((lead) => ({
                        leadId: lead.id,
                        status: "paused",
                        currentStep: 1,
                        startedAt: new Date(),
                    })),
                },
            },
        })

        revalidatePath("/campaigns")
        return { success: true, data: { id: campaign.id } }
    } catch (error) {
        console.error("Erro ao criar campanha:", error)
        return { success: false, error: "Erro ao criar campanha" }
    }
}

export async function updateCampaign(
    id: string,
    data: UpdateCampaignData
): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        if (campaign.status !== "DRAFT" && campaign.status !== "CANCELLED") {
            return { success: false, error: "Só é possível editar campanhas em rascunho ou canceladas" }
        }

        const validated = updateCampaignSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Só sequências usam janela de envio (ver cron de process-sequences) —
        // campanhas single não têm o que checar aqui.
        if (campaign.type === "sequence") {
            const sendWindowError = await validateCampaignSendWindow(campaign.workspaceId, validated.data)
            if (sendWindowError) {
                return { success: false, error: sendWindowError }
            }
        }

        await prisma.campaign.update({
            where: { id },
            data: {
                name: validated.data.name,
                description: validated.data.description,
                ...(campaign.type === "sequence"
                    ? {
                        sendWindowEnabled: validated.data.sendWindowEnabled ?? null,
                        sendTimezone: validated.data.sendTimezone ?? null,
                        sendDays: validated.data.sendDays ?? [],
                        sendStartHour: validated.data.sendStartHour ?? null,
                        sendEndHour: validated.data.sendEndHour ?? null,
                        sendJitterMinutes: validated.data.sendJitterMinutes ?? null,
                    }
                    : {}),
            },
        })

        revalidatePath("/campaigns")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar campanha:", error)
        return { success: false, error: "Erro ao atualizar campanha" }
    }
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        if (campaign.status === "SENDING") {
            return { success: false, error: "Não é possível excluir uma campanha em envio" }
        }

        await prisma.campaign.delete({ where: { id } })

        revalidatePath("/campaigns")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir campanha:", error)
        return { success: false, error: "Erro ao excluir campanha" }
    }
}

export async function duplicateCampaign(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const original = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                emailSends: {
                    select: { leadId: true },
                },
                steps: true,
                enrollments: {
                    select: { leadId: true },
                },
            },
        })

        if (!original) {
            return { success: false, error: "Campanha não encontrada" }
        }

        // Duplicar campanha single
        if (original.type === "single") {
            const copy = await prisma.campaign.create({
                data: {
                    name: `${original.name} (cópia)`,
                    description: original.description,
                    type: "single",
                    templateId: original.templateId,
                    subject: original.subject,
                    body: original.body,
                    status: "DRAFT",
                    totalRecipients: original.emailSends.length,
                    workspaceId: original.workspaceId,
                    emailSends: {
                        create: original.emailSends.map((es) => ({
                            leadId: es.leadId,
                            status: "PENDING",
                        })),
                    },
                },
            })

            revalidatePath("/campaigns")
            return { success: true, data: { id: copy.id } }
        }

        // Duplicar campanha sequence
        const copy = await prisma.campaign.create({
            data: {
                name: `${original.name} (cópia)`,
                description: original.description,
                type: "sequence",
                status: "DRAFT",
                stopOnUnsubscribe: original.stopOnUnsubscribe,
                stopOnConverted: original.stopOnConverted,
                totalRecipients: original.enrollments.length,
                workspaceId: original.workspaceId,
                steps: {
                    create: original.steps.map((step) => ({
                        order: step.order,
                        templateId: step.templateId,
                        subject: step.subject,
                        content: step.content,
                        delayDays: step.delayDays,
                        delayHours: step.delayHours,
                        condition: step.condition,
                    })),
                },
                enrollments: {
                    create: original.enrollments.map((e) => ({
                        leadId: e.leadId,
                        status: "paused",
                        currentStep: 1,
                        startedAt: new Date(),
                    })),
                },
            },
        })

        revalidatePath("/campaigns")
        return { success: true, data: { id: copy.id } }
    } catch (error) {
        console.error("Erro ao duplicar campanha:", error)
        return { success: false, error: "Erro ao duplicar campanha" }
    }
}

// ============================================================
// AÇÕES DE ENVIO
// ============================================================

export async function sendCampaign(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const rateLimited = await checkCrmRateLimit("campaign.send", user.id, 5, 60_000)
        if (!rateLimited) {
            return { success: false, error: "Limite de envios excedido. Aguarde um minuto e tente novamente." }
        }

        // Buscar campanha com template, workspace, steps e leads
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                template: true,
                workspace: true,
                steps: true,
                enrollments: {
                    include: {
                        lead: true,
                    },
                },
                emailSends: {
                    where: { status: "PENDING" },
                    include: {
                        lead: true,
                    },
                },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED" && campaign.status !== "PAUSED") {
            return { success: false, error: "Campanha não pode ser enviada neste status" }
        }

        // ============================================================
        // CAMPANHA SINGLE
        // ============================================================
        if (campaign.type === "single") {
            if (campaign.emailSends.length === 0) {
                return { success: false, error: "Campanha não tem destinatários pendentes" }
            }

            const subject = campaign.subject || campaign.template?.subject || ""
            const body = campaign.body || campaign.template?.body || ""

            if (!subject || !body) {
                return { success: false, error: "Template sem assunto ou corpo" }
            }

            // Atualizar status para SENDING
            await prisma.campaign.update({
                where: { id },
                data: { status: "SENDING" },
            })

            const sendResult = await sendSingleCampaign(prisma, {
                id: campaign.id,
                workspaceId: campaign.workspaceId,
                subject,
                body,
                template: campaign.template,
                workspace: campaign.workspace,
                emailSends: campaign.emailSends,
            })

            // Atualizar campanha - SENT para single
            await prisma.campaign.update({
                where: { id },
                data: {
                    status: "SENT",
                    sentAt: new Date(),
                    totalSent: sendResult.totalSent,
                    totalBounced: sendResult.totalBounced,
                },
            })

            revalidatePath("/campaigns")
            return { success: true }
        }

        // ============================================================
        // CAMPANHA SEQUENCE
        // ============================================================
        if (campaign.type === "sequence") {
            const firstStep = campaign.steps.find((s) => s.order === 1)
            if (!firstStep) {
                return { success: false, error: "Sequência não tem steps" }
            }

            // Atualizar status para SENDING
            await prisma.campaign.update({
                where: { id },
                data: { status: "SENDING" },
            })

            const sendResult = await sendSequenceFirstStep(prisma, {
                id: campaign.id,
                workspaceId: campaign.workspaceId,
                workspace: campaign.workspace,
                steps: campaign.steps,
                enrollments: campaign.enrollments,
            })

            // Verificar se tem mais steps
            const hasMoreSteps = campaign.steps.length > 1

            await prisma.campaign.update({
                where: { id },
                data: {
                    totalSent: sendResult.totalSent,
                    totalBounced: sendResult.totalBounced,
                    sentAt: new Date(),
                    status: hasMoreSteps ? "SENDING" : "SENT",
                },
            })

            revalidatePath("/campaigns")
            return { success: true }
        }

        return { success: false, error: "Tipo de campanha inválido" }
    } catch (error) {
        console.error("Erro ao enviar campanha:", error)

        await prisma.campaign
            .update({
                where: { id },
                data: { status: "DRAFT" },
            })
            .catch(() => {})

        return { success: false, error: "Erro ao enviar campanha" }
    }
}

export async function pauseCampaign(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
                status: "SENDING",
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada ou não está em envio" }
        }

        await prisma.campaign.update({
            where: { id },
            data: { status: "PAUSED" },
        })

        // Pausar enrollments ativos (para sequências)
        if (campaign.type === "sequence") {
            await prisma.campaignEnrollment.updateMany({
                where: {
                    campaignId: id,
                    status: "active",
                },
                data: {
                    status: "paused",
                    pausedAt: new Date(),
                },
            })
        }

        revalidatePath("/campaigns")
        return { success: true }
    } catch (error) {
        console.error("Erro ao pausar campanha:", error)
        return { success: false, error: "Erro ao pausar campanha" }
    }
}

export async function cancelCampaign(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        if (campaign.status === "SENT") {
            return { success: false, error: "Campanha já foi enviada" }
        }

        await prisma.campaign.update({
            where: { id },
            data: { status: "CANCELLED" },
        })

        // Parar enrollments (para sequências)
        if (campaign.type === "sequence") {
            await prisma.campaignEnrollment.updateMany({
                where: {
                    campaignId: id,
                    status: { in: ["active", "paused"] },
                },
                data: {
                    status: "stopped",
                    stoppedAt: new Date(),
                    stopReason: "campaign_cancelled",
                },
            })
        }

        revalidatePath("/campaigns")
        return { success: true }
    } catch (error) {
        console.error("Erro ao cancelar campanha:", error)
        return { success: false, error: "Erro ao cancelar campanha" }
    }
}

// ============================================================
// BUSCAR LEADS PARA SELEÇÃO
// ============================================================

export async function getLeadsForCampaign(
    workspaceId: string,
    options?: {
        status?: LeadStatus[]
        search?: string
    }
): Promise<
    ActionResult<
        {
            id: string
            firstName: string
            lastName: string | null
            email: string
            company: string | null
            status: LeadStatus
        }[]
    >
> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const where: Prisma.LeadWhereInput = {
            workspaceId,
            workspace: { userId: user.id },
        }

        if (options?.status && options.status.length > 0) {
            where.status = { in: options.status }
        }

        if (options?.search) {
            where.OR = [
                { firstName: { contains: options.search, mode: "insensitive" } },
                { lastName: { contains: options.search, mode: "insensitive" } },
                { email: { contains: options.search, mode: "insensitive" } },
                { company: { contains: options.search, mode: "insensitive" } },
            ]
        }

        const leads = await prisma.lead.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                status: true,
            },
            orderBy: { firstName: "asc" },
            take: 500,
        })

        return { success: true, data: leads }
    } catch (error) {
        console.error("Erro ao buscar leads:", error)
        return { success: false, error: "Erro ao buscar leads" }
    }
}
