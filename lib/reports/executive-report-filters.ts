import { z } from "zod"

const dateStringSchema = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data invalida")

export const executiveReportQuerySchema = z
    .object({
        workspaceId: z.string().min(1),
        startDate: dateStringSchema.optional(),
        endDate: dateStringSchema.optional(),
    })
    .refine(
        (params) => {
            if (!params.startDate || !params.endDate) return true
            return new Date(params.startDate) <= new Date(params.endDate)
        },
        { message: "Periodo invalido" }
    )

export type ExecutiveReportQuery = z.infer<typeof executiveReportQuerySchema>

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries())
}

export function getExecutiveReportPeriod(params: ExecutiveReportQuery): {
    start: Date
    end: Date
} {
    return {
        start: params.startDate
            ? new Date(params.startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: params.endDate ? new Date(`${params.endDate}T23:59:59`) : new Date(),
    }
}
