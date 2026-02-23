// app/api/reports/leads/excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import { LeadStatus } from "@prisma/client"
import * as XLSX from "xlsx"

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

        // Criar workbook
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(data)

        // Ajustar largura das colunas
        const colWidths = [
            { wch: 15 }, // Nome
            { wch: 15 }, // Sobrenome
            { wch: 30 }, // Email
            { wch: 15 }, // Telefone
            { wch: 15 }, // Celular
            { wch: 25 }, // Empresa
            { wch: 20 }, // Cargo
            { wch: 25 }, // Website
            { wch: 18 }, // CNPJ
            { wch: 15 }, // Segmento
            { wch: 12 }, // Porte
            { wch: 30 }, // Endereço
            { wch: 15 }, // Cidade
            { wch: 10 }, // Estado
            { wch: 10 }, // CEP
            { wch: 12 }, // País
            { wch: 15 }, // Status
            { wch: 12 }, // Origem
            { wch: 40 }, // Notas
            { wch: 18 }, // Criado em
        ]
        worksheet["!cols"] = colWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads")

        // Gerar buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        const fileName = `leads-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.xlsx`

        return new NextResponse(buffer, {
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