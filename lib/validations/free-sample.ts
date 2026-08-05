// lib/validations/free-sample.ts

import { z } from "zod"

/**
 * Pedido da amostra gratuita. Só e-mail e consentimento: nome e empresa são
 * atrito num formulário cuja única função é provar o produto, e o endereço já
 * basta para começar a conversa.
 */
export const freeSampleRequestSchema = z.object({
    email: z.string().email().max(320),
    // `literal(true)` e não `boolean()`: caixa desmarcada precisa reprovar,
    // não gravar `consent: false`. Sem consentimento não há finalidade para
    // guardar o endereço.
    consent: z.literal(true),
    // Honeypot: campo invisível para humanos. Aceita conteúdo de propósito —
    // quem descarta é a action, respondendo sucesso sem gravar. Rejeitar aqui
    // devolveria erro de validação ao bot, avisando que o campo é armadilha.
    website: z.string().max(200).optional(),
    // Mantido à mão em sincronia com LandingLocale (components/landing/types.ts):
    // importar aquele tipo puxaria código de componente para validação server-side.
    locale: z.enum(["pt", "de", "en", "es", "fr", "it", "nl"]).default("pt"),
})

export type FreeSampleRequestValues = z.infer<typeof freeSampleRequestSchema>
