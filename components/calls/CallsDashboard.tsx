// components/calls/CallsDashboard.tsx

"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { CallsPerDayChart } from "@/components/calls/charts/CallsPerDayChart"
import { CallsByResultChart } from "@/components/calls/charts/CallsByResultChart"
import { CallsDurationChart } from "@/components/calls/charts/CallsDurationChart"
import { CallsConversionFunnel } from "@/components/calls/charts/CallsConversionFunnel"

import {
    getCallsPerDayData,
    getCallsByResultData,
    getCallsDurationData,
    getCallsConversionData,
} from "@/actions/calls"
import { CallResult } from "@prisma/client"

// ============================================
// TYPES
// ============================================

interface CallsDashboardProps {
    workspaceId: string
}

interface ChartData {
    perDay: { date: string; total: number; answered: number; interested: number }[]
    byResult: { result: CallResult; label: string; count: number; color: string }[]
    duration: { date: string; avgDuration: number; totalCalls: number }[]
    conversion: {
        totalCalls: number
        answered: number
        interested: number
        meetingsScheduled: number
        answeredRate: number
        interestedRate: number
        meetingRate: number
    }
}

// ============================================
// COMPONENT
// ============================================

export function CallsDashboard({ workspaceId }: CallsDashboardProps) {
    const [data, setData] = useState<ChartData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setIsLoading(true)
            try {
                const [perDay, byResult, duration, conversion] = await Promise.all([
                    getCallsPerDayData(workspaceId, 30),
                    getCallsByResultData(workspaceId),
                    getCallsDurationData(workspaceId, 30),
                    getCallsConversionData(workspaceId),
                ])

                setData({ perDay, byResult, duration, conversion })
            } catch (error) {
                console.error("Erro ao carregar dados dos gráficos:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [workspaceId])

    if (isLoading) {
        return <DashboardSkeleton />
    }

    if (!data) {
        return null
    }

    // Verifica se tem dados suficientes
    const hasData = data.conversion.totalCalls > 0

    if (!hasData) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">Sem dados para exibir</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                        Registre algumas ligações para ver os gráficos de performance.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Ligações por Dia */}
            <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Ligações por Dia</CardTitle>
                    </div>
                    <CardDescription>Últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                    <CallsPerDayChart data={data.perDay} />
                </CardContent>
            </Card>

            {/* Por Resultado */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Por Resultado</CardTitle>
                    </div>
                    <CardDescription>Distribuição das ligações</CardDescription>
                </CardHeader>
                <CardContent>
                    <CallsByResultChart data={data.byResult} />
                </CardContent>
            </Card>

            {/* Funil de Conversão */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Funil de Conversão</CardTitle>
                    </div>
                    <CardDescription>Taxa de sucesso das ligações</CardDescription>
                </CardHeader>
                <CardContent>
                    <CallsConversionFunnel data={data.conversion} />
                </CardContent>
            </Card>

            {/* Duração Média */}
            <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Duração Média por Dia</CardTitle>
                    </div>
                    <CardDescription>Tempo médio de conversa (últimos 30 dias)</CardDescription>
                </CardHeader>
                <CardContent>
                    <CallsDurationChart data={data.duration} />
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================
// SKELETON
// ============================================

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}