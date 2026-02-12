// app/(dashboard)/campaigns/[id]/page.tsx

import { notFound } from "next/navigation"
import { getCampaignById } from "@/actions/campaigns"
import { CampaignDetailClient } from "./campaign-detail-client"

// ============================================
// TYPES
// ============================================

interface PageProps {
    params: Promise<{ id: string }>
}

// ============================================
// PAGE
// ============================================

export default async function CampaignDetailPage({ params }: PageProps) {
    const { id } = await params

    const result = await getCampaignById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    // Serialize dates for client component
    const campaign = {
        ...result.data,
        createdAt: result.data.createdAt.toISOString(),
        updatedAt: result.data.updatedAt.toISOString(),
        sentAt: result.data.sentAt?.toISOString() || null,
        scheduledAt: result.data.scheduledAt?.toISOString() || null,
        emailSends: result.data.emailSends.map((send) => ({
            ...send,
            sentAt: send.sentAt?.toISOString() || null,
            openedAt: send.openedAt?.toISOString() || null,
            clickedAt: send.clickedAt?.toISOString() || null,
            repliedAt: send.repliedAt?.toISOString() || null,
            bouncedAt: send.bouncedAt?.toISOString() || null,
        })),
    }

    return <CampaignDetailClient campaign={campaign} />
}