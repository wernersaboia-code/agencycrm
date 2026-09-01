// lib/checkout/comprovante-formato.ts
//
// Transforma os dados do comprovante em texto pronto para o PDF.
//
// Fica fora do template porque formatação de data e dinheiro é regra, não
// desenho: o comprador alemão espera "20.08.2026" e "49,90 €", e isso precisa
// ser testável sem renderizar PDF nenhum.

import { htmlLangFor, type Locale } from "@/lib/i18n/locales"
import type { DadosComprovante } from "./comprovante"
import type { ComprovanteRenderizavel } from "@/lib/pdf/templates/purchase-receipt"

/** O comprador pagou no Mercado Pago, não em "mercadopago". */
const PROVEDORES: Record<string, string> = {
    stripe: "Stripe",
    mercadopago: "Mercado Pago",
    paypal: "PayPal",
}

export function nomeDoProvedor(provedor: string): string {
    return PROVEDORES[provedor] ?? provedor
}

export function formatarComprovante(
    dados: DadosComprovante,
    locale: Locale
): ComprovanteRenderizavel {
    // Tag BCP 47 completa: "de" sozinho não define separador decimal nem
    // formato de data.
    const tag = htmlLangFor(locale)

    const dinheiro = new Intl.NumberFormat(tag, { style: "currency", currency: dados.moeda })
    const data = new Intl.DateTimeFormat(tag, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })

    return {
        numero: dados.numero,
        data: data.format(dados.pagoEm),
        pagamento: nomeDoProvedor(dados.provedor),
        // Linha ausente é linha que não aparece: endereço vazio viraria espaço
        // em branco no meio do bloco do vendedor.
        vendedor: [
            dados.vendedor.nome,
            dados.vendedor.endereco,
            dados.vendedor.documento,
            dados.vendedor.email,
        ].filter((linha): linha is string => Boolean(linha)),
        comprador: [dados.comprador.nome, dados.comprador.email, dados.comprador.documento].filter(
            (linha): linha is string => Boolean(linha)
        ),
        itens: dados.itens.map((item) => ({
            nome: item.nome,
            valor: dinheiro.format(item.preco),
        })),
        total: dinheiro.format(dados.total),
    }
}
