// app/api/free-sample/pdf/route.ts

import { NextResponse } from "next/server"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"

export const dynamic = "force-dynamic"

/**
 * Leitura pública da amostra ativa — sem e-mail e sem cadastro.
 *
 * É uma rota de redirecionamento, e não a URL assinada direto no HTML, por dois
 * motivos: a home é estática/cacheada (uma URL assinada embutida expiraria no
 * build) e o bucket `free-sample` continua privado. Cada abertura gera uma
 * assinatura nova, então o visualizador funciona mesmo com a aba aberta por
 * muito tempo — basta recarregar.
 */
export async function GET() {
    const amostra = await getAmostraAtiva()
    if (!amostra) {
        return NextResponse.json({ error: "Estudo gratuito indisponível" }, { status: 404 })
    }

    try {
        const signedUrl = await createFreeSampleSignedUrl(amostra.filePath, 60 * 60)

        return NextResponse.redirect(signedUrl, {
            headers: {
                // A assinatura expira; nenhum cache intermediário deve guardá-la.
                "Cache-Control": "no-store",
            },
        })
    } catch (error) {
        console.error("Erro ao servir o estudo gratuito:", error)
        return NextResponse.json({ error: "Falha ao abrir o estudo" }, { status: 500 })
    }
}
