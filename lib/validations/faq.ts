// lib/validations/faq.ts

import { z } from "zod"

// Mensagens de erro localizadas ficam no client (react-hook-form + messages/*.json);
// este schema é a validação server-side com mensagens genéricas.
export const faqContactSchema = z.object({
    name: z.string().min(2).max(200),
    company: z.string().max(200).optional().or(z.literal("")),
    email: z.string().email().max(320),
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
    consent: z.literal(true),
    // Honeypot: campo invisível para humanos; bots que o preencherem são
    // descartados em submitFaqQuestion, que responde sucesso sem gravar nada.
    //
    // Aceita conteúdo de propósito. Com `.max(0)` o schema rejeitava antes de
    // a checagem do honeypot rodar, e o bot recebia um erro de validação — ou
    // seja, a resposta dizia a ele que o campo era armadilha, e a linha que
    // devolveria sucesso falso virava código morto. O limite existe só para
    // não aceitar payload grande.
    website: z.string().max(200).optional(),
    // Mantém sincronizado à mão com LandingLocale (components/landing/types.ts):
    // esse tipo não pode ser importado aqui sem puxar código de componente
    // para uma validação server-side.
    locale: z.enum(["pt", "de", "en", "es", "fr", "it", "nl"]).default("de"),
})

export type FaqContactValues = z.infer<typeof faqContactSchema>
