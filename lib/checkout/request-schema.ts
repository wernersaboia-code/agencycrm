import { z } from "zod"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

/**
 * Corpo aceito pelas duas rotas de checkout (PayPal e Stripe).
 *
 * O cliente manda o que quer COMPRAR e em que moeda — nunca quanto custa. O
 * zod descarta qualquer campo extra, então um `price` forjado no corpo não
 * chega ao cálculo: o preço sai de LeadListPrice, no servidor. Moeda fora de
 * SUPPORTED_CURRENCIES reprova aqui e vira 400, em vez de cair no euro.
 *
 * Compartilhado pelas duas rotas de propósito: as regras de checkout dos dois
 * provedores divergirem em silêncio é o tipo de diferença que só aparece
 * depois de uma cobrança errada.
 */
export const checkoutRequestSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
        quantity: z.number().int().positive().max(99).default(1),
    })).min(1).max(50),
    currency: z.enum(SUPPORTED_CURRENCIES),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>
