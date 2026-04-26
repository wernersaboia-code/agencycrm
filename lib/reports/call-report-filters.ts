import { CallResult, type Prisma } from "@prisma/client"
import { z } from "zod"

const dateStringSchema = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data invalida")

export const CALL_RESULT_LABELS: Record<string, string> = {
    ANSWERED: "Atendeu",
    NO_ANSWER: "Nao Atendeu",
    BUSY: "Ocupado",
    VOICEMAIL: "Caixa Postal",
    WRONG_NUMBER: "Numero Errado",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    CALLBACK: "Retornar",
    MEETING_SCHEDULED: "Reuniao Agendada",
}

export const callReportQuerySchema = z
    .object({
        workspaceId: z.string().min(1),
        startDate: dateStringSchema.optional(),
        endDate: dateStringSchema.optional(),
        result: z.union([z.nativeEnum(CallResult), z.literal("all")]).optional(),
        campaignId: z.string().optional(),
    })
    .refine(
        (params) => {
            if (!params.startDate || !params.endDate) return true
            return new Date(params.startDate) <= new Date(params.endDate)
        },
        { message: "Periodo invalido" }
    )

export type CallReportQuery = z.infer<typeof callReportQuerySchema>

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries())
}

export function buildCallReportWhere(params: CallReportQuery): Prisma.CallWhereInput {
    const where: Prisma.CallWhereInput = { workspaceId: params.workspaceId }

    if (params.startDate || params.endDate) {
        where.calledAt = {}

        if (params.startDate) {
            where.calledAt.gte = new Date(params.startDate)
        }

        if (params.endDate) {
            where.calledAt.lte = new Date(`${params.endDate}T23:59:59`)
        }
    }

    if (params.result && params.result !== "all") {
        where.result = params.result
    }

    if (params.campaignId && params.campaignId !== "all") {
        where.campaignId = params.campaignId
    }

    return where
}
