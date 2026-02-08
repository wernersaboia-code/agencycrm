// lib/validations/lead.validations.ts

import { z } from 'zod'
import { LeadStatus, LeadSource, CompanySize } from '@prisma/client'

// ============================================================
// SCHEMAS
// ============================================================

/**
 * Schema base para Lead - usado em criação e edição
 */
export const leadFormSchema = z.object({
    // === CONTATO ===
    firstName: z
        .string()
        .min(1, 'Nome é obrigatório')
        .max(100, 'Nome deve ter no máximo 100 caracteres'),
    lastName: z
        .string()
        .max(100, 'Sobrenome deve ter no máximo 100 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido')
        .max(255, 'Email deve ter no máximo 255 caracteres'),
    phone: z
        .string()
        .max(30, 'Telefone deve ter no máximo 30 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    mobile: z
        .string()
        .max(30, 'Celular deve ter no máximo 30 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),

    // === EMPRESA ===
    company: z
        .string()
        .max(200, 'Nome da empresa deve ter no máximo 200 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    jobTitle: z
        .string()
        .max(100, 'Cargo deve ter no máximo 100 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    website: z
        .string()
        .max(255, 'Website deve ter no máximo 255 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null)
        .refine(
            (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
            { message: 'Website deve começar com http:// ou https://' }
        ),
    taxId: z
        .string()
        .max(50, 'Identificador fiscal deve ter no máximo 50 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    industry: z
        .string()
        .max(100, 'Segmento deve ter no máximo 100 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    companySize: z
        .nativeEnum(CompanySize)
        .optional()
        .nullable(),

    // === LOCALIZAÇÃO ===
    address: z
        .string()
        .max(300, 'Endereço deve ter no máximo 300 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    city: z
        .string()
        .max(100, 'Cidade deve ter no máximo 100 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    state: z
        .string()
        .max(100, 'Estado deve ter no máximo 100 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    postalCode: z
        .string()
        .max(20, 'Código postal deve ter no máximo 20 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
    country: z
        .string()
        .max(2, 'Use o código do país com 2 letras (ex: BR, DE)')
        .optional()
        .nullable()
        .transform((val) => val?.toUpperCase() || null),

    // === STATUS E CONTROLE ===
    status: z.nativeEnum(LeadStatus).default('NEW'),
    source: z.nativeEnum(LeadSource).default('MANUAL'),
    notes: z
        .string()
        .max(5000, 'Notas devem ter no máximo 5000 caracteres')
        .optional()
        .nullable()
        .transform((val) => val || null),
})

/**
 * Schema para criação (requer workspaceId)
 */
export const createLeadSchema = leadFormSchema.extend({
    workspaceId: z.string().min(1, 'Workspace é obrigatório'),
})

/**
 * Schema para atualização (todos opcionais)
 */
export const updateLeadSchema = leadFormSchema.partial()

/**
 * Schema para importação CSV (mais flexível)
 */
export const importLeadSchema = leadFormSchema
    .partial()
    .required({ email: true })
    .extend({
        // Campos extras que podem vir do CSV
        fullName: z.string().optional(), // Será dividido em firstName + lastName
    })

// ============================================================
// TIPOS INFERIDOS
// ============================================================

export type LeadFormData = z.infer<typeof leadFormSchema>
export type CreateLeadData = z.infer<typeof createLeadSchema>
export type UpdateLeadData = z.infer<typeof updateLeadSchema>
export type ImportLeadData = z.infer<typeof importLeadSchema>

// ============================================================
// VALORES PADRÃO
// ============================================================

export const DEFAULT_LEAD_VALUES: LeadFormData = {
    firstName: '',
    lastName: null,
    email: '',
    phone: null,
    mobile: null,
    company: null,
    jobTitle: null,
    website: null,
    taxId: null,
    industry: null,
    companySize: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    status: 'NEW',
    source: 'MANUAL',
    notes: null,
}