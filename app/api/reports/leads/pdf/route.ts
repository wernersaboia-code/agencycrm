// app/api/reports/leads/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { isAuthenticationError, requireWorkspaceAccess } from "@/lib/auth"
import { LeadsReportPDF } from "@/lib/pdf/templates/leads-report"
import { format } from "date-fns"
import {
    buildLeadReportWhere,
    leadReportQuerySchema,
    searchParamsToObject,
} from "@/lib/reports/lead-report-filters"

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
        // Pegar parâmetros da URL
        const { searchParams } = new URL(request.url)
        const parsedParams = leadReportQuerySchema.safeParse(searchParamsToObject(searchParams))
        if (!parsedParams.success) {
            return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 })
        }
        const { workspaceId, status, country, industry, search } = parsedParams.data

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
            select: {
                id: true,
                name: true,
                logo: true,
                color: true,
            },
        })

        // Montar filtros
        const where = buildLeadReportWhere(parsedParams.data)

        // Buscar leads
        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: "desc" },
        })

        // Calcular estatísticas
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
