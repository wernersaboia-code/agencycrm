// app/api/reports/leads/csv/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticationError, requireWorkspaceAccess } from "@/lib/auth"
import { format } from "date-fns"
import {
    buildLeadReportWhere,
    leadReportQuerySchema,
    searchParamsToObject,
} from "@/lib/reports/lead-report-filters"
import { buildCsv, sanitizeCsvFilenameSegment } from "@/lib/utils/csv.utils"

// Labels para exibição
const STATUS_LABELS: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    OPENED: "Abriu Email",
    CLICKED: "Clicou",
    REPLIED: "Respondeu",
    CALLED: "Ligação Feita",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    NEGOTIATING: "Negociando",
    CONVERTED: "Convertido",
    UNSUBSCRIBED: "Descadastrado",
    BOUNCED: "Bounced",
}

const SIZE_LABELS: Record<string, string> = {
    MICRO: "Micro",
    SMALL: "Pequena",
    MEDIUM: "Média",
    LARGE: "Grande",
    ENTERPRISE: "Enterprise",
}

export async function GET(request: NextRequest) {
    try {
        // Pegar parâmetros da URL
        const { searchParams } = new URL(request.url)
        const parsedParams = leadReportQuerySchema.safeParse(searchParamsToObject(searchParams))
        if (!parsedParams.success) {
            return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 })
        }
        const { workspaceId } = parsedParams.data

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace não informado" }, { status: 400 })
        }

        try {
            await requireWorkspaceAccess(workspaceId)
        } catch (error) {
            const status = isAuthenticationError(error) ? 401 : 404
            const message = status === 401 ? "Não autorizado" : "Workspace não encontrado"
            return NextResponse.json({ error: message }, { status })
        }

        const workspace = await prisma.workspace.findUniqueOrThrow({
            where: { id: workspaceId },
        })

        // Montar filtros
        const where = buildLeadReportWhere(parsedParams.data)

        // Buscar leads
        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: "desc" },
        })

        // Gerar CSV
        const headers = [
            "Nome",
            "Sobrenome",
            "Email",
            "Telefone",
            "Celular",
            "Empresa",
            "Cargo",
            "Website",
            "CNPJ/Tax ID",
            "Segmento",
            "Porte",
            "Endereco",
            "Cidade",
            "Estado",
            "CEP",
            "Pais",
            "Status",
            "Origem",
            "Notas",
            "Criado em",
        ]

        const rows = leads.map((lead) => [
            lead.firstName || "",
            lead.lastName || "",
            lead.email,
            lead.phone || "",
            lead.mobile || "",
            lead.company || "",
            lead.jobTitle || "",
            lead.website || "",
            lead.taxId || "",
            lead.industry || "",
            lead.companySize ? SIZE_LABELS[lead.companySize] || lead.companySize : "",
            lead.address || "",
            lead.city || "",
            lead.state || "",
            lead.postalCode || "",
            lead.country || "",
            STATUS_LABELS[lead.status] || lead.status,
            lead.source || "",
            lead.notes || "",
            format(lead.createdAt, "dd/MM/yyyy HH:mm"),
        ])

        const csvContent = buildCsv(headers, rows)

        // Adicionar BOM para Excel reconhecer UTF-8
        const bom = "\uFEFF"
        const csvWithBom = bom + csvContent

        const fileName = `leads-${sanitizeCsvFilenameSegment(workspace.name)}-${format(new Date(), "yyyy-MM-dd")}.csv`

        return new NextResponse(csvWithBom, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error("Erro ao exportar leads:", error)
        return NextResponse.json(
            { error: "Erro ao exportar leads" },
            { status: 500 }
        )
    }
}
