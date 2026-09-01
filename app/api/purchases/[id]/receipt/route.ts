// app/api/purchases/[id]/receipt/route.ts
//
// Baixa o comprovante de uma compra. Diferente das rotas irmãs deste `[id]`,
// aqui o parâmetro é o id da COMPRA, não o do item: o comprovante cobre o
// pedido inteiro, com todos os itens e o total pago.
//
// O comprovante é gerado na hora, e não guardado no bucket, porque ele é
// derivado — compra, itens e preços são imutáveis depois de pagos, então o
// mesmo pedido produz sempre o mesmo documento. Guardar traria invalidação e
// custo de storage sem nada em troca.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"
import { gerarComprovantePdf, SELECAO_COMPRA_COMPROVANTE } from "@/lib/checkout/comprovante-pdf"
import { vendedorEstaConfigurado } from "@/lib/checkout/vendedor"
import { localeFromUserLanguage } from "@/lib/i18n/user-locale"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = await getAuthenticatedUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Vendedor não identificável: o comprovante não é oferecido em lugar
        // nenhum da interface, e a rota nega igual — 404, e não 503, porque
        // para quem chega aqui o recurso simplesmente não existe.
        if (!vendedorEstaConfigurado()) {
            return NextResponse.json({ error: "Comprovante indisponível" }, { status: 404 })
        }

        // `status: "paid"` no filtro, e não depois: compra pendente não tem
        // comprovante, e devolver 404 não conta ao curioso se o pedido existe.
        const compra = await prisma.purchase.findFirst({
            where: { id, userId, status: "paid" },
            select: SELECAO_COMPRA_COMPROVANTE,
        })

        if (!compra) {
            return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 })
        }

        const locale = localeFromUserLanguage(compra.user.language)
        const { conteudo, nomeArquivo } = await gerarComprovantePdf(compra, locale)

        return new NextResponse(new Uint8Array(conteudo), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
                // Documento de pedido pago não muda, mas é pessoal: cache só no
                // navegador de quem baixou, nunca em cache compartilhado.
                "Cache-Control": "private, max-age=3600",
            },
        })
    } catch (error) {
        console.error("[Comprovante] Falha ao gerar:", error)
        return NextResponse.json({ error: "Falha ao gerar comprovante" }, { status: 500 })
    }
}
