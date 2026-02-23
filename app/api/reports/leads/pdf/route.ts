// app/api/reports/leads/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { LeadsReportPDF } from "@/lib/pdf/templates/leads-report"
import { format } from "date-fns"
import { LeadStatus } from "@prisma/client"

// Mapa de bandeiras
import { getCountryName } from "@/lib/constants/countries.constants"

const STATUS_LABELS: Record<string, string> = {
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
            select: {
                id: true,
                name: true,
                logo: true,
                color: true,
            },
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

        // Calcular estatísticas
        const allLeadsInWorkspace = await prisma.lead.findMany({
            where: { workspaceId },
            select: { status: true, country: true, industry: true },
        })

        // Stats gerais (dos leads filtrados)
        const stats = {
            total: leads.length,
            new: leads.filter((l) => l.status === "NEW").length,
            contacted: leads.filter((l) => ["CONTACTED", "OPENED", "CLICKED", "CALLED"].includes(l.status)).length,
            interested: leads.filter((l) => l.status === "INTERESTED").length,
            converted: leads.filter((l) => l.status === "CONVERTED").length,
        }

        // Agrupar por status
        const statusCounts: Record<string, number> = {}
        leads.forEach((lead) => {
            statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1
        })
        const byStatus = Object.entries(statusCounts)
            .map(([status, count]) => ({
                status,
                count,
                label: STATUS_LABELS[status] || status,
            }))
            .sort((a, b) => b.count - a.count)

        // Agrupar por país
        const countryCounts: Record<string, number> = {}
        leads.forEach((lead) => {
            if (lead.country) {
                countryCounts[lead.country] = (countryCounts[lead.country] || 0) + 1
            }
        })
        const byCountry = Object.entries(countryCounts)
            .map(([countryCode, count]) => ({
                country: getCountryName(countryCode),
                count,
                flag: getCountryName(countryCode),
            }))
            .sort((a, b) => b.count - a.count)

        // Agrupar por segmento
        const industryCounts: Record<string, number> = {}
        leads.forEach((lead) => {
            if (lead.industry) {
                industryCounts[lead.industry] = (industryCounts[lead.industry] || 0) + 1
            }
        })
        const byIndustry = Object.entries(industryCounts)
            .map(([industry, count]) => ({ industry, count }))
            .sort((a, b) => b.count - a.count)

        // Preparar dados dos leads
        const leadsData = leads.map((lead) => ({
            id: lead.id,
            name: `${lead.firstName} ${lead.lastName || ""}`.trim(),
            email: lead.email,
            company: lead.company,
            country: lead.country,
            industry: lead.industry,
            status: lead.status,
            source: lead.source,
        }))

        // Montar dados do relatório
        const reportData = {
            workspace: {
                name: workspace.name,
                logo: workspace.logo,
                color: workspace.color,
            },
            stats,
            byStatus,
            byCountry,
            byIndustry,
            leads: leadsData,
            filters: {
                status: status || undefined,
                country: country || undefined,
                industry: industry || undefined,
                search: search || undefined,
            },
            generatedAt: new Date().toISOString(),
        }

        // Gerar PDF
        const pdfBuffer = await renderToBuffer(
            LeadsReportPDF({ data: reportData })
        )

        // Converter Buffer para Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer)

        const fileName = `leads-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`

        return new NextResponse(uint8Array, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error("Erro ao gerar PDF:", error)
        return NextResponse.json(
            { error: "Erro ao gerar relatório" },
            { status: 500 }
        )
    }
}