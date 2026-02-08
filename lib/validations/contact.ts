// lib/validations/contact.ts

import { z } from "zod"

export const contactFormSchema = z.object({
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().min(1, "Sobrenome é obrigatório"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    mobile: z.string().optional().or(z.literal("")),
    position: z.string().optional().or(z.literal("")),
    department: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "CUSTOMER", "CHURNED"]),
    source: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    companyId: z.string().optional().or(z.literal("")),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>