// types/lead.types.ts
import { Lead, LeadStatus, LeadSource, CompanySize, Tag, Call, EmailSend } from "@prisma/client"

export interface LeadWithRelations extends Lead {
    tags?: { tag: Tag }[]
    calls?: Call[]
    emailSends?: EmailSend[]
    _count?: {
        calls: number
        emailSends: number
    }
}

export interface LeadStats {
    total: number
    byStatus: Record<LeadStatus, number>
    bySource: Record<LeadSource, number>
}

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
    companySize: CompanySize | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: LeadStatus
    source: LeadSource
    notes: string | null
    workspaceId: string
    importedAt: string | null
    importBatch: string | null
    createdAt: string
    updatedAt: string
}

export interface LeadOption {
    id: string
    firstName: string
    lastName: string | null
    email: string
    company: string | null
    phone: string | null
}

export function serializeLead(lead: Lead): SerializedLead {
    return {
        ...lead,
        importedAt: lead.importedAt?.toISOString() || null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
    }
}