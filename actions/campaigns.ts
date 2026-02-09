// actions/campaigns.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import {
    createCampaignSchema,
    updateCampaignSchema,
    type CreateCampaignData,
    type UpdateCampaignData,
} from "@/lib/validations/campaign.validations"
import { CampaignStatus, LeadStatus } from "@prisma/client"
import { sendEmail, replaceEmailVariables } from "@/lib/email"

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
    }
}

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
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const where: any = { workspaceId }

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
                    select: { emailSends: true },
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
): Promise<ActionResult<CampaignWithRelations & { emailSends: any[] }>> {
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
                    select: { emailSends: true },
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

export async function createCampaign(
    data: CreateCampaignData
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const validated = createCampaignSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: validated.data.workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const template = await prisma.emailTemplate.findFirst({
            where: {
                id: validated.data.templateId,
                workspaceId: validated.data.workspaceId,
            },
        })

        if (!template) {
            return { success: false, error: "Template não encontrado" }
        }

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

        const campaign = await prisma.campaign.create({
            data: {
                name: validated.data.name,
                description: validated.data.description,
                templateId: validated.data.templateId,
                subject: template.subject,
                body: template.body,
                status: validated.data.scheduledAt ? "SCHEDULED" : "DRAFT",
                scheduledAt: validated.data.scheduledAt
                    ? new Date(validated.data.scheduledAt)
                    : null,
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

        if (campaign.status !== "DRAFT") {
            return { success: false, error: "Só é possível editar campanhas em rascunho" }
        }

        const validated = updateCampaignSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        await prisma.campaign.update({
            where: { id },
            data: {
                name: validated.data.name,
                description: validated.data.description,
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
            },
        })

        if (!original) {
            return { success: false, error: "Campanha não encontrada" }
        }

        const copy = await prisma.campaign.create({
            data: {
                name: `${original.name} (cópia)`,
                description: original.description,
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

        // Buscar campanha com template, workspace e leads
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                template: true,
                workspace: true, // Incluir workspace para pegar config SMTP
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

        if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
            return { success: false, error: "Campanha não pode ser enviada neste status" }
        }

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

        // Preparar configuração SMTP do workspace (se existir)
        const smtpConfig = campaign.workspace.smtpUser && campaign.workspace.smtpPass
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

        let totalSent = 0
        let totalBounced = 0

        for (const emailSend of campaign.emailSends) {
            const lead = emailSend.lead

            const leadData = {
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
            }

            const personalizedSubject = replaceEmailVariables(subject, leadData)
            const personalizedBody = replaceEmailVariables(body, leadData)

            // Usar a função sendEmail que decide automaticamente entre SMTP e Resend
            const result = await sendEmail(
                {
                    to: lead.email,
                    subject: personalizedSubject,
                    html: personalizedBody,
                    tags: [
                        { name: "campaign_id", value: campaign.id },
                        { name: "lead_id", value: lead.id },
                    ],
                },
                smtpConfig // Passa config SMTP se existir
            )

            if (result.success) {
                await prisma.emailSend.update({
                    where: { id: emailSend.id },
                    data: {
                        status: "SENT",
                        sentAt: new Date(),
                        resendId: result.id,
                    },
                })
                totalSent++

                if (lead.status === "NEW") {
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: "CONTACTED" },
                    })
                }
            } else {
                await prisma.emailSend.update({
                    where: { id: emailSend.id },
                    data: {
                        status: "BOUNCED",
                        bouncedAt: new Date(),
                        bounceReason: result.error,
                    },
                })
                totalBounced++
            }

            // Pequeno delay entre emails
            await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Atualizar campanha com totais
        await prisma.campaign.update({
            where: { id },
            data: {
                status: "SENT",
                sentAt: new Date(),
                totalSent: { increment: totalSent },
                totalBounced: { increment: totalBounced },
            },
        })

        revalidatePath("/campaigns")
        return { success: true }
    } catch (error) {
        console.error("Erro ao enviar campanha:", error)

        // Reverter status se der erro
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

        const where: any = { workspaceId }

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