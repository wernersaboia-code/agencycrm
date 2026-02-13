// lib/validations/call.validations.ts

import { z } from "zod"
import { CallResult } from "@prisma/client"

// ============================================
// ENUM VALIDATION
// ============================================

const callResultEnum = z.nativeEnum(CallResult, {
    message: "Selecione um resultado válido",
})

// ============================================
// FORM SCHEMA (usado no React Hook Form)
// ============================================

export const callFormSchema = z.object({
    result: callResultEnum,

    duration: z
        .string()
        .optional()
        .transform((val) => val?.trim() || ""),

    notes: z
        .string()
        .max(2000, "Notas devem ter no máximo 2000 caracteres")
        .optional()
        .transform((val) => val?.trim() || ""),

    followUpAt: z
        .string()
        .optional()
        .transform((val) => val?.trim() || ""),

    calledAt: z.string().min(1, "Data da ligação é obrigatória"),

    // NOVO: Campanha opcional
    campaignId: z
        .string()
        .optional()
        .transform((val) => val?.trim() || ""),
})

export type CallFormValues = z.infer<typeof callFormSchema>

// ============================================
// CREATE SCHEMA (para server action)
// ============================================

export const createCallSchema = z.object({
    leadId: z.string().min(1, "Lead é obrigatório"),
    workspaceId: z.string().min(1, "Workspace é obrigatório"),
    result: callResultEnum,
    duration: z.number().int().positive().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    followUpAt: z.coerce.date().nullable().optional(),
    calledAt: z.coerce.date().optional().default(() => new Date()),
    campaignId: z.string().nullable().optional(),  // NOVO
})

export type CreateCallInput = z.infer<typeof createCallSchema>

// ============================================
// UPDATE SCHEMA
// ============================================

export const updateCallSchema = z.object({
    result: callResultEnum.optional(),
    duration: z.number().int().positive().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    followUpAt: z.coerce.date().nullable().optional(),
    calledAt: z.coerce.date().optional(),
    campaignId: z.string().nullable().optional(),  // NOVO
})

export type UpdateCallInput = z.infer<typeof updateCallSchema>

// ============================================
// FILTER SCHEMA
// ============================================

export const callFilterSchema = z.object({
    result: z.union([callResultEnum, z.array(callResultEnum)]).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    hasFollowUp: z.boolean().optional(),
    leadId: z.string().optional(),
    campaignId: z.string().optional(),  // NOVO
    search: z.string().optional(),
})

export type CallFilterInput = z.infer<typeof callFilterSchema>