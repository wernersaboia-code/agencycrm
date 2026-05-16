import type { PrismaClient } from "@prisma/client"

import { sendEmail, replaceEmailVariables, type SmtpConfig } from "@/lib/email"
import { decryptSecret } from "@/lib/secrets"

interface LeadData {
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
    company: string
    jobTitle: string
    industry: string
    website: string
    city: string
    state: string
    country: string
    meuNome: string
    minhaEmpresa: string
    meuEmail: string
    [key: string]: string | null | undefined
}

function buildLeadData(lead: {
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    company: string | null
    jobTitle: string | null
    industry: string | null
    website: string | null
    city: string | null
    state: string | null
    country: string | null
}, workspace: {
    senderName: string | null
    name: string | null
    senderEmail: string | null
    smtpUser: string | null
}): LeadData {
    return {
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
        meuNome: workspace.senderName || "",
        minhaEmpresa: workspace.name || "",
        meuEmail: workspace.senderEmail || workspace.smtpUser || "",
    }
}

interface SendCampaignResult {
    totalSent: number
    totalBounced: number
    sentIds: string[]
    bouncedIds: string[]
    bouncedReasons: Record<string, string>
    newLeadIds: string[]
}

/**
 * Send a single campaign to all pending recipients.
 * Reduces DB writes by batching updates at the end.
 */
export async function sendSingleCampaign(
    prisma: PrismaClient,
    campaign: {
        id: string
        subject: string | null
        body: string | null
        template: { subject: string | null; body: string | null } | null
        workspace: {
            smtpProvider: string | null
            smtpHost: string | null
            smtpPort: number | null
            smtpUser: string | null
            smtpPass: string | null
            smtpSecure: boolean | null
            senderName: string | null
            senderEmail: string | null
            name: string | null
        }
        emailSends: Array<{
            id: string
            lead: {
                id: string
                firstName: string
                lastName: string | null
                email: string
                phone: string | null
                company: string | null
                jobTitle: string | null
                industry: string | null
                website: string | null
                city: string | null
                state: string | null
                country: string | null
                status: string
            }
        }>
    }
): Promise<SendCampaignResult> {
    const subject = campaign.subject || campaign.template?.subject || ""
    const body = campaign.body || campaign.template?.body || ""

    const smtpPass = campaign.workspace.smtpPass
        ? decryptSecret(campaign.workspace.smtpPass)
        : null
    const smtpConfig: SmtpConfig | null =
        campaign.workspace.smtpUser && smtpPass
            ? {
                provider: campaign.workspace.smtpProvider,
                host: campaign.workspace.smtpHost,
                port: campaign.workspace.smtpPort,
                user: campaign.workspace.smtpUser,
                pass: smtpPass,
                secure: campaign.workspace.smtpSecure ?? false,
                senderName: campaign.workspace.senderName,
                senderEmail: campaign.workspace.senderEmail,
            }
            : null

    const result: SendCampaignResult = {
        totalSent: 0,
        totalBounced: 0,
        sentIds: [],
        bouncedIds: [],
        bouncedReasons: {},
        newLeadIds: [],
    }

    for (const emailSend of campaign.emailSends) {
        const lead = emailSend.lead
        const leadData = buildLeadData(lead, campaign.workspace)

        const personalizedSubject = replaceEmailVariables(subject, leadData)
        const personalizedBody = replaceEmailVariables(body, leadData)

        const sendResult = await sendEmail(
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

        if (sendResult.success) {
            result.sentIds.push(emailSend.id)
            result.totalSent++
            if (lead.status === "NEW") {
                result.newLeadIds.push(lead.id)
            }
        } else {
            result.bouncedIds.push(emailSend.id)
            result.bouncedReasons[emailSend.id] = sendResult.error || "Unknown error"
            result.totalBounced++
        }

        // Rate limit between sends to avoid SMTP throttling
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Batch update all sent records
    if (result.sentIds.length > 0) {
        const now = new Date()
        await prisma.emailSend.updateMany({
            where: { id: { in: result.sentIds } },
            data: { status: "SENT", sentAt: now },
        })
    }

    // Batch update all bounced records
    if (result.bouncedIds.length > 0) {
        const now = new Date()
        // Prisma updateMany doesn't support per-record values, so we update all with a generic reason
        // For detailed per-record reasons, we'd need individual updates or a raw query
        await prisma.emailSend.updateMany({
            where: { id: { in: result.bouncedIds } },
            data: { status: "BOUNCED", bouncedAt: now },
        })
    }

    // Batch update leads from NEW to CONTACTED
    if (result.newLeadIds.length > 0) {
        await prisma.lead.updateMany({
            where: { id: { in: result.newLeadIds }, status: "NEW" },
            data: { status: "CONTACTED" },
        })
    }

    return result
}

interface SequenceSendResult extends SendCampaignResult {
    enrollmentNextSendIds: string[]
    enrollmentCompletedIds: string[]
}

/**
 * Send the first step of a sequence campaign.
 */
export async function sendSequenceFirstStep(
    prisma: PrismaClient,
    campaign: {
        id: string
        workspace: {
            smtpProvider: string | null
            smtpHost: string | null
            smtpPort: number | null
            smtpUser: string | null
            smtpPass: string | null
            smtpSecure: boolean | null
            senderName: string | null
            senderEmail: string | null
            name: string | null
        }
        steps: Array<{
            id: string
            order: number
            subject: string
            content: string
            delayDays: number
            delayHours: number
        }>
        enrollments: Array<{
            id: string
            lead: {
                id: string
                firstName: string
                lastName: string | null
                email: string
                phone: string | null
                company: string | null
                jobTitle: string | null
                industry: string | null
                website: string | null
                city: string | null
                state: string | null
                country: string | null
                status: string
            }
        }>
    }
): Promise<SequenceSendResult> {
    const firstStep = campaign.steps.find((s) => s.order === 1)
    if (!firstStep) {
        throw new Error("NO_FIRST_STEP")
    }

    const nextStep = campaign.steps.find((s) => s.order === 2)

    const smtpPass = campaign.workspace.smtpPass
        ? decryptSecret(campaign.workspace.smtpPass)
        : null
    const smtpConfig: SmtpConfig | null =
        campaign.workspace.smtpUser && smtpPass
            ? {
                provider: campaign.workspace.smtpProvider,
                host: campaign.workspace.smtpHost,
                port: campaign.workspace.smtpPort,
                user: campaign.workspace.smtpUser,
                pass: smtpPass,
                secure: campaign.workspace.smtpSecure ?? false,
                senderName: campaign.workspace.senderName,
                senderEmail: campaign.workspace.senderEmail,
            }
            : null

    const result: SequenceSendResult = {
        totalSent: 0,
        totalBounced: 0,
        sentIds: [],
        bouncedIds: [],
        bouncedReasons: {},
        newLeadIds: [],
        enrollmentNextSendIds: [],
        enrollmentCompletedIds: [],
    }

    const emailSendCreates: Array<{
        campaignId: string
        leadId: string
        stepId: string
        stepNumber: number
        status: "PENDING"
    }> = []

    // Pre-build all emailSend records
    for (const enrollment of campaign.enrollments) {
        emailSendCreates.push({
            campaignId: campaign.id,
            leadId: enrollment.lead.id,
            stepId: firstStep.id,
            stepNumber: 1,
            status: "PENDING",
        })
    }

    // Batch create all emailSends
    if (emailSendCreates.length > 0) {
        await prisma.emailSend.createMany({
            data: emailSendCreates,
            skipDuplicates: true,
        })
    }

    // Fetch the created emailSends to get their IDs
    const createdSends = await prisma.emailSend.findMany({
        where: {
            campaignId: campaign.id,
            stepId: firstStep.id,
            status: "PENDING",
        },
        select: { id: true, leadId: true },
    })

    const emailSendIdByLeadId = new Map(createdSends.map((s) => [s.leadId, s.id]))

    // Activate enrollments
    await prisma.campaignEnrollment.updateMany({
        where: { campaignId: campaign.id },
        data: { status: "active" },
    })

    for (const enrollment of campaign.enrollments) {
        const lead = enrollment.lead
        const leadData = buildLeadData(lead, campaign.workspace)

        const personalizedSubject = replaceEmailVariables(firstStep.subject, leadData)
        const personalizedBody = replaceEmailVariables(firstStep.content, leadData)

        const emailSendId = emailSendIdByLeadId.get(lead.id)
        if (!emailSendId) continue

        const sendResult = await sendEmail(
            {
                to: lead.email,
                subject: personalizedSubject,
                html: personalizedBody,
                tags: [
                    { name: "campaign_id", value: campaign.id },
                    { name: "lead_id", value: lead.id },
                    { name: "step_id", value: firstStep.id },
                ],
                emailSendId,
            },
            smtpConfig
        )

        if (sendResult.success) {
            result.sentIds.push(emailSendId)
            result.totalSent++
            if (lead.status === "NEW") {
                result.newLeadIds.push(lead.id)
            }

            if (nextStep) {
                result.enrollmentNextSendIds.push(enrollment.id)
            } else {
                result.enrollmentCompletedIds.push(enrollment.id)
            }
        } else {
            result.bouncedIds.push(emailSendId)
            result.bouncedReasons[emailSendId] = sendResult.error || "Unknown error"
            result.totalBounced++
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Batch updates
    const now = new Date()
    if (result.sentIds.length > 0) {
        await prisma.emailSend.updateMany({
            where: { id: { in: result.sentIds } },
            data: { status: "SENT", sentAt: now },
        })
    }
    if (result.bouncedIds.length > 0) {
        await prisma.emailSend.updateMany({
            where: { id: { in: result.bouncedIds } },
            data: { status: "BOUNCED", bouncedAt: now },
        })
    }
    if (result.newLeadIds.length > 0) {
        await prisma.lead.updateMany({
            where: { id: { in: result.newLeadIds }, status: "NEW" },
            data: { status: "CONTACTED" },
        })
    }
    if (result.enrollmentNextSendIds.length > 0 && nextStep) {
        const nextSendAt = new Date()
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays)
        nextSendAt.setHours(nextSendAt.getHours() + nextStep.delayHours)
        await prisma.campaignEnrollment.updateMany({
            where: { id: { in: result.enrollmentNextSendIds } },
            data: { nextSendAt },
        })
    }
    if (result.enrollmentCompletedIds.length > 0) {
        await prisma.campaignEnrollment.updateMany({
            where: { id: { in: result.enrollmentCompletedIds } },
            data: { status: "completed", completedAt: now },
        })
    }

    return result
}
