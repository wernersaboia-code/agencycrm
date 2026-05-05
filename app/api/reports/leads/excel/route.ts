// app/api/reports/leads/excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticationError, requireWorkspaceAccess } from "@/lib/auth"
import { format } from "date-fns"
import writeXlsxFile from "write-excel-file/node"
import {
    buildLeadReportWhere,
    leadReportQuerySchema,
    searchParamsToObject,
} from "@/lib/reports/lead-report-filters"

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

        // Preparar dados para Excel
        const data = leads.map((lead) => ({
            Nome: lead.firstName || "",
            Sobrenome: lead.lastName || "",
            Email: lead.email,
            Telefone: lead.phone || "",
            Celular: lead.mobile || "",
            Empresa: lead.company || "",
            Cargo: lead.jobTitle || "",
            Website: lead.website || "",
            "CNPJ/Tax ID": lead.taxId || "",
            Segmento: lead.industry || "",
            Porte: lead.companySize ? SIZE_LABELS[lead.companySize] || lead.companySize : "",
            Endereco: lead.address || "",
            Cidade: lead.city || "",
            Estado: lead.state || "",
            CEP: lead.postalCode || "",
            Pais: lead.country || "",
            Status: STATUS_LABELS[lead.status] || lead.status,
            Origem: lead.source || "",
            Notas: lead.notes || "",
            "Criado em": format(lead.createdAt, "dd/MM/yyyy HH:mm"),
        }))

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
        const buffer = await writeXlsxFile([
            headers,
            ...data.map((row) => headers.map((header) => row[header as keyof typeof row] ?? "")),
        ]).toBuffer()

        const fileName = `leads-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.xlsx`

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
