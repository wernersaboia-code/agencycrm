import { LeadStatus, type Prisma } from "@prisma/client"
import { z } from "zod"

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    OPENED: "Abriu Email",
    CLICKED: "Clicou",
    REPLIED: "Respondeu",
    CALLED: "Ligacao Feita",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    NEGOTIATING: "Negociando",
    CONVERTED: "Convertido",
    UNSUBSCRIBED: "Descadastrado",
    BOUNCED: "Bounced",
}

export const COMPANY_SIZE_LABELS: Record<string, string> = {
    MICRO: "Micro",
    SMALL: "Pequena",
    MEDIUM: "Media",
    LARGE: "Grande",
    ENTERPRISE: "Enterprise",
}

export const leadReportQuerySchema = z.object({
    workspaceId: z.string().min(1),
    status: z.union([z.nativeEnum(LeadStatus), z.literal("all")]).optional(),
    country: z.string().optional(),
    industry: z.string().optional(),
    search: z.string().optional(),
})

export type LeadReportQuery = z.infer<typeof leadReportQuerySchema>

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries())
}

export function buildLeadReportWhere(params: LeadReportQuery): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
        workspaceId: params.workspaceId,
    }

    if (params.status && params.status !== "all") {
        where.status = params.status
    }

    if (params.country && params.country !== "all") {
        where.country = params.country
    }

    if (params.industry && params.industry !== "all") {
        where.industry = params.industry
    }

    if (params.search) {
        where.OR = [
            { firstName: { contains: params.search, mode: "insensitive" } },
            { lastName: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { company: { contains: params.search, mode: "insensitive" } },
        ]
    }

    return where
}
