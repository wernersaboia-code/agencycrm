// app/api/admin/lists/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import {
    uploadListPdf,
    removeListPdfByPath,
    validatePdfFile,
} from "@/lib/supabase/list-studies"
import { encontrarContatosPessoaisNoPdf } from "@/lib/marketplace/pdf-contatos"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin()
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

        // Contato pessoal dentro do estudo é o que fez o Paddle enquadrar o
        // site como marketing direto, e é o que expõe o comprador ao §7 da UWG
        // alemã. O bloqueio não é definitivo — o detector erra para menos e
        // para mais —, mas obrigar uma confirmação explícita impede que um PDF
        // volte a subir com e-mail nominal só porque ninguém reparou.
        const bytes = new Uint8Array(await file.arrayBuffer())
        const achados = await encontrarContatosPessoaisNoPdf(bytes)
        const confirmado = formData.get("confirmarContatosPessoais") === "true"

        if (achados.length > 0 && !confirmado) {
            return NextResponse.json(
                { error: "contatos_pessoais", achados: achados.slice(0, 40) },
                { status: 422 }
            )
        }

        const { url } = await uploadListPdf(file, id)

        if (achados.length > 0) {
            await recordAudit({
                actorId: admin.id,
                actorEmail: admin.email,
                action: "list.pdf.personal_contacts_confirmed",
                targetType: "list",
                targetId: id,
                metadata: {
                    file: file.name,
                    total: achados.length,
                    achados: achados.slice(0, 40),
                },
            })
        }

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
        const admin = await requireAdmin()
        const { id } = await params

        const list = await prisma.leadList.findUnique({
            where: { id },
            select: { studyPdfUrl: true, isActive: true, name: true },
        })
        if (list?.studyPdfUrl) {
            await removeListPdfByPath(list.studyPdfUrl)
        }

        // Sem o PDF a lista não entrega nada: catálogo, página e checkout só
        // filtram por isActive, então mantê-la ativa deixa o comprador pagar e
        // esbarrar em "esta lista ainda não tem PDF disponível" no download.
        // Despublicar junto é a única forma de a remoção não virar venda vazia.
        await prisma.leadList.update({
            where: { id },
            data: { studyPdfUrl: null, studyPdfName: null, isActive: false },
        })

        const unpublished = list?.isActive === true

        if (unpublished) {
            await recordAudit({
                actorId: admin.id,
                actorEmail: admin.email,
                action: "list.unpublished",
                targetType: "list",
                targetId: id,
                metadata: { name: list?.name ?? null, reason: "study_pdf_removed" },
            })
        }

        return NextResponse.json({ ok: true, unpublished })
    } catch (error) {
        console.error("Error removing study PDF:", error)
        return NextResponse.json({ error: "Falha ao remover" }, { status: 500 })
    }
}
