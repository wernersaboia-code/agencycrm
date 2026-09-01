// lib/checkout/comprovante-pdf.tsx
//
// Junta as três peças do comprovante: os dados (comprovante.ts), o texto no
// idioma do comprador (emails.receipt) e o desenho (purchase-receipt.tsx).
//
// É o único lugar que carrega o `@react-pdf/renderer`, e por isso o único que
// não pode ser importado de um componente de cliente.
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { loadEmailBlock } from "@/lib/email/i18n"
import type { Locale } from "@/lib/i18n/locales"
import {
    PurchaseReceiptPDF,
    type TextosComprovante,
} from "@/lib/pdf/templates/purchase-receipt"
import { montarComprovante, type CompraParaComprovante } from "./comprovante"
import { formatarComprovante } from "./comprovante-formato"

export interface ComprovanteGerado {
    conteudo: Buffer
    nomeArquivo: string
}

/**
 * O PDF e o nome do arquivo que o comprador vê.
 *
 * O nome carrega o número do comprovante porque quem baixa três compras quer
 * três arquivos distinguíveis na pasta de downloads — "comprovante.pdf",
 * "comprovante (1).pdf" não organiza conta de ninguém.
 */
export async function gerarComprovantePdf(
    compra: CompraParaComprovante,
    locale: Locale
): Promise<ComprovanteGerado> {
    const dados = montarComprovante(compra)
    const textos = (await loadEmailBlock(locale, "receipt")) as unknown as TextosComprovante & {
        fileName: string
    }

    const conteudo = await renderToBuffer(
        <PurchaseReceiptPDF dados={formatarComprovante(dados, locale)} textos={textos} />
    )

    return {
        conteudo,
        nomeArquivo: `${textos.fileName}-${dados.numero}.pdf`,
    }
}

/** O que a rota e o e-mail precisam carregar da compra para o comprovante existir. */
export const SELECAO_COMPRA_COMPROVANTE = {
    id: true,
    provider: true,
    status: true,
    total: true,
    currency: true,
    buyerEmail: true,
    buyerName: true,
    buyerTaxId: true,
    paidAt: true,
    createdAt: true,
    user: { select: { name: true, email: true, language: true } },
    items: { select: { price: true, list: { select: { name: true } } } },
} as const
