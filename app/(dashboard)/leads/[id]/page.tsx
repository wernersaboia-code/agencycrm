// app/(dashboard)/leads/[id]/page.tsx

import { notFound } from "next/navigation"
import { getLeadById, getLeadEmailSends } from "@/actions/leads"
import { getCallsByLead } from "@/actions/calls"
import { LeadDetailClient } from "./lead-detail-client"

// ============================================
// TYPES
// ============================================

interface LeadDetailPageProps {
    params: Promise<{ id: string }>
}

// ============================================
// PAGE
// ============================================

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
    const { id } = await params

    const leadResult = await getLeadById(id)

    if (!leadResult.success || !leadResult.data) {
        notFound()
    }

    const lead = leadResult.data

    const [calls, emailSends] = await Promise.all([
        getCallsByLead(id),
        getLeadEmailSends(id),
    ])

    // Serializa as datas para o client component
    const serializedLead = {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        company: lead.company,
        jobTitle: lead.jobTitle,
        website: lead.website,
        industry: lead.industry,
        companySize: lead.companySize,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postalCode: lead.postalCode,
        taxId: lead.taxId,
        status: lead.status,
        source: lead.source,
        notes: lead.notes,
        workspaceId: lead.workspaceId,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
    }

    return (
        <LeadDetailClient
            lead={serializedLead}
            initialCalls={calls}
            initialEmailSends={emailSends}
        />
    )
}