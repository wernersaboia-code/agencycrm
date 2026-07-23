// app/api/admin/lists/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import {
    uploadListPdf,
    removeListPdfByPath,
    validatePdfFile,
} from "@/lib/supabase/list-studies"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({ where: { id }, select: { id: true, studyPdfUrl: true } })
        if (!list) {
            return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
        }

        const formData = await request.formData()
        const file = formData.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
        }

        const check = validatePdfFile({ type: file.type, size: file.size })
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        const { url } = await uploadListPdf(file, id)

        await prisma.leadList.update({
            where: { id },
            data: { studyPdfUrl: url, studyPdfName: file.name },
        })

        return NextResponse.json({ studyPdfName: file.name })
    } catch (error) {
        console.error("Error uploading study PDF:", error)
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({ where: { id }, select: { studyPdfUrl: true } })
        if (list?.studyPdfUrl) {
            await removeListPdfByPath(list.studyPdfUrl)
        }

        await prisma.leadList.update({
            where: { id },
            data: { studyPdfUrl: null, studyPdfName: null },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error removing study PDF:", error)
        return NextResponse.json({ error: "Falha ao remover" }, { status: 500 })
    }
}
