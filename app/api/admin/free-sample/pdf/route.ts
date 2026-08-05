// app/api/admin/free-sample/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { uploadFreeSample } from "@/lib/supabase/free-sample"
import { validatePdfFile } from "@/lib/supabase/list-studies"
import { TAG_AMOSTRA } from "@/lib/free-sample/amostra-ativa"

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()

        const form = await request.formData()
        const file = form.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
        }

        // Mesma validação do PDF do estudo: tipo e teto de 50 MB. O storage
        // (lib/supabase/free-sample.ts) não valida nada — sobe o que lhe derem
        // forçando contentType "application/pdf". Sem esta checagem aqui, um
        // arquivo que não é PDF seria salvo mascarado como PDF.
        const check = validatePdfFile({ type: file.type, size: file.size })
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        const { path } = await uploadFreeSample(file)
        // Nasce DESLIGADA: subir o arquivo não é a mesma decisão que mostrá-lo
        // na home, e publicar sem querer é pior do que um clique a mais.
        const amostra = await prisma.freeSample.create({
            data: { filePath: path, fileName: file.name, isActive: false },
        })

        revalidateTag(TAG_AMOSTRA, "max")
        return NextResponse.json({ id: amostra.id })
    } catch (error) {
        console.error("Erro ao subir a amostra:", error)
        return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
    }
}
