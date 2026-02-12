// components/campaigns/campaign-metrics.tsx

"use client"

import {
    Users,
    Mail,
    MailOpen,
    MousePointerClick,
    MessageSquare,
    AlertTriangle,
    TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface MetricCardProps {
    label: string
    value: number | string
    subValue?: string
    icon: React.ReactNode
    iconColor?: string
    trend?: "up" | "down" | "neutral"
}

interface CampaignMetricsProps {
    metrics: {
        total: number
        sent: number
        opened: number
        clicked: number
        replied: number
        bounced: number
        openRate: number
        clickRate: number
        replyRate: number
    }
    variant?: "compact" | "full"
    className?: string
}

// ============================================
// METRIC CARD
// ============================================

function MetricCard({
                        label,
                        value,
                        subValue,
                        icon,
                        iconColor = "text-muted-foreground",
                        trend,
                    }: MetricCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold">{value}</p>
                            {trend === "up" && (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        {subValue && (
                            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
                        )}
                    </div>
                    <div className={cn(
                        "h-10 w-10 rounded-full bg-muted flex items-center justify-center",
                        iconColor
                    )}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// CAMPAIGN METRICS (FULL)
// ============================================

export function CampaignMetrics({
                                    metrics,
                                    variant = "full",
                                    className
                                }: CampaignMetricsProps) {
    if (variant === "compact") {
        return (
            <div className={cn("flex items-center gap-6 py-2 px-4 bg-muted/50 rounded-lg", className)}>
                <MetricCompact
                    icon={<MailOpen className="h-4 w-4" />}
                    value={`${metrics.openRate}%`}
                    label="Abertura"
                    colorClass="text-green-600"
                />
                <MetricCompact
                    icon={<MousePointerClick className="h-4 w-4" />}
                    value={`${metrics.clickRate}%`}
                    label="Cliques"
                    colorClass="text-purple-600"
                />
                <MetricCompact
                    icon={<MessageSquare className="h-4 w-4" />}
                    value={metrics.replied}
                    label="Respostas"
                    colorClass="text-blue-600"
                />
                {metrics.bounced > 0 && (
                    <MetricCompact
                        icon={<AlertTriangle className="h-4 w-4" />}
                        value={metrics.bounced}
                        label="Bounces"
                        colorClass="text-red-600"
                    />
                )}
            </div>
        )
    }

    return (
        <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6", className)}>
            <MetricCard
                label="Total"
                value={metrics.total}
                icon={<Users className="h-5 w-5" />}
                iconColor="text-slate-500"
            />
            <MetricCard
                label="Enviados"
                value={metrics.sent}
                subValue={metrics.sent === metrics.total ? "100% enviado" : `${metrics.total - metrics.sent} pendentes`}
                icon={<Mail className="h-5 w-5" />}
                iconColor="text-blue-500"
            />
            <MetricCard
                label="Abertos"
                value={metrics.opened}
                subValue={`${metrics.openRate}% taxa de abertura`}
                icon={<MailOpen className="h-5 w-5" />}
                iconColor="text-green-500"
                trend={metrics.openRate > 20 ? "up" : "neutral"}
            />
            <MetricCard
                label="Cliques"
                value={metrics.clicked}
                subValue={`${metrics.clickRate}% taxa de cliques`}
                icon={<MousePointerClick className="h-5 w-5" />}
                iconColor="text-purple-500"
                trend={metrics.clickRate > 3 ? "up" : "neutral"}
            />
            <MetricCard
                label="Respostas"
                value={metrics.replied}
                subValue={`${metrics.replyRate}% taxa de resposta`}
                icon={<MessageSquare className="h-5 w-5" />}
                iconColor="text-indigo-500"
                trend={metrics.replied > 0 ? "up" : "neutral"}
            />
            <MetricCard
                label="Bounces"
                value={metrics.bounced}
                subValue={metrics.bounced === 0 ? "Nenhum erro" : "Emails inválidos"}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconColor={metrics.bounced > 0 ? "text-red-500" : "text-slate-400"}
            />
        </div>
    )
}

// ============================================
// METRIC COMPACT (for cards)
// ============================================

interface MetricCompactProps {
    icon: React.ReactNode
    value: number | string
    label: string
    colorClass: string
}

function MetricCompact({ icon, value, label, colorClass }: MetricCompactProps) {
    return (
        <div className="text-center">
            <div className={cn("flex items-center justify-center gap-1", colorClass)}>
                {icon}
                <span className="font-semibold">{value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    )
}