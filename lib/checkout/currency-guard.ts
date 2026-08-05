// lib/checkout/currency-guard.ts
//
// Qual provedor atende cada moeda.
//
// Existe como módulo próprio porque a regra vale em três lugares — a tela do
// checkout, a rota do Paddle e a rota do Mercado Pago — e uma cópia divergente
// significaria mandar o comprador para um provedor que não consegue cobrá-lo.

export type ProvedorDeCobranca = "mercadopago" | "paddle"

/**
 * O Mercado Pago é a conta brasileira: cobra em BRL e exige CPF ou CNPJ do
 * pagador, então só serve quem tem documento brasileiro. O Paddle atende o
 * resto.
 *
 * Moeda desconhecida cai no Paddle de propósito: o Mercado Pago não converte e
 * cobraria o número em reais sem erro de API, enquanto o Paddle recusa moeda
 * que não suporta. Errar para o lado que reclama é mais seguro.
 */
export function providerForCurrency(currency: string): ProvedorDeCobranca {
    return currency === "BRL" ? "mercadopago" : "paddle"
}
