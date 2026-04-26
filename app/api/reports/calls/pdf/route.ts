// app/api/reports/calls/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { CallsReportPDF } from "@/lib/pdf/templates/calls-report"
import { format } from "date-fns"
import {
    buildCallReportWhere,
    callReportQuerySchema,
    CALL_RESULT_LABELS,
    searchParamsToObject,
} from "@/lib/reports/call-report-filters"

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        // Pegar parâmetros da URL
        const parsedParams = callReportQuerySchema.safeParse(
            searchParamsToObject(request.nextUrl.searchParams)
        )

        if (!parsedParams.success) {
            return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 })
        }

        const { workspaceId, startDate, endDate } = parsedParams.data

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
        const where = buildCallReportWhere(parsedParams.data)

        // Buscar ligações
        const calls = await prisma.call.findMany({
            where,
            include: {
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true,
                    },
                },
                campaign: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { calledAt: "desc" },
        })

        // Calcular estatísticas
        const stats = {
            total: calls.length,
            answered: calls.filter((c) =>
                ["ANSWERED", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "MEETING_SCHEDULED"].includes(c.result)
            ).length,
            interested: calls.filter((c) => c.result === "INTERESTED").length,
            meetingsScheduled: calls.filter((c) => c.result === "MEETING_SCHEDULED").length,
            callbacks: calls.filter((c) => c.result === "CALLBACK").length,
        }

        // Agrupar por resultado
        const resultCounts: Record<string, number> = {}
        calls.forEach((call) => {
            resultCounts[call.result] = (resultCounts[call.result] || 0) + 1
        })
        const byResult = Object.entries(resultCounts)
            .map(([result, count]) => ({
                result,
                count,
                label: CALL_RESULT_LABELS[result] || result,
            }))
            .sort((a, b) => b.count - a.count)

        // Agrupar por campanha
        const campaignCounts: Record<string, number> = {}
        calls.forEach((call) => {
            const name = call.campaign?.name || "Sem campanha"
            campaignCounts[name] = (campaignCounts[name] || 0) + 1
        })
        const byCampaign = Object.entries(campaignCounts)
            .map(([campaign, count]) => ({ campaign, count }))
            .sort((a, b) => b.count - a.count)

        // Preparar dados das ligações
        const callsData = calls.map((call) => ({
            id: call.id,
            leadName: `${call.lead.firstName} ${call.lead.lastName || ""}`.trim(),
            leadEmail: call.lead.email,
            leadCompany: call.lead.company,
            result: call.result,
            duration: call.duration,
            notes: call.notes,
            campaignName: call.campaign?.name || null,
            calledAt: call.calledAt.toISOString(),
        }))

        // Montar dados do relatório
        const reportData = {
            workspace: {
                name: workspace.name,
                logo: workspace.logo,
                color: workspace.color,
            },
            stats,
            byResult,
            byCampaign,
            calls: callsData,
            period: {
                start: startDate ? format(new Date(startDate), "dd/MM/yyyy") : null,
                end: endDate ? format(new Date(endDate), "dd/MM/yyyy") : null,
            },
            generatedAt: new Date().toISOString(),
        }

        // Gerar PDF
        const pdfBuffer = await renderToBuffer(
            CallsReportPDF({ data: reportData })
        )

        // Converter Buffer para Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer)

        const fileName = `ligacoes-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`

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
