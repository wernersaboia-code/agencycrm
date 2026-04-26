// app/api/reports/calls/csv/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import {
    buildCallReportWhere,
    callReportQuerySchema,
    searchParamsToObject,
} from "@/lib/reports/call-report-filters"

const RESULT_LABELS: Record<string, string> = {
    ANSWERED: "Atendeu",
    NO_ANSWER: "Não Atendeu",
    BUSY: "Ocupado",
    VOICEMAIL: "Caixa Postal",
    WRONG_NUMBER: "Número Errado",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    CALLBACK: "Retornar",
    MEETING_SCHEDULED: "Reunião Agendada",
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return ""
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const parsedParams = callReportQuerySchema.safeParse(
            searchParamsToObject(request.nextUrl.searchParams)
        )

        if (!parsedParams.success) {
            return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 })
        }

        const { workspaceId } = parsedParams.data

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace não informado" }, { status: 400 })
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
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
                        phone: true,
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

        // Gerar CSV
        const headers = [
            "Lead",
            "Email",
            "Telefone",
            "Empresa",
            "Resultado",
            "Duracao",
            "Campanha",
            "Notas",
            "Data/Hora",
            "Callback",
        ]

        const rows = calls.map((call) => [
            `${call.lead.firstName} ${call.lead.lastName || ""}`.trim(),
            call.lead.email,
            call.lead.phone || "",
            call.lead.company || "",
            RESULT_LABELS[call.result] || call.result,
            formatDuration(call.duration),
            call.campaign?.name || "",
            call.notes || "",
            format(call.calledAt, "dd/MM/yyyy HH:mm"),
            call.followUpAt ? format(call.followUpAt, "dd/MM/yyyy HH:mm") : "",
        ])

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

        const bom = "\uFEFF"
        const csvWithBom = bom + csvContent

        const fileName = `ligacoes-${workspace.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`

        return new NextResponse(csvWithBom, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error("Erro ao exportar ligações:", error)
        return NextResponse.json(
            { error: "Erro ao exportar ligações" },
            { status: 500 }
        )
    }
}
