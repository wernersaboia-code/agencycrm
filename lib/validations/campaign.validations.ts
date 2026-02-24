// lib/validations/campaign.validations.ts

import { z } from "zod"
import { CampaignStatus, LeadStatus } from "@prisma/client"

// ============================================================
// SEQUENCE STEP SCHEMA
// ============================================================

export const sequenceStepSchema = z.object({
    id: z.string(),
    order: z.number().min(1),
    templateId: z.string().nullable(),
    subject: z.string().min(1, "Assunto é obrigatório"),
    content: z.string().min(1, "Conteúdo é obrigatório"),
    delayDays: z.number().min(0).max(30).default(0),
    delayHours: z.number().min(0).max(23).default(0),
    condition: z.enum(["always", "not_opened", "opened", "not_clicked", "clicked"]).default("always"),
})

// ============================================================
// STEP SCHEMAS (Wizard)
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

// ============================================================
// CREATE CAMPAIGN SCHEMA (Atualizado para suportar sequências)
// ============================================================

export const createCampaignSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
    description: z.string().max(500, "Descrição muito longa").nullable().optional(),
    workspaceId: z.string().min(1, "Workspace é obrigatório"),
    selectedLeadIds: z.array(z.string()).min(1, "Selecione pelo menos um lead"),
    scheduledAt: z.string().nullable().optional(),

    // Tipo de campanha
    type: z.enum(["single", "sequence"]).default("single"),

    // Para campanhas single
    templateId: z.string().nullable().optional(),

    // Para sequências
    steps: z.array(sequenceStepSchema).optional().default([]),
    stopOnUnsubscribe: z.boolean().default(true),
    stopOnConverted: z.boolean().default(true),
}).refine(
    (data) => {
        // Se for single, precisa de templateId
        if (data.type === "single") {
            return !!data.templateId
        }
        // Se for sequence, precisa de pelo menos 1 step
        if (data.type === "sequence") {
            return data.steps && data.steps.length > 0
        }
        return true
    },
    {
        message: "Campanha single precisa de template. Sequência precisa de pelo menos 1 step.",
        path: ["type"],
    }
)

// Schema para atualização
export const updateCampaignSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").optional(),
    description: z.string().max(500, "Descrição muito longa").nullable().optional(),
})

// ============================================================
// TIPOS
// ============================================================

export type SequenceStepData = z.infer<typeof sequenceStepSchema>
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