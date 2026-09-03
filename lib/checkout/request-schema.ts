import { z } from "zod"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

/**
 * Corpo aceito por todas as rotas de checkout (PayPal, Stripe e as duas do
 * Mercado Pago: cotação e criação de preferência).
 *
 * O cliente manda o que quer COMPRAR e em que moeda — nunca quanto custa. O
 * zod descarta qualquer campo extra, então um `price` forjado no corpo não
 * chega ao cálculo: o preço sai de LeadListPrice, no servidor. Moeda fora de
 * SUPPORTED_CURRENCIES reprova aqui e vira 400, em vez de cair no euro.
 *
 * Compartilhado de propósito: as regras de checkout dos provedores divergirem
 * em silêncio é o tipo de diferença que só aparece depois de uma cobrança
 * errada.
 *
 * O campo `currency` é validado aqui mas IGNORADO pelas rotas do Mercado Pago:
 * a conta é brasileira e cobra sempre em BRL. Ele continua no schema porque as
 * rotas de PayPal e Stripe, que seguem no código, dependem dele.
 */
export const checkoutRequestSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
    })).min(1).max(50),
    currency: z.enum(SUPPORTED_CURRENCIES),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>
