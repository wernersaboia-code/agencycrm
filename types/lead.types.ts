// types/lead.types.ts

import type { LeadStatus, CompanySize, LeadSource } from "@prisma/client"

// ============================================
// TIPOS BASE
// ============================================

export interface LeadWithRelations {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    taxId: string | null
    industry: string | null
    companySize: CompanySize | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: LeadStatus
    source: LeadSource | string
    notes: string | null
    workspaceId: string
    createdAt: Date
    updatedAt: Date
}

export interface LeadStats {
    total: number
    new: number
    interested: number
    converted: number
}

// ============================================
// SERIALIZADO (para client components)
// ============================================

export interface SerializedLead {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    taxId: string | null
    industry: string | null
    companySize: string | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: string
    source: string
    notes: string | null
    workspaceId: string
    createdAt: string
    updatedAt: string
}

// ============================================
// OPÇÕES PARA SELEÇÃO
// ============================================

export interface LeadOption {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    company: string | null
}

// ============================================
// HELPERS DE SERIALIZAÇÃO
// ============================================

export function serializeLead(lead: LeadWithRelations): SerializedLead {
    return {
        ...lead,
        companySize: lead.companySize ?? null,
        status: lead.status,
        source: lead.source,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
    }
}