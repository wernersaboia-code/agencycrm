// components/calls/charts/CallsDurationChart.tsx

"use client"

import { useMemo } from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

// ============================================
// TYPES
// ============================================

interface CallsDurationChartProps {
    data: { date: string; avgDuration: number; totalCalls: number }[]
}

// ============================================
// HELPERS
// ============================================

function formatDuration(seconds: number): string {
    if (seconds === 0) return "0s"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    if (secs === 0) return `${mins}min`
    return `${mins}min ${secs}s`
}

// ============================================
// COMPONENT
// ============================================

export function CallsDurationChart({ data }: CallsDurationChartProps) {
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            dateFormatted: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
            avgDurationMins: Math.round(item.avgDuration / 60 * 10) / 10, // Converte para minutos
        }))
    }, [data])

    const avgOverall = useMemo(() => {
        const withDuration = data.filter((d) => d.avgDuration > 0)
        if (withDuration.length === 0) return 0
        return Math.round(
            withDuration.reduce((sum, d) => sum + d.avgDuration, 0) / withDuration.length
        )
    }, [data])

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Média geral:</span>
                <span className="font-semibold">{formatDuration(avgOverall)}</span>
            </div>
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis
                            dataKey="dateFormatted"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}min`}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null
                                const item = payload[0].payload
                                return (
                                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                                        <p className="font-medium mb-1">{label}</p>
                                        <p>
                                            Duração média:{" "}
                                            <span className="font-semibold">
                                                {formatDuration(item.avgDuration)}
                                            </span>
                                        </p>
                                        <p className="text-muted-foreground">
                                            {item.totalCalls} ligações
                                        </p>
                                    </div>
                                )
                            }}
                        />
                        <Bar
                            dataKey="avgDurationMins"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}