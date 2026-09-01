// lib/checkout/vendedor.ts
//
// Quem aparece como VENDEDOR no comprovante de compra.
//
// Fica em variável de ambiente, e não em constante no código, por dois
// motivos: razão social e endereço mudam sem deploy, e o dado é do negócio,
// não do software. Lembrando que `.env` é gitignored — em produção, isto só
// existe se estiver cadastrado no painel da Vercel, com redeploy depois.
//
// O comprovante NÃO é documento fiscal, e é por isso que este módulo não tem
// nada de imposto: nenhuma alíquota, nenhum regime, nenhuma retenção. Ele
// identifica quem vendeu, o que foi vendido e quanto foi pago. Nota fiscal,
// quando existir, é emitida fora daqui.

export interface Vendedor {
    nome: string
    endereco?: string
    documento?: string
    email?: string
}

type Ambiente = Record<string, string | undefined>

/** Variável em branco é o mesmo que ausente: `SELLER_TAX_ID=""` não vira linha vazia no PDF. */
function texto(valor: string | undefined): string | undefined {
    const limpo = valor?.trim()
    return limpo ? limpo : undefined
}

export function dadosDoVendedor(env: Ambiente = process.env): Vendedor {
    return {
        nome: texto(env.SELLER_NAME) ?? "Easy Prospect",
        endereco: texto(env.SELLER_ADDRESS),
        documento: texto(env.SELLER_TAX_ID),
        email: texto(env.SELLER_EMAIL) ?? texto(env.SMTP_FROM_EMAIL) ?? texto(env.SMTP_USER),
    }
}

/**
 * Se o comprovante identifica o vendedor de verdade.
 *
 * Nome sozinho não basta: "Easy Prospect" é o nome do site, e um comprovante
 * que só repete o nome do site não diz ao comprador de quem ele comprou. Com
 * endereço, diz — é o mínimo para o documento servir à contabilidade dele.
 */
export function vendedorEstaConfigurado(env: Ambiente = process.env): boolean {
    const vendedor = dadosDoVendedor(env)
    return Boolean(texto(env.SELLER_NAME)) && Boolean(vendedor.endereco)
}
