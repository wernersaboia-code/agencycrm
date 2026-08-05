// app/free-sample/[token]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { tokenValido } from "@/lib/free-sample/token"

/**
 * Link que vai no e-mail. Existe porque a URL assinada do bucket dura 120 s e
 * chegaria morta a quem abre a caixa no dia seguinte: aqui o token é validado
 * e uma URL nova é gerada na hora.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const pedido = await prisma.freeSampleDownload.findUnique({ where: { token } })
        // Token inexistente e token vencido devolvem a MESMA resposta: distinguir
        // os dois diria a quem varre tokens quais deles já existiram.
        if (!pedido || !tokenValido(pedido.tokenExpiresAt, new Date())) {
            return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 })
        }

        const amostra = await prisma.freeSample.findFirst({ where: { isActive: true } })
        if (!amostra) {
            return NextResponse.json({ error: "Amostra indisponível" }, { status: 404 })
        }

        return NextResponse.redirect(await createFreeSampleSignedUrl(amostra.filePath))
    } catch (error) {
        console.error("Erro ao servir a amostra por token:", error)
        return NextResponse.json({ error: "Falha no download" }, { status: 500 })
    }
}
