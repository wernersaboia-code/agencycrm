// components/calls/charts/CallsByResultChart.tsx

"use client"

import { useMemo } from "react"
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { CallResult } from "@prisma/client"

// ============================================
// TYPES
// ============================================

interface CallsByResultChartProps {
    data: { result: CallResult; label: string; count: number; color: string }[]
}

// ============================================
// COMPONENT
// ============================================

export function CallsByResultChart({ data }: CallsByResultChartProps) {
    const chartData = useMemo(() => {
        // Pega os top 6 resultados
        return data.slice(0, 6)
    }, [data])

    const total = useMemo(() => {
        return data.reduce((sum, item) => sum + item.count, 0)
    }, [data])

    if (chartData.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem dados
            </div>
        )
    }

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const item = payload[0].payload
                            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
                            return (
                                <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                                    <p className="font-medium">{item.label}</p>
                                    <p>
                                        <span className="font-semibold">{item.count}</span> ligações ({percentage}%)
                                    </p>
                                </div>
                            )
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}