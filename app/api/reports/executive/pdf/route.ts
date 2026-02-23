// app/api/reports/executive/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { ExecutiveReportPDF } from "@/lib/pdf/templates/executive-report"
import { format } from "date-fns"

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

const RESULT_LABELS: Record<string, string> = {
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

import { getCountryName } from "@/lib/constants/countries.constants"

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get("workspaceId")
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace não informado" }, { status: 400 })
        }

        // Verificar workspace
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
            select: { id: true, name: true, logo: true, color: true },
        })

        if (!workspace) {
            return NextResponse.json({ error: "Workspace não encontrado" }, { status: 404 })
        }

        // Definir período
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

        // ========== LEADS ==========
        const leads = await prisma.lead.findMany({
            where: { workspaceId },
            select: { status: true, country: true, industry: true, createdAt: true },
        })

        const leadsInPeriod = leads.filter(
            (l) => l.createdAt >= start && l.createdAt <= end
        )

        // Stats de leads
        const leadsStats = {
            total: leads.length,
            new: leads.filter((l) => l.status === "NEW").length,
            contacted: leads.filter((l) =>
                ["CONTACTED", "OPENED", "CLICKED", "CALLED"].includes(l.status)
            ).length,
            interested: leads.filter((l) => l.status === "INTERESTED").length,
            converted: leads.filter((l) => l.status === "CONVERTED").length,
        }

        // Por status
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

        // Por país
        const countryCounts: Record<string, number> = {}
        leads.forEach((lead) => {
            if (lead.country) {
                const name = getCountryName(lead.country)
                countryCounts[name] = (countryCounts[name] || 0) + 1
            }
        })
        const byCountry = Object.entries(countryCounts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)

        // Por segmento
        const industryCounts: Record<string, number> = {}
        leads.forEach((lead) => {
            if (lead.industry) {
                industryCounts[lead.industry] = (industryCounts[lead.industry] || 0) + 1
            }
        })
        const byIndustry = Object.entries(industryCounts)
            .map(([industry, count]) => ({ industry, count }))
            .sort((a, b) => b.count - a.count)

        // ========== CAMPANHAS ==========
        const campaigns = await prisma.campaign.findMany({
            where: {
                workspaceId,
                sentAt: { gte: start, lte: end },
            },
            select: {
                id: true,
                name: true,
                totalSent: true,
                totalOpened: true,
                totalClicked: true,
            },
            orderBy: { totalOpened: "desc" },
        })

        const totalEmails = campaigns.reduce((sum, c) => sum + c.totalSent, 0)
        const totalOpened = campaigns.reduce((sum, c) => sum + c.totalOpened, 0)
        const totalClicked = campaigns.reduce((sum, c) => sum + c.totalClicked, 0)

        const campaignsStats = {
            total: campaigns.length,
            sent: campaigns.filter((c) => c.totalSent > 0).length,
            totalEmails,
            totalOpened,
            totalClicked,
            openRate: totalEmails > 0 ? (totalOpened / totalEmails) * 100 : 0,
            clickRate: totalEmails > 0 ? (totalClicked / totalEmails) * 100 : 0,
            topCampaigns: campaigns.slice(0, 10).map((c) => ({
                name: c.name,
                sent: c.totalSent,
                opened: c.totalOpened,
                clicked: c.totalClicked,
                openRate: c.totalSent > 0 ? (c.totalOpened / c.totalSent) * 100 : 0,
            })),
        }

        // ========== LIGAÇÕES ==========
        const calls = await prisma.call.findMany({
            where: {
                workspaceId,
                calledAt: { gte: start, lte: end },
            },
            select: { result: true },
        })

        const answered = calls.filter((c) =>
            ["ANSWERED", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "MEETING_SCHEDULED"].includes(c.result)
        ).length

        const callsStats = {
            total: calls.length,
            answered,
            interested: calls.filter((c) => c.result === "INTERESTED").length,
            meetingsScheduled: calls.filter((c) => c.result === "MEETING_SCHEDULED").length,
            answerRate: calls.length > 0 ? (answered / calls.length) * 100 : 0,
            conversionRate: answered > 0
                ? ((calls.filter((c) => c.result === "INTERESTED").length +
                calls.filter((c) => c.result === "MEETING_SCHEDULED").length) / answered) * 100
                : 0,
        }

        // Por resultado
        const resultCounts: Record<string, number> = {}
        calls.forEach((call) => {
            resultCounts[call.result] = (resultCounts[call.result] || 0) + 1
        })
        const byResult = Object.entries(resultCounts)
            .map(([result, count]) => ({
                result,
                count,
                label: RESULT_LABELS[result] || result,
            }))
            .sort((a, b) => b.count - a.count)

        // ========== MONTAR DADOS ==========
        const reportData = {
            workspace: {
                name: workspace.name,
                logo: workspace.logo,
                color: workspace.color,
            },
            period: {
                start: format(start, "yyyy-MM-dd"),
                end: format(end, "yyyy-MM-dd"),
            },
            leads: {
                ...leadsStats,
                byStatus,
                byCountry,
                byIndustry,
            },
            campaigns: campaignsStats,
            calls: {
                ...callsStats,
                byResult,
            },
            generatedAt: new Date().toISOString(),
        }

        // Gerar PDF
        const pdfBuffer = await renderToBuffer(
            ExecutiveReportPDF({ data: reportData })
        )

        const uint8Array = new Uint8Array(pdfBuffer)

        const fileName = `relatorio-executivo-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`

        return new NextResponse(uint8Array, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error("Erro ao gerar relatório executivo:", error)
        return NextResponse.json(
            { error: "Erro ao gerar relatório" },
            { status: 500 }
        )
    }
}