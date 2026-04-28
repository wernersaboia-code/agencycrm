// app/api/reports/campaign/[id]/csv/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import { buildCsv, sanitizeCsvFilenameSegment } from "@/lib/utils/csv.utils"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        // Buscar campanha com envios
        const campaign = await prisma.campaign.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                emailSends: {
                    include: {
                        lead: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                company: true,
                                phone: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
        }

        // Gerar CSV
        const headers = [
            "Nome",
            "Email",
            "Empresa",
            "Telefone",
            "Status",
            "Aberturas",
            "Cliques",
            "Enviado em",
            "Aberto em",
            "Clicado em",
        ]

        const statusLabels: Record<string, string> = {
            PENDING: "Pendente",
            SENT: "Enviado",
            DELIVERED: "Entregue",
            OPENED: "Aberto",
            CLICKED: "Clicado",
            REPLIED: "Respondido",
            BOUNCED: "Bounced",
            COMPLAINED: "Spam",
        }

        const rows = campaign.emailSends.map((send) => [
            `${send.lead.firstName} ${send.lead.lastName || ""}`.trim(),
            send.lead.email,
            send.lead.company || "",
            send.lead.phone || "",
            statusLabels[send.status] || send.status,
            send.openCount.toString(),
            send.clickCount.toString(),
            send.sentAt ? format(send.sentAt, "dd/MM/yyyy HH:mm") : "",
            send.openedAt ? format(send.openedAt, "dd/MM/yyyy HH:mm") : "",
            send.clickedAt ? format(send.clickedAt, "dd/MM/yyyy HH:mm") : "",
        ])

        const csvContent = buildCsv(headers, rows)

        // Adicionar BOM para Excel reconhecer UTF-8
        const bom = "\uFEFF"
        const csvWithBom = bom + csvContent

        const fileName = `relatorio-${sanitizeCsvFilenameSegment(campaign.name)}-${Date.now()}.csv`

        return new NextResponse(csvWithBom, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    } catch (error) {
        console.error("Erro ao gerar CSV:", error)
        return NextResponse.json(
            { error: "Erro ao gerar relatório" },
            { status: 500 }
        )
    }
}
