// app/api/reports/campaign/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { CampaignReportPDF } from "@/lib/pdf/templates/campaign-report"

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
                workspace: {
                    select: {
                        name: true,
                        logo: true,
                        color: true,
                    },
                },
                emailSends: {
                    include: {
                        lead: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
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

        // Preparar dados
        const reportData = {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                status: campaign.status,
                sentAt: campaign.sentAt?.toISOString() || null,
                createdAt: campaign.createdAt.toISOString(),
                totalRecipients: campaign.totalRecipients,
                totalSent: campaign.totalSent,
                totalOpened: campaign.totalOpened,
                totalClicked: campaign.totalClicked,
                totalReplied: campaign.totalReplied,
                totalBounced: campaign.totalBounced,
            },
            workspace: campaign.workspace,
            sends: campaign.emailSends.map((send) => ({
                id: send.id,
                leadName: `${send.lead.firstName} ${send.lead.lastName || ""}`.trim(),
                leadEmail: send.lead.email,
                status: send.status,
                openCount: send.openCount,
                clickCount: send.clickCount,
                sentAt: send.sentAt?.toISOString() || null,
                openedAt: send.openedAt?.toISOString() || null,
                clickedAt: send.clickedAt?.toISOString() || null,
            })),
            generatedAt: new Date().toISOString(),
        }

        // Gerar PDF
        const pdfBuffer = await renderToBuffer(
            CampaignReportPDF({ data: reportData })
        )

        // Converter Buffer para Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer)

        // Retornar PDF
        const fileName = `relatorio-${campaign.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`

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