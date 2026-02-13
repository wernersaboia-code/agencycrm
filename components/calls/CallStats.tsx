// components/calls/CallStats.tsx

"use client"

import {
    Phone,
    PhoneOff,
    ThumbsUp,
    Calendar,
    Clock,
    TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CallResult } from "@prisma/client"
import { formatCallDuration } from "@/lib/constants/call.constants"

// ============================================
// TYPES
// ============================================

interface CallStatsProps {
    stats: {
        total: number
        byResult: Record<CallResult, number>
        avgDuration: number
        pendingCallbacks: number
    }
}

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    trend?: "up" | "down" | "neutral"
    trendValue?: string
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, subtitle, icon, trend, trendValue }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        {icon}
                    </div>
                </div>
                {trend && trendValue && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                        <TrendingUp
                            className={`h-3 w-3 ${
                                trend === "up"
                                    ? "text-green-500"
                                    : trend === "down"
                                        ? "text-red-500"
                                        : "text-gray-500"
                            }`}
                        />
                        <span
                            className={
                                trend === "up"
                                    ? "text-green-500"
                                    : trend === "down"
                                        ? "text-red-500"
                                        : "text-gray-500"
                            }
                        >
              {trendValue}
            </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CallStats({ stats }: CallStatsProps) {
    // Calcula métricas derivadas
    const answeredCalls =
        (stats.byResult.ANSWERED || 0) +
        (stats.byResult.INTERESTED || 0) +
        (stats.byResult.NOT_INTERESTED || 0) +
        (stats.byResult.CALLBACK || 0) +
        (stats.byResult.MEETING_SCHEDULED || 0)

    const positiveCalls =
        (stats.byResult.INTERESTED || 0) +
        (stats.byResult.CALLBACK || 0) +
        (stats.byResult.MEETING_SCHEDULED || 0)

    const successRate = stats.total > 0 ? (positiveCalls / stats.total) * 100 : 0

    const answerRate = stats.total > 0 ? (answeredCalls / stats.total) * 100 : 0

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total de Ligações"
                value={stats.total}
                subtitle="Todas as ligações registradas"
                icon={<Phone className="h-5 w-5" />}
            />

            <StatCard
                title="Taxa de Atendimento"
                value={`${answerRate.toFixed(0)}%`}
                subtitle={`${answeredCalls} atendidas`}
                icon={<PhoneOff className="h-5 w-5" />}
            />

            <StatCard
                title="Taxa de Sucesso"
                value={`${successRate.toFixed(0)}%`}
                subtitle={`${positiveCalls} resultados positivos`}
                icon={<ThumbsUp className="h-5 w-5" />}
            />

            <StatCard
                title="Callbacks Pendentes"
                value={stats.pendingCallbacks}
                subtitle={
                    stats.avgDuration > 0
                        ? `Duração média: ${formatCallDuration(stats.avgDuration)}`
                        : "Nenhum callback agendado"
                }
                icon={<Calendar className="h-5 w-5" />}
            />
        </div>
    )
}