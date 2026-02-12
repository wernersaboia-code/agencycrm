// app/(dashboard)/campaigns/components/CampaignMetrics.tsx

"use client"

import {
    Mail,
    MailOpen,
    MousePointerClick,
    AlertTriangle,
    TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { calculateTrackingMetrics } from "@/lib/utils/tracking.utils"

// ============================================
// TYPES
// ============================================

interface EmailSend {
    status: string
    openedAt: Date | string | null
    clickedAt: Date | string | null
}

interface CampaignMetricsProps {
    emailSends: EmailSend[]
    className?: string
}

interface MetricCardProps {
    label: string
    value: number | string
    icon: React.ReactNode
    subValue?: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

// ============================================
// METRIC CARD
// ============================================

function MetricCard({
                        label,
                        value,
                        icon,
                        subValue,
                        variant = 'default'
                    }: MetricCardProps) {
    const variantStyles = {
        default: 'bg-muted/50',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-yellow-500/10 text-yellow-600',
        danger: 'bg-red-500/10 text-red-600',
    }

    return (
        <Card className={variantStyles[variant]}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subValue && (
                            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
                        )}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// CAMPAIGN METRICS
// ============================================

export function CampaignMetrics({ emailSends, className }: CampaignMetricsProps) {
    const metrics = calculateTrackingMetrics(emailSends)

    return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-5 ${className}`}>
            <MetricCard
                label="Enviados"
                value={metrics.sent}
                icon={<Mail className="h-5 w-5 text-blue-500" />}
            />

            <MetricCard
                label="Aberturas"
                value={metrics.opened}
                subValue={`${metrics.openRate}% taxa`}
                icon={<MailOpen className="h-5 w-5 text-green-500" />}
                variant={metrics.openRate > 20 ? 'success' : 'default'}
            />

            <MetricCard
                label="Cliques"
                value={metrics.clicked}
                subValue={`${metrics.clickRate}% taxa`}
                icon={<MousePointerClick className="h-5 w-5 text-purple-500" />}
                variant={metrics.clickRate > 5 ? 'success' : 'default'}
            />

            <MetricCard
                label="Click-to-Open"
                value={`${metrics.clickToOpenRate}%`}
                subValue="dos que abriram"
                icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
            />

            <MetricCard
                label="Bounces"
                value={metrics.bounced}
                icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                variant={metrics.bounced > 0 ? 'danger' : 'default'}
            />
        </div>
    )
}