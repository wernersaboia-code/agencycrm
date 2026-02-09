// lib/validations/campaign.validations.ts

import { z } from "zod"
import { CampaignStatus, LeadStatus } from "@prisma/client"

// ============================================================
// SCHEMAS
// ============================================================

// Passo 1: Informações básicas
export const campaignStep1Schema = z.object({
    name: z
        .string()
        .min(1, "Nome é obrigatório")
        .max(100, "Nome deve ter no máximo 100 caracteres"),

    description: z
        .string()
        .max(500, "Descrição deve ter no máximo 500 caracteres")
        .optional()
        .nullable(),

    templateId: z
        .string()
        .min(1, "Selecione um template"),
})

// Passo 2: Seleção de leads
export const campaignStep2Schema = z.object({
    filterStatus: z
        .array(z.nativeEnum(LeadStatus))
        .optional()
        .default([]),

    filterTags: z
        .array(z.string())
        .optional()
        .default([]),

    selectedLeadIds: z
        .array(z.string())
        .min(1, "Selecione pelo menos um lead"),
})

// Passo 3: Revisão e envio
export const campaignStep3Schema = z.object({
    scheduledAt: z
        .string()
        .optional()
        .nullable(),

    sendNow: z.boolean().default(true),
})

// Schema completo para criação
export const createCampaignSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional().nullable(),
    templateId: z.string().min(1, "Template é obrigatório"),
    selectedLeadIds: z.array(z.string()).min(1, "Selecione pelo menos um lead"),
    scheduledAt: z.string().optional().nullable(),
    workspaceId: z.string().min(1, "Workspace é obrigatório"),
})

// Schema para atualização
export const updateCampaignSchema = createCampaignSchema
    .omit({ workspaceId: true })
    .partial()

// ============================================================
// TIPOS
// ============================================================

export type CampaignStep1Data = z.infer<typeof campaignStep1Schema>
export type CampaignStep2Data = z.infer<typeof campaignStep2Schema>
export type CampaignStep3Data = z.infer<typeof campaignStep3Schema>
export type CreateCampaignData = z.infer<typeof createCampaignSchema>
export type UpdateCampaignData = z.infer<typeof updateCampaignSchema>

// ============================================================
// VALORES PADRÃO
// ============================================================

export const DEFAULT_CAMPAIGN_STEP1: CampaignStep1Data = {
    name: "",
    description: "",
    templateId: "",
}

export const DEFAULT_CAMPAIGN_STEP2: CampaignStep2Data = {
    filterStatus: [],
    filterTags: [],
    selectedLeadIds: [],
}

export const DEFAULT_CAMPAIGN_STEP3: CampaignStep3Data = {
    scheduledAt: null,
    sendNow: true,
}