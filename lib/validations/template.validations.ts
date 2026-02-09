// lib/validations/template.validations.ts

import { z } from "zod"
import { TemplateCategory } from "@prisma/client"

// ============================================================
// SCHEMAS
// ============================================================

export const templateFormSchema = z.object({
    name: z
        .string()
        .min(1, "Nome é obrigatório")
        .max(100, "Nome deve ter no máximo 100 caracteres"),

    category: z.nativeEnum(TemplateCategory, {
        message: "Categoria inválida",
    }),

    subject: z
        .string()
        .min(1, "Assunto é obrigatório")
        .max(200, "Assunto deve ter no máximo 200 caracteres"),

    body: z
        .string()
        .min(1, "Corpo do email é obrigatório")
        .max(50000, "Corpo deve ter no máximo 50.000 caracteres"),

    isActive: z.boolean().default(true),
})

export const createTemplateSchema = templateFormSchema.extend({
    workspaceId: z.string().min(1, "Workspace é obrigatório"),
})

export const updateTemplateSchema = templateFormSchema.partial()

// ============================================================
// TIPOS
// ============================================================

export type TemplateFormData = z.infer<typeof templateFormSchema>
export type CreateTemplateData = z.infer<typeof createTemplateSchema>
export type UpdateTemplateData = z.infer<typeof updateTemplateSchema>

// ============================================================
// VALORES PADRÃO
// ============================================================

export const DEFAULT_TEMPLATE_VALUES: TemplateFormData = {
    name: "",
    category: "PROSPECTING",
    subject: "",
    body: "",
    isActive: true,
}