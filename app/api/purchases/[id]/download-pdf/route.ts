// app/api/purchases/[id]/download-pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"
import { createStudySignedUrl } from "@/lib/supabase/list-studies"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const item = await prisma.purchaseItem.findFirst({
            where: { id, purchase: { userId, status: "paid" } },
            include: { list: { select: { studyPdfUrl: true } } },
        })

        if (!item) {
            return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 })
        }
        if (!item.list.studyPdfUrl) {
            return NextResponse.json({ error: "Esta lista ainda não tem PDF disponível" }, { status: 404 })
        }

        await prisma.purchaseItem.update({
            where: { id },
            data: { downloadCount: { increment: 1 }, downloadedAt: new Date() },
        })

        const signedUrl = await createStudySignedUrl(item.list.studyPdfUrl)
        return NextResponse.redirect(signedUrl)
    } catch (error) {
        console.error("Error downloading study PDF:", error)
        return NextResponse.json({ error: "Falha no download" }, { status: 500 })
    }
}
