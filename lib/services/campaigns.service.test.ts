import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PrismaClient } from "@prisma/client"
import { sendSequenceFirstStep } from "./campaigns.service"

// sendEmail nunca deve tocar rede em teste unitário: mockamos o módulo
// inteiro e verificamos apenas com quais destinatários ele foi chamado.
vi.mock("@/lib/email", () => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true, id: "resend-1" }),
    replaceEmailVariables: (template: string) => template,
}))

import { sendEmail } from "@/lib/email"

function createMockPrisma(overrides: Record<string, unknown> = {}): PrismaClient {
    return {
        suppression: {
            findMany: vi.fn().mockResolvedValue([]),
            ...(overrides.suppression as object),
        },
        emailSend: {
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            ...(overrides.emailSend as object),
        },
        campaignEnrollment: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            ...(overrides.campaignEnrollment as object),
        },
        lead: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            ...(overrides.lead as object),
        },
    } as unknown as PrismaClient
}

const baseWorkspace = {
    smtpProvider: null,
    smtpHost: null,
    smtpPort: null,
    smtpUser: null,
    smtpPass: null,
    smtpSecure: null,
    senderName: "Vendas",
    senderEmail: "vendas@empresa.com",
    name: "Empresa",
}

const baseStep = {
    id: "step-1",
    order: 1,
    subject: "Assunto",
    content: "Corpo",
    delayDays: 0,
    delayHours: 0,
}

function buildLead(id: string, email: string) {
    return {
        id,
        firstName: "Lead",
        lastName: null,
        email,
        phone: null,
        company: null,
        jobTitle: null,
        industry: null,
        website: null,
        city: null,
        state: null,
        country: null,
        status: "NEW",
    }
}

describe("sendSequenceFirstStep", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("não envia para lead suprimido e marca o EmailSend como SUPPRESSED", async () => {
        const suppressedLead = buildLead("lead-suppressed", "suprimido@empresa.com")
        const okLead = buildLead("lead-ok", "ok@empresa.com")

        const prisma = createMockPrisma({
            suppression: {
                findMany: vi.fn().mockResolvedValue([{ email: "suprimido@empresa.com" }]),
            },
            emailSend: {
                createMany: vi.fn().mockResolvedValue({ count: 2 }),
                findMany: vi.fn().mockResolvedValue([
                    { id: "send-suppressed", leadId: "lead-suppressed" },
                    { id: "send-ok", leadId: "lead-ok" },
                ]),
                updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
        })

        const result = await sendSequenceFirstStep(prisma, {
            id: "campaign-1",
            workspaceId: "ws-1",
            workspace: baseWorkspace,
            steps: [baseStep],
            enrollments: [
                { id: "enr-suppressed", lead: suppressedLead },
                { id: "enr-ok", lead: okLead },
            ],
        })

        // O suprimido nunca chega a sendEmail; só o lead ok é chamado.
        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({ to: "ok@empresa.com" }),
            null
        )

        expect(result.suppressedIds).toEqual(["send-suppressed"])
        expect(result.sentIds).toEqual(["send-ok"])
        expect(result.totalSent).toBe(1)

        // filterSuppressed é chamado antes de qualquer envio (fail-closed).
        expect(prisma.suppression.findMany).toHaveBeenCalledWith({
            where: {
                email: { in: ["suprimido@empresa.com", "ok@empresa.com"] },
                OR: [{ workspaceId: null }, { workspaceId: "ws-1" }],
            },
            select: { email: true },
        })

        // O EmailSend do suprimido é marcado como SUPPRESSED, nunca BOUNCED.
        expect(prisma.emailSend.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["send-suppressed"] } },
            data: { status: "SUPPRESSED", bounceReason: "Endereço na lista de supressão" },
        })
    })

    it("aborta o lote inteiro sem enviar nada se a consulta de supressão falhar", async () => {
        const lead = buildLead("lead-1", "lead1@empresa.com")

        const prisma = createMockPrisma({
            suppression: {
                findMany: vi.fn().mockRejectedValue(new Error("db down")),
            },
        })

        await expect(
            sendSequenceFirstStep(prisma, {
                id: "campaign-1",
                workspaceId: "ws-1",
                workspace: baseWorkspace,
                steps: [baseStep],
                enrollments: [{ id: "enr-1", lead }],
            })
        ).rejects.toThrow("db down")

        expect(sendEmail).not.toHaveBeenCalled()
        // Como a exceção sobe antes de qualquer criação de EmailSend, nada é gravado.
        expect(prisma.emailSend.createMany).not.toHaveBeenCalled()
    })
})
