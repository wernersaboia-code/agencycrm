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
    type?: "single" | "sequence"
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

        const campaign = await prisma.campaign.create({
            data: {
                name: validated.data.name,
                description: validated.data.description,
                type: "sequence",
                status: "DRAFT",
                stopOnUnsubscribe: validated.data.stopOnUnsubscribe,
                stopOnConverted: validated.data.stopOnConverted,
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

        // Preparar configuração SMTP
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
                    meuNome: campaign.workspace.senderName || "",
                    minhaEmpresa: campaign.workspace.name || "",
                    meuEmail: campaign.workspace.senderEmail || campaign.workspace.smtpUser || "",
                }

                const personalizedSubject = replaceEmailVariables(subject, leadData)
                const personalizedBody = replaceEmailVariables(body, leadData)

                const result = await sendEmail(
                    {
                        to: lead.email,
                        subject: personalizedSubject,
                        html: personalizedBody,
                        tags: [
                            { name: "campaign_id", value: campaign.id },
                            { name: "lead_id", value: lead.id },
                        ],
                        emailSendId: emailSend.id,
                    },
                    smtpConfig
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

                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            // Atualizar campanha - SENT para single
            await prisma.campaign.update({
                where: { id },
                data: {
                    status: "SENT",
                    sentAt: new Date(),
                    totalSent,
                    totalBounced,
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

            // Ativar todos os enrollments
            await prisma.campaignEnrollment.updateMany({
                where: { campaignId: id },
                data: { status: "active" },
            })

            let totalSent = 0
            let totalBounced = 0

            // Enviar primeiro step para todos os leads
            for (const enrollment of campaign.enrollments) {
                const lead = enrollment.lead

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
                    meuNome: campaign.workspace.senderName || "",
                    minhaEmpresa: campaign.workspace.name || "",
                    meuEmail: campaign.workspace.senderEmail || campaign.workspace.smtpUser || "",
                }

                const personalizedSubject = replaceEmailVariables(firstStep.subject, leadData)
                const personalizedBody = replaceEmailVariables(firstStep.content, leadData)

                // Criar registro de envio
                const emailSend = await prisma.emailSend.create({
                    data: {
                        campaignId: campaign.id,
                        leadId: lead.id,
                        stepId: firstStep.id,
                        stepNumber: 1,
                        status: "PENDING",
                    },
                })
                console.log('[Campaign] EmailSend criado:', emailSend.id)

                const result = await sendEmail(
                    {
                        to: lead.email,
                        subject: personalizedSubject,
                        html: personalizedBody,
                        tags: [
                            { name: "campaign_id", value: campaign.id },
                            { name: "lead_id", value: lead.id },
                            { name: "step_id", value: firstStep.id },
                        ],
                        emailSendId: emailSend.id,
                    },
                    smtpConfig
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

                    // Calcular próximo envio
                    const nextStep = campaign.steps.find((s) => s.order === 2)
                    if (nextStep) {
                        const nextSendAt = new Date()
                        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays)
                        nextSendAt.setHours(nextSendAt.getHours() + nextStep.delayHours)

                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: { nextSendAt },
                        })
                    } else {
                        // Só tinha 1 step - completar
                        await prisma.campaignEnrollment.update({
                            where: { id: enrollment.id },
                            data: {
                                status: "completed",
                                completedAt: new Date(),
                            },
                        })
                    }

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

                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            // Verificar se tem mais steps
            const hasMoreSteps = campaign.steps.length > 1

            await prisma.campaign.update({
                where: { id },
                data: {
                    totalSent,
                    totalBounced,
                    sentAt: new Date(),
                    // Se tem mais steps, fica SENDING. Se só tinha 1, vai para SENT.
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