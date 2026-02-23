// app/api/reports/leads/csv/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import { LeadStatus, CompanySize } from "@prisma/client"

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
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        // Pegar parâmetros da URL
        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get("workspaceId")
        const status = searchParams.get("status")
        const country = searchParams.get("country")
        const industry = searchParams.get("industry")
        const search = searchParams.get("search")

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace não informado" }, { status: 400 })
        }

        // Verificar se workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return NextResponse.json({ error: "Workspace não encontrado" }, { status: 404 })
        }

        // Montar filtros
        const where: any = { workspaceId }

        if (status && status !== "all") {
            where.status = status as LeadStatus
        }

        if (country && country !== "all") {
            where.country = country
        }

        if (industry && industry !== "all") {
            where.industry = industry
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
            ]
        }

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

        // Escapar valores CSV
        const escapeCSV = (value: string) => {
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return value
        }

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map(escapeCSV).join(",")),
        ].join("\n")

        // Adicionar BOM para Excel reconhecer UTF-8
        const bom = "\uFEFF"
        const csvWithBom = bom + csvContent

        const fileName = `leads-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`

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